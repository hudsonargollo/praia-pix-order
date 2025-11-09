# 🔐 System Credentials

## 📍 Production URL
**https://1734beb7.coco-loko-acaiteria.pages.dev**

---

## 👨‍💼 Admin Account

**Email:** `admin@cocoloko.com.br`  
**Password:** `admin123`

**Access:**
- `/admin` - Admin dashboard
- `/admin/products` - Product management
- `/admin/waiters` - Waiter management
- `/reports` - Reports and analytics
- `/whatsapp-admin` - WhatsApp configuration
- `/cashier` or `/kitchen` - Manager panel

---

## 👨‍🍳 Kitchen/Cashier Staff

**Kitchen Email:** `kitchen@cocoloko.com.br`  
**Kitchen Password:** `kitchen123`

**Cashier Email:** `cashier@cocoloko.com.br`  
**Cashier Password:** `cashier123`

**Access:**
- `/kitchen` - Kitchen dashboard
- `/cashier` - Cashier dashboard

---

## 👔 Waiter Accounts

Waiters can be created through the admin panel at `/admin/waiters`

**Default waiter credentials** (if created):
- Email: Set by admin
- Password: Set by admin
- Access: `/waiter-dashboard`

---

## 🚀 Setup Instructions

### 1. Create Admin Account (REQUIRED)

Run this SQL in [Supabase SQL Editor](https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql):

```sql
-- Copy and paste from CREATE_ADMIN_ACCOUNT.sql
```

Or simply run the file: `CREATE_ADMIN_ACCOUNT.sql`

### 2. Create Staff Accounts (Optional)

Run this SQL in [Supabase SQL Editor](https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql):

```sql
-- Copy and paste from CREATE_STAFF_ACCOUNTS_SIMPLE.sql
```

Or simply run the file: `CREATE_STAFF_ACCOUNTS_SIMPLE.sql`

### 3. Login

1. Go to: https://1734beb7.coco-loko-acaiteria.pages.dev/auth
2. Enter email and password
3. You'll be redirected to the appropriate dashboard based on your role

---

## 🔧 Development Bypass

If you need to bypass authentication for testing:

Add `?bypass=dev123` to any protected route URL:
- Example: `https://1734beb7.coco-loko-acaiteria.pages.dev/admin?bypass=dev123`

⚠️ **This should only be used for development/testing!**

---

## 🔒 Security Notes

1. **Change all default passwords immediately after first login**
2. Use strong passwords for production
3. Never commit credentials to git
4. Store production credentials securely (password manager)
5. Rotate passwords regularly

---

## 📝 Role Permissions

### Admin
- Full system access
- Can manage products
- Can manage waiters
- Can view reports
- Can configure WhatsApp
- Can access manager panel

### Kitchen/Cashier
- Can view orders
- Can update order status
- Can send notifications
- Limited to manager panel

### Waiter
- Can create orders
- Can view own orders
- Can track commissions
- Limited to waiter dashboard

---

## ❓ Troubleshooting

### "Access Denied" Error
- Make sure you're logged in with the correct account
- Check that the account has the correct role in user_metadata
- Try logging out and logging back in

### Can't Login
- Verify the account exists in Supabase Auth
- Check that email is confirmed (email_confirmed_at is set)
- Verify the role is set in user_metadata

### Routes Not Working
- Make sure you're logged in
- Check browser console for errors
- Try adding `?bypass=dev123` to test if it's an auth issue

---

## 📞 Support

If you need help:
1. Check the browser console for errors
2. Check Supabase logs
3. Review the authentication flow in `src/components/ProtectedRoute.tsx`

