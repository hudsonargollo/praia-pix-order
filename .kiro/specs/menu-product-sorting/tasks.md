# Implementation Plan

- [x] 1. Database schema and backend setup
  - Add sort_order column to menu_items table with default value 0
  - Create index on (category_id, sort_order) for efficient queries
  - Initialize sort_order for existing menu items based on alphabetical order within categories
  - Create RPC function update_menu_items_sort_order for batch updates with admin role validation
  - Add updated_at column and trigger if not exists
  - Update RLS policies to allow admins to update sort_order field
  - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Install dependencies and create type definitions
  - Install @dnd-kit/core, @dnd-kit/sortable, and @dnd-kit/utilities packages
  - Create src/types/menu-sorting.ts with MenuItem, Category, DragItem, SortOrderUpdate, and UseSortingModeReturn interfaces
  - Update MenuItem interface to include sort_order field
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implement custom hooks for sorting functionality
- [x] 3.1 Create useSortingMode hook
  - Implement state management for sorting mode toggle
  - Add toggleSortingMode, enableSortingMode, and disableSortingMode functions
  - _Requirements: 1.3, 1.4_

- [x] 3.2 Create useAdminCheck hook
  - Check user authentication status via Supabase
  - Query user role using get_user_role RPC function
  - Subscribe to auth state changes for real-time updates
  - Return isAdmin boolean and loading state
  - _Requirements: 1.1, 1.2, 6.5_

- [x] 3.3 Create useMenuSorting hook
  - Implement updateSortOrder function to call RPC endpoint
  - Create reorderItems function for local state updates
  - Add error handling with toast notifications
  - Implement isSaving state for loading indicators
  - _Requirements: 2.5, 3.4, 5.3_

- [x] 4. Build drag-and-drop components
- [x] 4.1 Create DraggableProductCard component
  - Integrate useSortable hook from @dnd-kit
  - Add drag handle with GripVertical icon
  - Implement visual feedback for dragging state (opacity, elevation)
  - Conditionally render based on isSortingMode prop
  - Apply left padding when sorting mode is active
  - _Requirements: 2.1, 2.2, 3.1, 3.5_

- [x] 4.2 Create SortableProductList component
  - Set up DndContext with sensors for pointer and keyboard
  - Configure collision detection with closestCenter
  - Implement restrictToVerticalAxis and restrictToParentElement modifiers
  - Handle onDragEnd event to trigger reorder callback
  - Prevent cross-category dragging by validating category boundaries
  - _Requirements: 2.1, 2.2, 8.1, 8.2_

- [x] 4.3 Create SortingToggle component
  - Display "Organizar Itens" button with ArrowUpDown icon
  - Show "Modo Organização" with Check icon when active
  - Apply purple gradient styling when sorting mode is enabled
  - Handle toggle click event
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 5. Create SortingDialog component for dedicated sorting interface
  - Build dialog with category title and instructions
  - Integrate SortableProductList for drag-and-drop
  - Display product cards with image, name, and price
  - Implement local state management for item order
  - Add Save and Cancel buttons in footer
  - Call updateSortOrder on save and close dialog
  - Reset to initial order on cancel
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Update Menu.tsx for Option A (live sorting on menu page)
- [x] 6.1 Integrate admin check and sorting mode hooks
  - Add useAdminCheck hook to detect admin users
  - Add useSortingMode hook for toggle state
  - Add useMenuSorting hook for reorder operations
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 6.2 Add SortingToggle to header
  - Render toggle button only when isAdmin is true
  - Position near category chips in header
  - Hide completely when user is not admin
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 6.3 Wrap product lists with SortableProductList
  - Apply SortableProductList wrapper per category
  - Pass category-filtered items to each list
  - Implement onReorder handler to update local state and call API
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 6.4 Update product card rendering with DraggableProductCard
  - Wrap existing product card JSX with DraggableProductCard
  - Pass isSortingMode prop from hook state
  - Disable "Adicionar" button when sorting mode is active
  - Apply visual styling to indicate disabled state
  - _Requirements: 2.1, 3.5, 7.1, 7.2, 7.3_

