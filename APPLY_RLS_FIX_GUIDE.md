# How to Apply Admin RLS Fix

## Option 1: Via Supabase Dashboard (Recommended)

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `sntxekdwdllwkszclpiq`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste SQL**
   - Open the file: `apply-admin-rls-fix.sql`
   - Copy all the SQL content
   - Paste into the SQL Editor

4. **Run the Query**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for completion message

5. **Verify Success**
   - You should see: "RLS policies updated successfully for admin operations"
   - A table showing the applied policies will appear

### Expected Output:
```
NOTICE: RLS policies updated successfully for admin operations

tablename      | policyname                    | cmd    | operation
---------------|-------------------------------|--------|----------
order_items    | Staff can insert order items  | INSERT | Create
order_items    | Staff can update order items  | UPDATE | Update
order_items    | Staff can delete order items  | DELETE | Delete
orders         | Admin full access to orders   | ALL    | All Operations
menu_items     | Admins can manage menu items  | ALL    | All Operations
menu_categories| Admins can manage menu categories | ALL | All Operations
```

---

## Option 2: Via Supabase CLI (If Docker is running)

### Prerequisites:
- Docker Desktop running
- Local Supabase instance started

### Steps:

```bash
# Start local Supabase (if not running)
supabase start

# Apply migration
supabase db push

# Or apply specific migration
supabase migration up
```

---

## Option 3: Via psql (Direct Database Connection)

### Prerequisites:
- Database connection string
- psql installed

### Steps:

```bash
# Connect to database
psql "postgresql://postgres:[PASSWORD]@db.sntxekdwdllwkszclpiq.supabase.co:5432/postgres"

# Copy and paste the SQL from apply-admin-rls-fix.sql
# Or run from file:
\i apply-admin-rls-fix.sql
```

---

## After Applying the Fix

### Test the Features:

1. **Test Product Edit**
   - Go to `/admin/products`
   - Click "Editar Produto"
   - Make changes and save
   - Should work without errors ✅

2. **Test Order Edit**
   - Go to `/cashier`
   - Click "Editar" on any order
   - Add/remove items, change quantities
   - Save changes
   - Should work without errors ✅

3. **Test Waiter Management**
   - Go to `/waiter-management`
   - List should load (no "Nenhum garçom cadastrado" error)
   - Create/delete waiters should work ✅

---

## Troubleshooting

### Error: "has_role function does not exist"

**Solution**: You need to create the has_role function first.

Run this SQL first:
```sql
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Try to get role from profiles table
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  -- If not found in profiles, try auth.users metadata
  IF user_role IS NULL THEN
    SELECT 
      COALESCE(
        raw_user_meta_data->>'role',
        raw_app_meta_data->>'role'
      ) INTO user_role
    FROM auth.users
    WHERE id = user_id;
  END IF;
  
  RETURN user_role = role_name;
END;
$$;
```

Then run the RLS fix SQL again.

### Error: "permission denied for table"

**Solution**: Make sure you're running the SQL as a superuser (postgres role) in Supabase Dashboard.

### Policies not taking effect

**Solution**: 
1. Clear browser cache
2. Logout and login again
3. Check that your user has the 'admin' role set

---

## Verification

After applying, verify the policies are active:

```sql
-- Check order_items policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'order_items' 
  AND policyname LIKE '%Staff%';

-- Should return 3 policies: INSERT, UPDATE, DELETE

-- Check orders policies  
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders' 
  AND policyname LIKE '%Admin%';

-- Should return 1 policy: ALL

-- Check menu_items policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'menu_items' 
  AND policyname LIKE '%Admin%';

-- Should return 1 policy: ALL
```

---

## Status

- ✅ SQL file created: `apply-admin-rls-fix.sql`
- ⏳ Waiting to be applied to database
- ⏳ Testing pending

---

**Next Step**: Apply the SQL via Supabase Dashboard (Option 1 - Recommended)
