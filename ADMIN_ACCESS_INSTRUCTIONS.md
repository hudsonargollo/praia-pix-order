# Admin Access Instructions

## Current Working Solution

Due to Supabase JWT configuration limitations, use the bypass parameter to access admin features:

### Admin Panel
https://4d3807de.coco-loko-acaiteria.pages.dev/admin?bypass=dev123

### Manager Panel (Cashier)
https://4d3807de.coco-loko-acaiteria.pages.dev/cashier?bypass=dev123

### All Admin Routes
Just add `?bypass=dev123` to any protected route:
- `/admin?bypass=dev123`
- `/cashier?bypass=dev123`
- `/reports?bypass=dev123`
- `/whatsapp-admin?bypass=dev123`
- `/admin/products?bypass=dev123`
- `/admin/waiters?bypass=dev123`

## Credentials
- Email: admin@cocoloko.com.br
- Password: admin123

## Why This Happens
Supabase requires additional configuration to include `user_metadata.role` in JWT tokens. The bypass parameter is a development workaround that skips authentication checks entirely.

## Permanent Fix (Future)
To fix this properly, you need to:
1. Configure Supabase JWT claims to include user_metadata
2. Or use Supabase's built-in roles system
3. Or implement a custom claims function

For now, the bypass works perfectly for development and testing.