- [x] 6.5 Update menu items query to order by sort_order
  - Modify Supabase query to order by category_id then sort_order
  - Handle items without sort_order (default to end or alphabetical)
  - _Requirements: 5.1, 5.2_

- [x] 6.6 Implement optimistic updates and error handling
  - Update local state immediately on drag end
  - Show success toast on successful save
  - Revert to previous order on API failure
  - Display error toast with descriptive message
  - _Requirements: 2.5, 3.4, 5.3_

- [x] 7. Update AdminProducts.tsx for Option B (dedicated sorting interface)
- [x] 7.1 Add "Organizar Ordem no Menu" button to product management page
  - Place button in header or per-category section
  - Show button only for admin users
  - _Requirements: 4.1_

- [x] 7.2 Integrate SortingDialog component
  - Import and render SortingDialog with open state
  - Pass selected category and filtered items as props
  - Handle dialog open/close state
  - _Requirements: 4.2, 4.3_

- [x] 7.3 Implement onSave callback to refresh menu data
  - Invalidate React Query cache for menu items
  - Reload menu data after successful save
  - Show success notification
  - _Requirements: 4.4, 4.5, 5.3_

- [x] 8. Update database types in Supabase integration
  - Regenerate TypeScript types from Supabase schema
  - Verify sort_order field is included in menu_items type
  - Update any existing queries to include sort_order
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Add visual feedback and accessibility features
- [x] 9.1 Implement drag visual feedback
  - Add elevation/shadow during drag
  - Show drop target indicators between items
  - Apply opacity to dragged item
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 9.2 Add keyboard navigation support
  - Configure keyboard sensor in DndContext
  - Test tab navigation through items
  - Verify arrow key reordering works
  - _Requirements: 2.1, 2.2_

- [x] 9.3 Add screen reader announcements
  - Include aria-labels for drag handles
  - Announce drag start/end events
  - Describe current position in list
  - _Requirements: 2.1, 2.2_

- [x] 10. Implement error handling and edge cases
- [x] 10.1 Handle permission errors
  - Show "Access Denied" message for non-admin users attempting to sort
  - Redirect to login if session expired during sort operation
  - _Requirements: 6.5, 8.1, 8.2_

- [x] 10.2 Handle network errors
  - Implement retry logic with exponential backoff (max 3 attempts)
  - Show offline indicator when network unavailable
  - Queue updates for when connection restored
  - _Requirements: 2.5, 5.3_

- [x] 10.3 Handle concurrent updates
  - Implement optimistic locking in RPC function
  - Show warning if another admin modified order simultaneously
  - Provide option to reload or force save
  - _Requirements: 6.4_

- [x] 11. Testing and validation
- [x] 11.1 Write unit tests for hooks
  - Test useSortingMode toggle functionality
  - Test useAdminCheck admin detection
  - Test useMenuSorting reorder logic and API calls
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.5_

- [x] 11.2 Write component tests
  - Test DraggableProductCard in sorting and normal modes
  - Test SortingToggle button behavior
  - Test SortingDialog save and cancel operations
  - _Requirements: 1.3, 2.1, 4.3, 4.4_

- [x] 11.3 Perform manual integration testing
  - Test admin login and sorting toggle visibility
  - Test drag-and-drop on menu page with various categories
  - Test sorting dialog from admin products page
  - Verify customer view shows no sorting controls
  - Test on mobile devices for touch support
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_

- [x] 11.4 Perform accessibility audit
  - Test keyboard navigation with Tab and arrow keys
  - Test with screen reader (VoiceOver or NVDA)
  - Verify ARIA labels and announcements
  - Check color contrast for drag handles
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

- [x] 12. Deploy and monitor
  - Deploy database migration to production
  - Deploy frontend changes to production
  - Monitor error logs for sort operation failures
  - Track usage metrics (sort operations per day, categories reordered)
  - Verify performance metrics (drag latency, save operation time)
  - _Requirements: 5.3, 6.1, 6.2, 6.3, 6.4, 6.5_
