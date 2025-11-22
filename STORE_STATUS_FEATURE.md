# Store Open/Close Feature

## Overview
This feature allows cashiers to open and close the digital menu, preventing customers from placing orders when the store is closed.

## What Was Added

### 1. Database Migration
- **File**: `supabase/migrations/20251121000001_create_store_settings_table.sql`
- Creates `store_settings` table to track if the store is open/closed
- Adds `get_store_status()` function to check store status
- Adds `update_store_status(boolean)` function for admin/cashier to toggle status
- Includes RLS policies for security

### 2. React Hook
- **File**: `src/hooks/useStoreStatus.ts`
- Custom hook to manage store status
- Real-time updates via Supabase subscriptions
- `toggleStoreStatus()` function to switch between open/closed

### 3. Cashier Interface
- **File**: `src/pages/staff/Cashier.tsx`
- Added store status switch in the header
- Shows "Aberto" (Open) or "Fechado" (Closed) with color indicator
- Green switch when open, red when closed

### 4. Customer Menu
- **File**: `src/pages/customer/Menu.tsx`
- Checks store status before allowing orders
- Shows prominent "Loja Fechada" banner when closed
- Disables all "Add to Cart" buttons when closed
- Prevents checkout when store is closed
- Shows "Fechado" text on disabled buttons

## How to Deploy

### Step 1: Apply Database Migration
Run the migration in your Supabase dashboard or via CLI:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Copy and paste the contents of:
# supabase/migrations/20251121000001_create_store_settings_table.sql
```

### Step 2: Deploy Code
The code changes are already in place. Just deploy your application:

```bash
npm run build
# Then deploy to your hosting platform
```

## How to Use

### For Cashiers
1. Log in to the cashier dashboard at `/cashier`
2. Look for the store status switch in the header (top right area)
3. Toggle the switch to open/close the store
4. When closed, customers cannot add items to cart or checkout

### For Customers
- When store is open: Normal menu experience
- When store is closed:
  - Red banner appears: "Loja Fechada - Não estamos aceitando pedidos no momento"
  - All "Adicionar" buttons show "Fechado" and are disabled
  - Cannot add items to cart
  - Cannot proceed to checkout

## Technical Details

### Real-time Updates
- Store status changes are broadcast in real-time
- All connected clients (cashier and customer) see updates immediately
- Uses Supabase real-time subscriptions

### Security
- Only users with `admin` or `cashier` role can change store status
- Enforced at database level via RLS policies
- Function uses `SECURITY DEFINER` for proper permission checking

### Default State
- Store is **open** by default
- Status persists across sessions
- Survives application restarts

## Testing

1. **Open the cashier dashboard** in one browser window
2. **Open the customer menu** in another window (or incognito)
3. **Toggle the store status** in the cashier dashboard
4. **Verify** the customer menu updates immediately:
   - Banner appears/disappears
   - Buttons become enabled/disabled
   - Toast notifications appear

## Rollback

If you need to rollback this feature:

```sql
-- Remove the functions
DROP FUNCTION IF EXISTS update_store_status(BOOLEAN);
DROP FUNCTION IF EXISTS get_store_status();

-- Remove the table
DROP TABLE IF EXISTS store_settings;
```

Then revert the code changes in the three modified files.
