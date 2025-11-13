# Design Document

## Overview

This document outlines the technical design for implementing manual drag-and-drop sorting of menu products within categories for the Coco Loko Açaiteria system. The solution provides two complementary approaches: live sorting on the customer-facing menu page (admin-only) and a dedicated sorting interface accessible from the admin product management section.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Menu Page (Customer + Admin)  │  Admin Products Page        │
│  - Display products             │  - Product CRUD             │
│  - Admin sorting toggle         │  - Sorting interface button │
│  - Drag-and-drop (admin only)   │                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layer                     │
├─────────────────────────────────────────────────────────────┤
│  - Authentication state (Supabase Auth)                      │
│  - Sorting mode state (React useState)                       │
│  - Product order state (React Query + optimistic updates)    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  - Supabase Client (read products)                           │
│  - Batch update sort order (RPC function)                    │
│  - Real-time subscriptions (optional)                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  menu_items table:                                           │
│  - Add sort_order column (integer, default 0)                │
│  - Index on (category_id, sort_order)                        │
│  - RLS policies for admin-only updates                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
Menu.tsx (Customer + Admin View)
├── useAuth() - Check if user is admin
├── useSortingMode() - Toggle sorting state
├── useMenuData() - Fetch and cache menu items
├── CategoryChips - Category navigation
├── ProductList (per category)
│   ├── DraggableProductCard (admin + sorting mode)
│   │   ├── DragHandle icon
│   │   ├── Product info
│   │   └── Disabled "Adicionar" button
│   └── ProductCard (customer or admin without sorting)
│       ├── Product info
│       └── Active "Adicionar" button
└── SortingToggle (admin only)

AdminProducts.tsx
├── ProductGrid
│   └── ProductCard
│       └── Edit button
└── ProductEditDialog
    ├── Form fields
    └── "Organizar Ordem no Menu" button
        └── Opens SortingDialog

SortingDialog.tsx (New Component)
├── Category selector
├── DraggableProductList
│   └── DraggableProductCard
└── Save/Cancel buttons
```

## Components and Interfaces

### 1. Database Schema Changes

#### Migration: Add sort_order column

```sql
-- Migration: 20251113000001_add_sort_order_to_menu_items.sql

-- Add sort_order column to menu_items
ALTER TABLE menu_items 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for efficient sorting queries
CREATE INDEX idx_menu_items_category_sort 
ON menu_items(category_id, sort_order);

-- Initialize sort_order for existing items (alphabetical within category)
WITH ranked_items AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY name) as rn
  FROM menu_items
)
UPDATE menu_items
SET sort_order = (SELECT rn FROM ranked_items WHERE ranked_items.id = menu_items.id);

-- Create RPC function for batch updating sort order
CREATE OR REPLACE FUNCTION update_menu_items_sort_order(
  item_updates JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update sort order';
  END IF;

  -- Update each item's sort_order
  FOR item IN SELECT * FROM jsonb_array_elements(item_updates)
  LOOP
    UPDATE menu_items
    SET sort_order = (item->>'sort_order')::INTEGER,
        updated_at = NOW()
    WHERE id = (item->>'id')::UUID;
  END LOOP;
END;
$$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Update RLS policies to allow admins to update sort_order
-- (Assuming existing RLS policies exist, we add specific policy for sort_order)
CREATE POLICY "Admins can update menu items sort order"
ON menu_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```

### 2. TypeScript Interfaces

```typescript
// src/types/menu-sorting.ts

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  available: boolean;
  image_url: string | null;
  sort_order: number; // NEW
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
}

export interface DragItem {
  id: string;
  index: number;
  categoryId: string;
}

export interface SortOrderUpdate {
  id: string;
  sort_order: number;
}

export interface UseSortingModeReturn {
  isSortingMode: boolean;
  toggleSortingMode: () => void;
  enableSortingMode: () => void;
  disableSortingMode: () => void;
}
```

### 3. Custom Hooks

#### useSortingMode Hook

```typescript
// src/hooks/useSortingMode.ts

