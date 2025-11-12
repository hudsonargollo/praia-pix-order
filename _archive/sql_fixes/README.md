# Archived SQL Files

**Archive Date:** November 12, 2025  
**Total Files:** 85  
**Reason:** Repository organization refactor - moving historical SQL fixes and one-off scripts out of root directory

## Overview

This directory contains SQL scripts that were created during development for various fixes, debugging, and one-off database operations. These files are preserved for historical reference but are no longer needed in the root directory.

**Important:** All essential schema changes have been properly migrated to `supabase/migrations/`. The files here are primarily:
- Historical fixes that have been superseded by migrations
- Debugging and diagnostic queries
- One-off administrative operations
- Multiple iterations of the same fix

## File Categories

### Essential Schema Changes (Already in Migrations)

These files contain schema changes that are now properly handled by migration files in `supabase/migrations/`:

- **CREATE_WHATSAPP_SESSIONS_TABLE.sql** - WhatsApp sessions table (covered by migration 20251107000001)
- **CREATE_WHATSAPP_TABLES.sql** - WhatsApp notifications and related tables (covered by migration 20251107000002, 20251107000003, 20251107000004, 20251107000005)
- **create-profiles-table-now.sql** - Profiles table creation (covered by migration 20251111000001)
- **fix-payment-webhooks-table.sql** - Payment webhooks table (covered by migration 20251111000004)
- **SETUP_DATABASE_COMPLETE.sql** - Comprehensive setup (various migrations cover these changes)

### Admin Account Management

Multiple iterations of admin account creation and fixes:

- ADD_IMAGES.sql
- CHANGE_ADMIN_PASSWORD.sql
- CHECK_EXISTING_ACCOUNTS.sql
- CREATE_ACCOUNTS_BASIC.sql
- CREATE_ADMIN_ACCOUNT.sql
- CREATE_NEW_ADMIN.sql
- CREATE_OR_UPDATE_ADMIN.sql
- CREATE_STAFF_ACCOUNTS.sql
- CREATE_STAFF_ACCOUNTS_SIMPLE.sql
- DELETE_AND_CREATE_ADMIN.sql
- FIX_ADMIN_ROLE_SIMPLE.sql
- FIX_ADMIN_WITH_TRIGGER.sql
- FIX_ALL_ADMIN_ISSUES.sql
- SIMPLE_ADMIN_FIX.sql
- UPDATE_EXISTING_ADMIN.sql
- apply-admin-rls-fix.sql
- debug-admin-access.sql
- fix-admin-now.sql
- fix-admin-profile.sql
- set-admin-metadata.sql
- verify-admin-role.sql

**Status:** Historical - Admin account management is now handled through proper migrations and the admin panel

### Waiter Management

Multiple iterations of waiter account creation and management:

- CHECK_WAITER_ROLE.sql
- CREATE_WAITER_FINAL.sql
- CREATE_WAITER_FIXED.sql
- CREATE_WAITER_GARCOM_FIXED.sql
- CREATE_WAITER_GARCOM2.sql
- CREATE_WAITER_MINIMAL.sql
- CREATE_WAITER_SIMPLE.sql
- CREATE_WAITER_SIMPLE_GARCOM2.sql
- CREATE_WAITER_SQL.sql
- CREATE_WAITER_WORKING.sql
- FIX_EXISTING_WAITER.sql
- FIX_WAITER_AUTH_COMPLETE.sql
- FIX_WAITER_SIMPLE.sql
- UPDATE_WAITER_FUNCTION.sql
- WAITER_FIX_ALTERNATIVE.sql
- WAITER_MANAGEMENT_DB_FUNCTIONS.sql
- check-waiter-orders-issue.sql
- fix-waiter-orders-tracking.sql
- verify-waiter-orders-fix.sql

**Status:** Historical - Waiter management is now handled through migrations 20251108150000, 20251108150001, 20251110000001, 20251110000002

### RLS (Row Level Security) Fixes

Various iterations of RLS policy fixes:

- FIX_ORDERS_RLS_POLICY.sql
- FIX_PAYMENT_RLS_SIMPLE.sql
- SIMPLE_FIX_ORDERS_RLS.sql
- fix-customer-order-rls-safe.sql
- fix-orders-1-and-2.sql
- fix-rls-policies.sql
- fix-storage-and-menu-rls.sql
- minimal-rls-fix.sql
- test-rls-policies.sql
- test-rls-simple.sql

**Status:** Historical - RLS policies are now properly defined in migrations 20251111000002, 20251111000003

### Order Management Fixes

One-off fixes for order-related issues:

- FIX_ORDER_CREATION.sql
- FIX_ORDER_NOTES_NOW.sql
- TEST_ORDERS_SIMPLE.sql
- fix-all-stuck-orders.sql
- manual-fix-order-status.sql

**Status:** Historical - Order management is now stable with proper migrations

### Payment System

Payment-related fixes and debugging:

- DIAGNOSE_PAYMENT_ISSUE.sql
- TEST_PAYMENT_CONFIRMATION.sql
- fix-payment-webhooks-table.sql

**Status:** Historical - Payment system is now handled by migration 20251111000004, 20251111000005

### Product Management

Product-related setup and fixes:

- ADD_SAMPLE_PRODUCTS.sql
- ADD_TEST_PRODUCT.sql
- ADD_TEST_PRODUCT_FIXED.sql
- CREATE_PRODUCT_IMAGES_BUCKET.sql
- DIAGNOSE_PRODUCTS.sql

**Status:** Historical - Product management is stable

