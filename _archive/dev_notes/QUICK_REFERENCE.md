# 🔧 Quick Reference - Coco Loko System

## 🚀 Quick Actions

### Create New Waiter
```sql
-- Use CREATE_WAITER_FIXED.sql
-- Change these 3 lines:
waiter_email TEXT := 'new@email.com';
waiter_password TEXT := 'password123';
waiter_name TEXT := 'Waiter Name';
-- Run in Supabase SQL Editor
```

### Add New Product
1. Go to `/admin/products`
2. Click "Novo Produto"
3. Fill form and save

### Check System Status
- Go to `/diagnostic` (admin login required)
- Shows all system health checks

---

## 🔗 Important URLs

| Function | URL | Access |
|----------|-----|--------|
| Customer Menu | `/menu` | Public |
| Waiter Login | `/auth` | Waiter credentials |
| Admin Panel | `/admin` | Admin credentials |
| Waiter Management | `/admin/waiters` | Admin only |
| Product Management | `/admin/products` | Admin only |
| WhatsApp Admin | `/whatsapp-admin` | Admin only |
| System Diagnostic | `/diagnostic` | Admin only |

---

## 👥 User Roles & Credentials

### Admin
- **Access:** Full system control
- **Login:** `/auth`
- **Redirects to:** `/admin`

### Waiter (Example)
- **Email:** `garcom1@cocoloko.com`
- **Password:** `garcom123`
- **Access:** Waiter dashboard
- **Redirects to:** `/waiter-dashboard`

### Kitchen Staff
- **Email:** `kitchen@cocoloko.com.br`
- **Password:** `kitchen123`
- **Redirects to:** `/kitchen`

### Cashier
- **Email:** `cashier@cocoloko.com.br`
- **Password:** `cashier123`
- **Redirects to:** `/cashier`

---

## 🛠️ Troubleshooting

### "Admin panel not working"
1. Hard refresh: `Cmd+Shift+R`
2. Try incognito window
3. Clear browser cache

### "Can't login"
1. Check credentials
2. Verify user exists in database
3. Run `FIX_EXISTING_WAITER.sql` if needed

### "Products not showing"
1. Run `DIAGNOSE_PRODUCTS.sql`
2. Check if products marked as available
3. Verify categories exist

---

## 📊 System Health

### Supabase Edge Functions
```bash
supabase functions list
# Should show: create-waiter, list-waiters, delete-waiter (all ACTIVE)
```

### Database Check
```sql
-- Check waiters
SELECT email, raw_user_meta_data->>'full_name' as name
FROM auth.users 
WHERE raw_app_meta_data->>'role' = 'waiter';

-- Check products
SELECT COUNT(*) as total_products FROM menu_items WHERE available = true;
```

---

## 🔧 Maintenance Tasks

### Weekly
- [ ] Check system diagnostic page
- [ ] Verify WhatsApp connection
- [ ] Review error logs

### Monthly
- [ ] Update product prices if needed
- [ ] Review waiter accounts
- [ ] Check storage usage

### As Needed
- [ ] Create new waiter accounts
- [ ] Add/remove products
- [ ] Update menu categories

---

## 📞 Emergency Contacts

### Technical Issues
- **Supabase:** https://supabase.com/dashboard/support
- **Cloudflare:** https://dash.cloudflare.com/
- **Evolution API:** Check server status

### Quick Fixes
- **Cache Issues:** Hard refresh browser
- **Login Problems:** Check user metadata
- **Function Errors:** Check Supabase logs

---

## 🎯 Key Files

### SQL Scripts
- `CREATE_WAITER_FIXED.sql` - Create waiters
- `DIAGNOSE_PRODUCTS.sql` - Check products
- `FIX_EXISTING_WAITER.sql` - Fix auth issues

### Documentation
- `FINAL_SUCCESS_SUMMARY.md` - Complete overview
- `QUICK_REFERENCE.md` - This file
- `COMPLETE_STATUS.md` - Detailed status

---

**System Status: ✅ Fully Operational**
**Last Updated:** November 2025
**All Issues:** ✅ Resolved