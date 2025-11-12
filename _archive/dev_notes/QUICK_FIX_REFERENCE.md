# Quick Fix Reference Card

## 🚨 Problem
Admin features not working:
- ❌ Cannot edit products
- ❌ Cannot edit orders  
- ❌ Waiter list not loading

## ✅ Solution
Apply RLS policy fix to database

## 📋 Quick Steps

### 1. Open Supabase Dashboard
```
https://supabase.com/dashboard
→ Project: sntxekdwdllwkszclpiq
→ SQL Editor
→ New Query
```

### 2. Copy & Paste SQL
```
Open file: apply-admin-rls-fix.sql
Copy all content
Paste in SQL Editor
Click "Run" (or Cmd+Enter)
```

### 3. Verify Success
Look for message:
```
✅ "RLS policies updated successfully for admin operations"
```

### 4. Test Features
- `/admin/products` → Click "Editar Produto" → Should work ✅
- `/cashier` → Click "Editar" on order → Should work ✅
- `/waiter-management` → List should load ✅

## 🔧 What the Fix Does

Adds missing database permissions:
- ✅ Staff can INSERT order items
- ✅ Staff can UPDATE order items
- ✅ Staff can DELETE order items
- ✅ Admin full access to orders
- ✅ Admin can manage menu items
- ✅ Admin can manage categories

## ⏱️ Time Required
- Apply fix: 2 minutes
- Test features: 5 minutes
- **Total: ~7 minutes**

## 📁 Files to Use
1. `apply-admin-rls-fix.sql` ← **Use this in Supabase Dashboard**
2. `APPLY_RLS_FIX_GUIDE.md` ← Detailed instructions
3. `test-admin-operations.md` ← Testing checklist

## 🆘 If It Doesn't Work

### Check 1: Policies Applied?
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'order_items' 
AND policyname LIKE '%Staff%';
```
Should return 3 policies.

### Check 2: Admin Role Set?
Check your user has `role: 'admin'` in metadata.

### Check 3: Logged In?
Logout and login again after applying fix.

## 📞 Need Help?
See detailed guides:
- `ADMIN_FEATURES_FIX_SUMMARY.md` - Complete overview
- `APPLY_RLS_FIX_GUIDE.md` - Step-by-step guide
- `test-admin-operations.md` - Testing guide

---

**Status**: Ready to apply  
**Risk**: Low (easily reversible)  
**Impact**: Fixes all admin edit features
