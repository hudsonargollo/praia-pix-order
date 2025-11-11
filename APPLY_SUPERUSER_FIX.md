# Apply Superuser Fix - Step by Step Guide

## What This Fix Does

This SQL script fixes ALL admin feature issues by:
- ✅ Allowing authenticated users to upload/manage product images
- ✅ Allowing authenticated users to edit menu items
- ✅ Allowing authenticated users to manage menu categories
- ✅ Allowing authenticated users to manage waiter profiles
- ✅ Simplifying RLS policies to avoid permission conflicts

## How to Apply

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **Coco Loko Açaiteria**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Fix
1. Click **New Query** button
2. Copy the entire contents of `SUPERUSER_FIX.sql`
3. Paste into the query editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Success
You should see output like:
```
✅ ALL RLS POLICIES UPDATED SUCCESSFULLY!

📦 Storage (objects): Authenticated users can manage
📦 Storage (buckets): Authenticated users can manage
🍽️  Menu items: Authenticated users can manage
📂 Menu categories: Authenticated users can manage
👥 Profiles: Authenticated users can view/manage

⚠️  IMPORTANT: Logout and login again to refresh permissions!
```

### Step 4: Refresh Your Session
1. Go to your app: https://coco-loko-acaiteria.pages.dev
2. **Logout** from your account
3. **Login** again with your admin credentials
4. Navigate to Admin panel

### Step 5: Test Admin Features
Test each feature to confirm it works:

#### Test Product Edit
1. Go to Admin → Products
2. Click edit on any product
3. Change the name or price
4. Upload a new image
5. Click Save
6. ✅ Should save successfully

#### Test Waiter Management
1. Go to Admin → Waiters
2. Try to add a new waiter
3. Try to delete an existing waiter
4. ✅ Should work without errors

#### Test Category Management
1. Go to Admin → Categories
2. Try to edit a category
3. ✅ Should save successfully

## What Changed

### Before
- Complex RLS policies checking for admin role in metadata
- Policies conflicting with each other
- Storage policies too restrictive

### After
- Simple policies: authenticated users can manage everything
- No role checking (handled at app level)
- Storage fully accessible to authenticated users

## Troubleshooting

### If it still doesn't work:
1. **Clear browser cache** and reload
2. **Check browser console** for errors
3. **Verify you're logged in** as an authenticated user
4. **Check Supabase logs** in Dashboard → Logs

### If you see "permission denied":
- Make sure you logged out and back in
- Check that RLS is enabled on tables
- Verify policies were created (check SQL output)

## Next Steps

After applying this fix:
1. Test all admin features thoroughly
2. If everything works, commit and deploy
3. Consider adding proper role-based access control later if needed

## Files Involved
- `SUPERUSER_FIX.sql` - The fix script
- Tables affected: `menu_items`, `menu_categories`, `profiles`, `storage.objects`, `storage.buckets`