import { useState, useCallback } from 'react';
import { UseSortingModeReturn } from '@/types/menu-sorting';

export const useSortingMode = (): UseSortingModeReturn => {
  const [isSortingMode, setIsSortingMode] = useState(false);

  const toggleSortingMode = useCallback(() => {
    setIsSortingMode(prev => !prev);
  }, []);

  const enableSortingMode = useCallback(() => {
    setIsSortingMode(true);
  }, []);

  const disableSortingMode = useCallback(() => {
    setIsSortingMode(false);
  }, []);

  return {
    isSortingMode,
    toggleSortingMode,
    enableSortingMode,
    disableSortingMode,
  };
};
```

#### useAdminCheck Hook

```typescript
// src/hooks/useAdminCheck.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check via RPC function
        const { data, error } = await supabase.rpc('get_user_role', {
          user_id: user.id
        });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === 'admin');
        }
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, loading };
};
```

#### useMenuSorting Hook

```typescript
// src/hooks/useMenuSorting.ts

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MenuItem, SortOrderUpdate } from '@/types/menu-sorting';

export const useMenuSorting = () => {
  const [isSaving, setIsSaving] = useState(false);

  const updateSortOrder = useCallback(async (updates: SortOrderUpdate[]) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('update_menu_items_sort_order', {
        item_updates: updates
      });

      if (error) throw error;

      toast.success('Ordem salva! ✓', {
        duration: 2000,
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast.error('Erro ao salvar ordem');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const reorderItems = useCallback((
    items: MenuItem[],
    startIndex: number,
    endIndex: number
  ): MenuItem[] => {
    const result = Array.from(items);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Update sort_order for all items
    return result.map((item, index) => ({
      ...item,
      sort_order: index
    }));
  }, []);

  return {
    updateSortOrder,
    reorderItems,
    isSaving
  };
};
```

### 4. Drag and Drop Implementation

We'll use `@dnd-kit` library for drag-and-drop functionality due to its:
- Touch support (mobile-friendly)
- Accessibility features
- Performance optimizations
- TypeScript support

#### Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### DraggableProductCard Component

```typescript
// src/components/DraggableProductCard.tsx

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { MenuItem } from '@/types/menu-sorting';

interface DraggableProductCardProps {
  item: MenuItem;
  isSortingMode: boolean;
  children: React.ReactNode;
}

export const DraggableProductCard = ({
  item,
  isSortingMode,
  children
}: DraggableProductCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    disabled: !isSortingMode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!isSortingMode) {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50 shadow-2xl' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      
      {/* Product Card with disabled state */}
      <div className={`${isSortingMode ? 'pl-12' : ''}`}>
        {children}
      </div>
    </div>
  );
};
```

#### SortableProductList Component

```typescript
// src/components/SortableProductList.tsx

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { MenuItem } from '@/types/menu-sorting';

interface SortableProductListProps {
  items: MenuItem[];
  categoryId: string;
  onReorder: (startIndex: number, endIndex: number) => void;
  children: React.ReactNode;
}

export const SortableProductList = ({
  items,
  categoryId,
  onReorder,
  children
}: SortableProductListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    onReorder(oldIndex, newIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
};
```

### 5. Sorting Toggle Component

```typescript
// src/components/SortingToggle.tsx

import { Button } from '@/components/ui/button';
import { ArrowUpDown, Check } from 'lucide-react';

interface SortingToggleProps {
  isSortingMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const SortingToggle = ({
  isSortingMode,
  onToggle,
  disabled = false
}: SortingToggleProps) => {
  return (
    <Button
      onClick={onToggle}
      disabled={disabled}
      variant={isSortingMode ? 'default' : 'outline'}
      className={`
        transition-all duration-300
        ${isSortingMode 
          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
          : 'bg-white/80 hover:bg-white text-gray-700 backdrop-blur-sm'
        }
      `}
    >
      {isSortingMode ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Modo Organização
        </>
      ) : (
        <>
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Organizar Itens
        </>
      )}
    </Button>
  );
};
```

### 6. Sorting Dialog Component

```typescript
// src/components/SortingDialog.tsx

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuItem, Category } from '@/types/menu-sorting';
import { SortableProductList } from './SortableProductList';
import { DraggableProductCard } from './DraggableProductCard';
import { useMenuSorting } from '@/hooks/useMenuSorting';
import { toast } from 'sonner';

interface SortingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  items: MenuItem[];
  onSave: () => void;
}

export const SortingDialog = ({
  open,
  onOpenChange,
  category,
  items: initialItems,
  onSave
}: SortingDialogProps) => {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const { updateSortOrder, reorderItems, isSaving } = useMenuSorting();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleReorder = (startIndex: number, endIndex: number) => {
    const reordered = reorderItems(items, startIndex, endIndex);
    setItems(reordered);
  };

  const handleSave = async () => {
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index
    }));

    const success = await updateSortOrder(updates);
    if (success) {
      onSave();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setItems(initialItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Organizar Ordem - {category.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arraste os itens para reorganizar a ordem no cardápio
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <SortableProductList
            items={items}
            categoryId={category.id}
            onReorder={handleReorder}
          >
            <div className="space-y-3">
              {items.map((item) => (
                <DraggableProductCard
                  key={item.id}
                  item={item}
                  isSortingMode={true}
                >
                  <div className="bg-white rounded-lg p-4 shadow-sm border flex items-center gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-purple-600 font-bold">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </DraggableProductCard>
              ))}
            </div>
          </SortableProductList>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Ordem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

## Data Models

### Updated menu_items Table Schema

```typescript
interface MenuItemsTable {
  id: string;                    // UUID, primary key
  name: string;                  // Product name
  description: string | null;    // Product description
  price: number;                 // Product price
  category_id: string;           // Foreign key to menu_categories
  available: boolean;            // Availability flag
  image_url: string | null;      // Product image URL
  sort_order: number;            // NEW: Sort order within category
  created_at: string;            // Timestamp
  updated_at: string;            // NEW: Last update timestamp
}
```

### Query Patterns

#### Fetch products sorted by sort_order

```typescript
const { data: menuItems } = await supabase
  .from('menu_items')
  .select('*')
  .eq('available', true)
  .order('category_id')
  .order('sort_order');
```

#### Batch update sort order

```typescript
const updates = [
  { id: 'uuid-1', sort_order: 0 },
  { id: 'uuid-2', sort_order: 1 },
  { id: 'uuid-3', sort_order: 2 },
];

await supabase.rpc('update_menu_items_sort_order', {
  item_updates: updates
});
```

## Error Handling

### Client-Side Error Handling

1. **Drag Operation Failures**
   - Revert to previous order on API failure
   - Show toast notification with error message
   - Log error to console for debugging

2. **Permission Errors**
   - Check admin status before enabling sorting mode
   - Show "Access Denied" message if non-admin attempts sorting
   - Redirect to login if session expired

3. **Network Errors**
   - Implement retry logic (max 3 attempts)
   - Show offline indicator
   - Queue updates for when connection restored

### Server-Side Error Handling

1. **RPC Function Validation**
   - Verify user is admin before processing
   - Validate all item IDs exist
   - Ensure sort_order values are valid integers
   - Return descriptive error messages

2. **Database Constraints**
   - Handle concurrent updates with optimistic locking
   - Validate foreign key constraints
   - Ensure data integrity with transactions

## Testing Strategy

### Unit Tests

1. **Hook Tests**
   - `useSortingMode`: Toggle functionality
   - `useAdminCheck`: Admin status detection
   - `useMenuSorting`: Reorder logic and API calls

2. **Component Tests**
   - `DraggableProductCard`: Render in sorting/normal mode
   - `SortingToggle`: Toggle behavior
   - `SortingDialog`: Save/cancel operations

### Integration Tests

1. **Menu Page Sorting Flow**
   - Admin logs in → sees sorting toggle
   - Enables sorting mode → drag handle appears
   - Drags item → visual feedback shown
   - Drops item → order saved to database
   - Disables sorting mode → normal view restored

2. **Admin Products Sorting Flow**
   - Opens sorting dialog from product edit
   - Reorders items within dialog
   - Saves changes → reflected on menu page
   - Cancels changes → original order maintained

### E2E Tests

1. **Customer Experience**
   - Customer views menu → no sorting controls visible
   - Products display in correct order
   - Add to cart functionality works normally

2. **Admin Experience**
   - Admin logs in → sorting controls appear
   - Reorders products → changes persist
   - Logs out → sorting controls disappear

### Accessibility Tests

1. **Keyboard Navigation**
   - Tab through draggable items
   - Use arrow keys to reorder (via @dnd-kit keyboard sensor)
   - Enter/Space to pick up/drop items

2. **Screen Reader Support**
   - Announce drag start/end
   - Describe current position
   - Provide instructions for keyboard users

## Performance Considerations

### Optimizations

1. **Lazy Loading**
   - Load @dnd-kit library only when sorting mode enabled
   - Use React.lazy() for SortingDialog component

2. **Debouncing**
   - Debounce sort order updates (500ms)
   - Batch multiple drag operations before saving

3. **Optimistic Updates**
   - Update UI immediately on drag
   - Revert on API failure
   - Show loading state during save

4. **Caching**
   - Cache menu items with React Query
   - Invalidate cache after sort order update
   - Use stale-while-revalidate strategy

### Performance Metrics

- Initial load time: < 2s
- Drag operation latency: < 16ms (60fps)
- Save operation: < 1s
- Cache invalidation: < 500ms

## Security Considerations

### Authentication & Authorization

1. **Admin-Only Access**
   - Verify admin role on client (UI hiding)
   - Enforce admin role on server (RPC function)
   - Use RLS policies for database-level security

2. **RPC Function Security**
   - Use SECURITY DEFINER for elevated privileges
   - Validate user role before any operations
   - Sanitize input parameters

3. **API Rate Limiting**
   - Limit sort order updates to 10 per minute per user
   - Implement exponential backoff on failures

### Data Validation

1. **Input Validation**
   - Ensure item IDs are valid UUIDs
   - Verify sort_order values are non-negative integers
   - Check category_id matches for all items in batch

2. **SQL Injection Prevention**
   - Use parameterized queries
   - Validate JSON input structure
   - Escape special characters

## Deployment Strategy

### Phase 1: Database Migration
1. Run migration to add sort_order column
2. Initialize sort_order for existing items
3. Create RPC function
4. Update RLS policies

### Phase 2: Backend Implementation
1. Deploy RPC function
2. Test with admin account
3. Verify permissions and error handling

### Phase 3: Frontend Implementation
1. Install @dnd-kit dependencies
2. Implement hooks and components
3. Update Menu.tsx with sorting toggle
4. Update AdminProducts.tsx with sorting dialog

### Phase 4: Testing & Rollout
1. Test on staging environment
2. Perform accessibility audit
3. Load testing with multiple concurrent users
4. Deploy to production
5. Monitor error logs and performance metrics

### Rollback Plan

If issues arise:
1. Disable sorting toggle via feature flag
2. Revert RPC function if database issues
3. Remove sort_order column if necessary (data preserved)
4. Fall back to alphabetical sorting

## Monitoring & Maintenance

### Metrics to Track

1. **Usage Metrics**
   - Number of sort operations per day
   - Average time spent in sorting mode
   - Most frequently reordered categories

2. **Performance Metrics**
   - API response times for sort updates
   - Client-side drag operation latency
   - Cache hit/miss rates

3. **Error Metrics**
   - Failed sort operations
   - Permission denied errors
   - Network timeout errors

### Maintenance Tasks

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Verify data integrity

2. **Monthly**
   - Analyze usage patterns
   - Optimize slow queries
   - Update dependencies

3. **Quarterly**
   - Accessibility audit
   - Security review
   - User feedback analysis
