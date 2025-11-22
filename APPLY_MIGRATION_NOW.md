# ✅ Migration Fixed - Apply Now!

## The Issue
The migration was calling `get_user_role()` without the required `user_id` parameter.

## The Fix
Updated to call `get_user_role(auth.uid())` correctly.

---

## 🚀 Apply the Migration (Choose One Method)

### Method 1: Copy & Paste in Supabase SQL Editor (Easiest)

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

2. **Copy the ENTIRE migration below** and paste it:

```sql
-- Create store_settings table to manage store open/close status
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default row (store is open by default)
INSERT INTO store_settings (is_open) VALUES (true);

-- Create function to get store status
CREATE OR REPLACE FUNCTION get_store_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  store_open BOOLEAN;
BEGIN
  SELECT is_open INTO store_open FROM store_settings LIMIT 1;
  RETURN COALESCE(store_open, true);
END;
$$;

-- Create function to update store status (admin/cashier only)
CREATE OR REPLACE FUNCTION update_store_status(new_status BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role using auth.uid()
  SELECT get_user_role(auth.uid()) INTO user_role;
  
  -- Only admin and cashier can update store status
  IF user_role NOT IN ('admin', 'cashier') THEN
    RAISE EXCEPTION 'Unauthorized: Only admin and cashier can update store status';
  END IF;
  
  -- Update store status
  UPDATE store_settings 
  SET is_open = new_status, 
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE id = (SELECT id FROM store_settings LIMIT 1);
  
  RETURN new_status;
END;
$$;

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read store status
CREATE POLICY "Anyone can read store status"
  ON store_settings
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users with admin/cashier role can update
CREATE POLICY "Admin and cashier can update store status"
  ON store_settings
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'cashier')
  );

-- Add comment
COMMENT ON TABLE store_settings IS 'Stores global settings like whether the store is open for orders';
COMMENT ON FUNCTION get_store_status() IS 'Returns whether the store is currently accepting orders';
COMMENT ON FUNCTION update_store_status(BOOLEAN) IS 'Updates store open/closed status (admin/cashier only)';
```

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify Success** - You should see: "Success. No rows returned"

---

### Method 2: Using Supabase CLI

```bash
# Pull latest code
git pull origin main

# Apply migration
supabase db push
```

---

## ✅ Verify Migration Success

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check table exists and has data
SELECT * FROM store_settings;
-- Expected: One row with is_open = true

-- 2. Test get_store_status function
SELECT get_store_status();
-- Expected: true

-- 3. Test update function (as admin/cashier)
SELECT update_store_status(false);
-- Expected: false

-- 4. Verify it changed
SELECT * FROM store_settings;
-- Expected: is_open = false

-- 5. Set it back to open
SELECT update_store_status(true);
-- Expected: true
```

---

## 🎉 After Migration Success

1. **Refresh your cashier dashboard**: https://fc66c71d.praia-pix-order.pages.dev/cashier
2. **Look for the switch** in the header
3. **Toggle it** and watch the magic happen!

---

## 🔧 If You Still Get Errors

### Error: "function get_user_role() does not exist"
**Solution**: The `get_user_role(uuid)` function needs to exist first. Check if this migration exists:
```sql
SELECT * FROM pg_proc WHERE proname = 'get_user_role';
```

If it doesn't exist, you need to apply migration: `20251112000001_create_get_user_role_function.sql` first.

### Error: "permission denied"
**Solution**: Make sure you're logged in as a user with admin or cashier role in your application.

---

## 📝 What Changed

**Before (Broken)**:
```sql
SELECT get_user_role() INTO user_role;  -- ❌ Missing parameter
```

**After (Fixed)**:
```sql
SELECT get_user_role(auth.uid()) INTO user_role;  -- ✅ Correct
```

---

**Ready to apply?** Copy the SQL above and paste it into Supabase SQL Editor!