### WhatsApp Integration

WhatsApp notification setup and fixes:

- CREATE_WHATSAPP_SESSIONS_TABLE.sql
- CREATE_WHATSAPP_TABLES.sql
- INIT_WHATSAPP_TEMPLATES.sql
- check-notification-status.sql
- check-webhook-logs.sql
- check-whatsapp-issue.sql

**Status:** Historical - WhatsApp integration is now handled by migrations 20251107000001-20251107000005, 20251111000006

### Diagnostic and Debugging Queries

Queries used for debugging and checking system state:

- CHECK_EXISTING_ACCOUNTS.sql
- CHECK_WAITER_ROLE.sql
- VERIFY_SETUP.sql
- check-auth-schema.sql
- check-existing-policies.sql
- check-notification-status.sql
- check-recent-activity.sql
- check-waiter-orders-issue.sql
- check-webhook-logs.sql
- check-whatsapp-issue.sql
- debug-admin-access.sql
- verify-admin-role.sql
- verify-waiter-orders-fix.sql

**Status:** Obsolete - These were one-off diagnostic queries

### Utility and Setup Scripts

General utility scripts:

- CREATE_USERS_VIEW.sql
- FIX_IDENTITIES.sql
- RUN_ALL_FUNCTIONS.sql
- RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql
- SETUP_DATABASE_COMPLETE.sql
- SIMPLE_FIX.sql
- SUPERUSER_FIX.sql
- TEST_RPC_FUNCTION.sql
- create-get-user-role-function.sql
- fix-profiles-complete.sql

**Status:** Historical - Functionality is now in proper migrations

### Mark Ready Function

- ADD_MARK_READY_FUNCTION.sql

**Status:** Historical - This function is now part of the order management system

## Review Findings (November 12, 2025)

After comprehensive review of all 85 archived SQL files, the following essential schema elements were identified:

### ✅ Already in Migrations
- All table schemas (orders, menu_items, profiles, customers, etc.)
- All RLS policies
- WhatsApp integration tables
- Payment webhooks
- Waiter management functions
- Order management functions

### ✅ Migrated (November 12, 2025)
The following essential schema elements were identified as missing and have been added to migrations:

1. **get_user_role() function** - Used in:
   - `src/components/ProtectedRoute.tsx`
   - `src/pages/public/Auth.tsx`
   - `src/pages/waiter/WaiterDiagnostic.tsx`
   - **Migration:** `20251112000001_create_get_user_role_function.sql`

2. **product-images storage bucket** - Used in:
   - `src/pages/admin/AdminProducts.tsx`
   - `src/pages/debug/SystemDiagnostic.tsx`
   - **Migration:** `20251112000002_create_product_images_bucket.sql`

### ❌ Not Used (Historical)
- `mark_order_ready()` function - Not referenced in codebase
- All admin account creation scripts - Superseded by admin panel
- All waiter creation scripts - Superseded by waiter management
- All diagnostic queries - One-off debugging
- All RLS fix iterations - Final versions in migrations

## Migration Status

All essential database schema changes from these files have been incorporated into the proper migration files in `supabase/migrations/`. The current migration files cover:

1. **20251103200030** - Initial schema
2. **20251103204248** - Additional tables
3. **20251105000001** - Enable pgcrypto
4. **20251106000001** - Payment fields in orders
5. **20251106000002** - Payment webhooks table
6. **20251106000003** - WhatsApp notifications table
7. **20251106000005** - Sample images
8. **20251106000007** - Test product
9. **20251107000001** - WhatsApp sessions table
10. **20251107000002** - Update WhatsApp notifications
11. **20251107000003** - Notification templates
12. **20251107000004** - WhatsApp error logs
13. **20251107000005** - WhatsApp opt-out
14. **20251107000006** - Make table number nullable
15. **20251107000007** - Missing payment fields
16. **20251108000001** - Soft delete
17. **20251108000002** - Fix order update RLS
18. **20251108150000** - Waiter module fields
19. **20251108150001** - Waiter RPC function
20. **20251110000001** - Enhance waiter order management
21. **20251110000002** - Waiter order functions
22. **20251110000003** - Create customers table
23. **20251111000001** - Create profiles table
24. **20251111000002** - Fix admin RLS policies
25. **20251111000003** - Fix customer order creation RLS
26. **20251111000004** - Create payment webhooks table
27. **20251111000005** - Fix confirm payment status
28. **20251111000006** - Update WhatsApp notifications schema
29. **20251112000001** - Create get_user_role function (consolidated from archived files)
30. **20251112000002** - Create product-images storage bucket (consolidated from archived files)

## When to Reference These Files

These archived files may be useful for:

1. **Historical Context** - Understanding how certain features evolved
2. **Debugging** - Seeing what fixes were attempted for specific issues
3. **Learning** - Understanding the development process and problem-solving approaches
4. **Rollback Reference** - If a migration needs to be recreated, these show the original intent

## Important Notes

- **Do not run these files directly** - They may conflict with current migrations
- **Schema changes should go in migrations** - Use `supabase migration new <name>` for new schema changes
- **One-off fixes should be documented** - If you need to run a one-off fix, document it properly
- **Test locally first** - Always test database changes on local Supabase before production

## Related Documentation

- Main project README: `../../README.md`
- Development notes archive: `../dev_notes/README.md`
- Test scripts archive: `../test_scripts/README.md`
- Supabase migrations: `../../supabase/migrations/`

---

*This archive was created as part of the repository organization refactor to improve maintainability and reduce root directory clutter.*
