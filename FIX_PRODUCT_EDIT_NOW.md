# Fix Product Edit - RLS Policy Issue

## 🔴 Problem Identified

The console shows RLS (Row Level Security) errors:
```
Error: new row violates row-level security policy
```

This means the database is blocking:
1. **Image uploads** to storage bucket
2. **Product updates** to menu_items table

## ✅ Solution

Apply the SQL fix to add proper RLS policies for storage and menu_items.

---

## 📋 Quick Fix Steps

### 1. Open Supabase Dashboard
```
https://supabase.com/dashboard
→ Project: sntxekdwdllwkszclpiq
→ SQL Editor
→ New Query
```

### 2. Copy & Paste SQL
```
Open file: fix-storage-and-menu-rls.sql
Copy all content
Paste in SQL Editor
Click "Run" (or Cmd+Enter)
```

### 3. Verify Success
Look for messages:
```
✅ "Storage and menu_items RLS policies updated successfully"
✅ Table showing policies for storage.objects
✅ Table showing policies for storage.buckets
✅ Table showing policies for menu_items
```

### 4. Test Again
1. Logout and login again (important!)
2. Go to `/admin/products`
3. Click "Editar Produto"
4. Try to change name or upload image
5. Click "Salvar"
6. Should work now! ✅

---

## 🔍 What the Fix Does

### Storage Policies (for images):
- ✅ Admin can upload images to product-images bucket
- ✅ Admin can update images
- ✅ Admin can delete images
- ✅ Public can view images

### Menu Items Policies:
- ✅ Admin can INSERT menu items
- ✅ Admin can UPDATE menu items
- ✅ Admin can DELETE menu items
- ✅ Public can view available menu items

### Bucket Management:
- ✅ Admin can manage storage buckets
- ✅ Public can view buckets

---

## ⚠️ Important Notes

### 1. Logout/Login Required
After applying the SQL, you MUST:
1. Logout from the app
2. Login again
3. This refreshes your session with new permissions

### 2. Check Admin Role
Your user must have `role: 'admin'` set. Verify with:
```sql
SELECT 
  email,
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users
WHERE email = 'your-email@example.com';
```

Should show `admin` in either user_role or app_role.

### 3. Alternative: Simpler Policy
If the above doesn't work, try this simpler version:

```sql
-- Simpler storage policy (allows all authenticated users)
DROP POLICY IF EXISTS "Authenticated can upload" ON storage.objects;
CREATE POLICY "Authenticated can upload" ON storage.objects
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Simpler menu_items policy
DROP POLICY IF EXISTS "Authenticated can manage menu" ON public.menu_items;
CREATE POLICY "Authenticated can manage menu" ON public.menu_items
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 🧪 Testing Checklist

After applying fix and logging back in:

### Test 1: Edit Product Name
- [ ] Go to `/admin/products`
- [ ] Click "Editar Produto"
- [ ] Change product name
- [ ] Click "Salvar"
- [ ] Success toast appears
- [ ] Name updates in list
- [ ] No console errors

### Test 2: Upload Product Image
- [ ] Click "Editar Produto"
- [ ] Click "Choose File"
- [ ] Select an image
- [ ] Wait for upload
- [ ] Success toast appears
- [ ] Image displays in form
- [ ] Click "Salvar"
- [ ] Image persists

### Test 3: Edit Product Price
- [ ] Click "Editar Produto"
- [ ] Change price
- [ ] Click "Salvar"
- [ ] Price updates
- [ ] No errors

---

## 🔧 Troubleshooting

### Still Getting RLS Errors?

1. **Check if policies were created**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

2. **Check your session**:
   ```sql
   SELECT auth.uid(), auth.role();
   ```
   Should return your user ID and 'authenticated'

3. **Check has_role function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'has_role';
   ```
   Should return 'has_role'

### If has_role function is missing:

Run this first:
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
  SELECT 
    COALESCE(
      raw_user_meta_data->>'role',
      raw_app_meta_data->>'role'
    ) INTO user_role
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_role = role_name;
END;
$$;
```

Then run the fix-storage-and-menu-rls.sql again.

---

## 📞 Next Steps

1. **Apply the SQL fix** (5 minutes)
2. **Logout and login** (1 minute)
3. **Test product edit** (2 minutes)
4. **Report results** - does it work now?

If it still doesn't work after this, share:
- The exact error message from console
- Result of the admin role check SQL
- Result of the policies check SQL

---

**File to Use**: `fix-storage-and-menu-rls.sql`  
**Time Needed**: ~10 minutes  
**Success Rate**: High (this is the correct fix for RLS errors)
