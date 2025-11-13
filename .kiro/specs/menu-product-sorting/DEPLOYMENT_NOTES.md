# Menu Product Sorting - Deployment Notes

## Deployment Date
November 13, 2025

## Summary
Successfully implemented manual drag-and-drop sorting for menu products within categories. The feature allows admin users to reorder products on the customer-facing menu page and through a dedicated sorting interface in the admin panel.

## Changes Deployed

### Database Changes
- ✅ Added `sort_order` column to `menu_items` table (INTEGER, default 0)
- ✅ Created index on `(category_id, sort_order)` for efficient queries
- ✅ Added `updated_at` column with automatic trigger
- ✅ Created RPC function `update_menu_items_sort_order` for batch updates
- ✅ Updated RLS policies to allow admin-only sort order updates

### Frontend Changes
- ✅ Installed @dnd-kit packages (core, sortable, utilities, modifiers)
- ✅ Created type definitions in `src/types/menu-sorting.ts`
- ✅ Implemented custom hooks:
  - `useSortingMode` - Toggle sorting mode state
  - `useAdminCheck` - Check admin status
  - `useMenuSorting` - Handle reordering and API calls
- ✅ Created drag-and-drop components:
  - `DraggableProductCard` - Draggable product wrapper
  - `SortableProductList` - Sortable list container
  - `SortingToggle` - Toggle button for sorting mode
  - `SortingDialog` - Dedicated sorting interface
- ✅ Updated `Menu.tsx` with live sorting functionality
- ✅ Updated `AdminProducts.tsx` with sorting dialog access
- ✅ Updated Supabase types to include `sort_order` and `updated_at`

### Features Implemented
1. **Live Sorting on Menu Page (Admin Only)**
   - Toggle button "Organizar Itens" visible only to admins
   - Drag handles appear when sorting mode is enabled
   - Visual feedback during drag (elevation, opacity, drop indicators)
   - Add-to-cart buttons disabled during sorting
   - Category boundaries enforced (no cross-category dragging)

2. **Dedicated Sorting Interface**
   - Accessible from "Organizar Ordem no Menu" button in admin products page
   - Modal dialog with category-specific product list
   - Save/Cancel functionality
   - Immediate reflection on menu page after save

3. **Error Handling**
   - Permission checks (admin-only access)
   - Session expiration handling with redirect to login
   - Network error handling with retry logic (max 3 attempts)
   - Optimistic updates with rollback on failure
   - User-friendly error messages

4. **Accessibility Features**
   - Keyboard navigation support (Tab, Arrow keys, Enter/Space)
   - Screen reader announcements for drag operations
   - ARIA labels and roles
   - Visual indicators for drag state

## Pre-Deployment Checklist
- ✅ Database migration created and tested
- ✅ TypeScript types updated
- ✅ All components have no diagnostics
- ✅ Build completes successfully
- ✅ Dev server runs without errors
- ✅ Error handling implemented
- ✅ Accessibility features added

## Deployment Steps

### 1. Database Migration
Run the migration on production database:
```bash
# If using Supabase CLI
npx supabase db push

# Or run the SQL file directly in Supabase SQL Editor
# File: supabase/migrations/20251113000001_add_sort_order_to_menu_items.sql
```

### 2. Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages (or your hosting provider)
# The build output is in the dist/ directory
```

### 3. Verification Steps
After deployment:
1. ✅ Verify admin users can see "Organizar Itens" button on menu page
2. ✅ Verify customers do NOT see sorting controls
3. ✅ Test drag-and-drop functionality
4. ✅ Test sorting dialog from admin products page
5. ✅ Verify sort order persists after page reload
6. ✅ Test on mobile devices for touch support
7. ✅ Test keyboard navigation
8. ✅ Verify error handling (network errors, permission errors)

## Monitoring

### Metrics to Track
- Sort operations per day
- Average time spent in sorting mode
- Error rates for sort operations
- Most frequently reordered categories

### Error Monitoring
Watch for these errors in logs:
- "Only admins can update sort order" - Permission denied
- "JWT" errors - Session expiration
- Network/fetch errors - Connection issues
- RPC function errors - Database issues

## Rollback Plan
If issues arise:
1. Disable sorting toggle by setting a feature flag (if implemented)
2. Revert frontend deployment to previous version
3. Database changes are backward compatible (sort_order has default value)
4. No data loss - existing products will continue to work

## Known Limitations
- Concurrent updates use last-write-wins strategy
- Sort order is per-category only (no global sorting)
- No undo/redo functionality
- No sorting history/audit log

## Future Enhancements
- Add undo/redo functionality
- Implement sorting history/audit log
- Add bulk operations (move to top/bottom)
- Add category reordering
- Add drag-and-drop between categories with confirmation

## Support
For issues or questions:
- Check error logs in browser console
- Check Supabase logs for RPC function errors
- Verify admin role is correctly assigned in profiles table
- Test with different browsers and devices
