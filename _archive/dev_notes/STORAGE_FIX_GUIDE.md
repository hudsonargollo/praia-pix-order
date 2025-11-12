# Storage Bucket Fix (Dashboard UI)

## Problem
The SQL can't modify storage policies because it requires superuser permissions.

## Solution
Set storage policies through Supabase Dashboard UI instead.

---

## Steps to Fix Storage (5 minutes)

### 1. Go to Storage Policies
1. Open https://supabase.com/dashboard
2. Select project: `sntxekdwdllwkszclpiq`
3. Click "Storage" in left sidebar
4. Click "Policies" tab

### 2. Add Policy for Objects
1. Find "objects" table
2. Click "New Policy"
3. Select "For full customization"
4. Fill in:
   - **Policy name**: `Authenticated can manage objects`
   - **Allowed operation**: `ALL`
   - **Policy definition (USING)**: 
     ```sql
     auth.role() = 'authenticated'
     ```
   - **Policy definition (WITH CHECK)**:
     ```sql
     auth.role() = 'authenticated'
     ```
5. Click "Review"
6. Click "Save policy"

### 3. Add Policy for Public Access
1. Click "New Policy" again
2. Select "For full customization"
3. Fill in:
   - **Policy name**: `Public can view images`
   - **Allowed operation**: `SELECT`
   - **Policy definition (USING)**:
     ```sql
     bucket_id = 'product-images'
     ```
4. Click "Review"
5. Click "Save policy"

### 4. Verify
You should now see two policies:
- ✅ Authenticated can manage objects (ALL)
- ✅ Public can view images (SELECT)

---

## Alternative: Simple Policy Template

If the above is too complex, use Supabase's policy templates:

1. Go to Storage → Policies
2. Click "New Policy"
3. Select template: "Allow authenticated users to upload"
4. Click "Use this template"
5. Save

---

## After Setting Storage Policies

1. Run `SIMPLE_FIX.sql` in SQL Editor (for menu_items and profiles)
2. Logout and login
3. Test product edit - should work now!

---

**Time**: 5 minutes  
**Difficulty**: Easy (just clicking in UI)
