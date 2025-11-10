# Troubleshooting Guide - Coco Loko Açaiteria

## Common Issues and Solutions

### 1. Orders Not Showing in Admin Panel (Pedidos)

**Symptoms:**
- Cashier/Admin panel shows no orders
- Orders list is empty

**Solutions:**

1. **Hard Refresh Browser**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open in incognito/private mode

2. **Check Database Connection**
   - Verify Supabase is running
   - Check RLS (Row Level Security) policies
   - Ensure admin user has proper permissions

3. **Verify Orders Exist**
   - Go to Supabase dashboard
   - Check `orders` table
   - Ensure `deleted_at` is NULL

4. **Check Console for Errors**
   - Open browser DevTools (F12)
   - Look for red errors in Console tab
   - Check Network tab for failed requests

**Fixed Issues:**
- ✅ Logo import added to Cashier.tsx (commit 58c9c55)
- ✅ Orders query filters out deleted orders

### 2. Edit Products Not Working

**Symptoms:**
- Click edit button but nothing happens
- Dialog doesn't open
- Changes don't save

**Solutions:**

1. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
   - Clear all cached data

2. **Check for JavaScript Errors**
   - Open DevTools Console (F12)
   - Look for errors when clicking edit

3. **Verify Dialog State**
   - The edit function sets `isDialogOpen` to true
   - Check if dialog component is rendered

4. **Image Upload Issues**
   - Max file size: 5MB
   - Only image files accepted
   - Check Supabase storage permissions

**Current Implementation:**
- Edit button calls `handleEdit(item)`
- Sets `editingItem` state
- Populates form with current values
- Opens dialog with `setIsDialogOpen(true)`

### 3. Menu Not Loading or Looks Wrong

**Symptoms:**
- Categories not showing
- Items missing
- Layout broken

**Solutions:**

1. **Force Deployment**
   ```bash
   git commit --allow-empty -m "Force deployment"
   git push origin main
   ```

2. **Wait for Cloudflare**
   - Deployments take 2-5 minutes
   - Check https://dash.cloudflare.com/

3. **Clear All Caches**
   - Browser cache (Ctrl+Shift+R)
   - Cloudflare cache (Purge Everything)

**Recent Fixes:**
- ✅ Single sticky header with logo and categories (commit 41c1e3f)
- ✅ Removed duplicate logo
- ✅ Better mobile responsiveness

### 4. Mobile Layout Issues

**Symptoms:**
- Elements overflow screen
- Buttons too small
- Text unreadable

**Solutions:**

1. **Check Viewport**
   - Ensure `<meta name="viewport">` is set
   - Test on actual device, not just DevTools

2. **Recent Fixes Applied:**
   - ✅ Fixed cart button (sticky at bottom)
   - ✅ Removed bouncing icon
   - ✅ Prevented horizontal overflow
   - ✅ Better touch targets (min 44px)

### 5. Deployment Not Working

**Symptoms:**
- Push to GitHub but site doesn't update
- Changes not visible after 5+ minutes

**Solutions:**

1. **Verify Push Succeeded**
   ```bash
   git log --oneline -5
   git status
   ```

2. **Check Cloudflare Pages**
   - Go to dashboard
   - Look for latest deployment
   - Check build logs for errors

3. **Manual Trigger**
   ```bash
   git commit --allow-empty -m "Trigger deployment"
   git push origin main
   ```

4. **Purge Cloudflare Cache**
   - Dashboard → Caching → Purge Everything

### 6. Authentication Issues

**Symptoms:**
- Can't login
- Redirected to auth page
- "Not authenticated" errors

**Solutions:**

1. **Check Supabase Auth**
   - Verify email/password correct
   - Check user exists in auth.users
   - Verify role in user_metadata

2. **Clear Auth Tokens**
   - Logout completely
   - Clear browser storage
   - Login again

3. **Check RLS Policies**
   - Ensure policies allow user access
   - Verify role-based permissions

## Quick Fixes

### Force Fresh Deployment
```bash
npm run build
git add -A
git commit -m "Force deployment"
git push origin main
```

### Clear Everything
1. Hard refresh: `Ctrl+Shift+R`
2. Clear browser data
3. Open incognito mode
4. Wait 5 minutes for CDN

### Check Logs
1. Browser Console (F12)
2. Network tab for failed requests
3. Cloudflare Pages build logs
4. Supabase logs

## Contact Information

If issues persist:
1. Check GitHub Issues
2. Review Cloudflare build logs
3. Check Supabase dashboard
4. Review this troubleshooting guide

## Recent Updates

- **2024-11-10**: Menu redesign with single sticky header
- **2024-11-10**: Fixed button visibility issues
- **2024-11-10**: Added logo import to Cashier
- **2024-11-10**: Improved mobile layout
- **2024-11-10**: System status widget added
