# End-to-End Testing Manual Guide

## Prerequisites

Before running the automated tests, you need to ensure the admin user has the correct role in the profiles table.

### Step 1: Fix Admin Profile

Run the following SQL in your Supabase SQL Editor:

```sql
-- Insert or update the profile to ensure admin role
INSERT INTO public.profiles (id, role, updated_at)
SELECT 
  id,
  'admin',
  NOW()
FROM auth.users
WHERE email = 'admin@cocoloko.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Verify the fix
SELECT 
  u.id,
  u.email,
  p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@cocoloko.com';
```

You should see output showing `profile_role: admin`.

### Step 2: Run Automated Tests

Once the admin profile is fixed, run:

```bash
./run-e2e-tests.sh
```

Or with custom credentials:

```bash
npx tsx test-waiter-management-e2e.ts admin@cocoloko.com 123456
```

---

## Manual Testing Guide

If you prefer to test manually, follow these steps:

### Test 6.1: Complete Waiter Management Workflow

1. **Login as admin user**
   - Go to: https://your-app-url/auth
   - Email: `admin@cocoloko.com`
   - Password: `123456`
   - ✅ Should redirect to admin dashboard

2. **Navigate to waiter management page**
   - Go to: https://your-app-url/admin/waiters
   - ✅ Should see the waiter management interface

3. **Create a new waiter account**
   - Click "Add New Waiter" button
   - Fill in:
     - Email: `test-waiter@cocoloko.com`
     - Password: `test123`
     - Full Name: `Test Waiter`
   - Click "Create Waiter"
   - ✅ Should see success message

4. **Verify waiter appears in list**
   - Check the waiter list
   - ✅ Should see "Test Waiter" in the list

5. **Delete the test waiter account**
   - Find "Test Waiter" in the list
   - Click the delete button
   - Confirm deletion
   - ✅ Should see success message

6. **Verify waiter is removed from list**
   - Check the waiter list
   - ✅ "Test Waiter" should no longer appear

---

### Test 6.2: Error Scenarios

1. **Attempt to create waiter with duplicate email**
   - Create a waiter: `duplicate@cocoloko.com`
   - Try to create another waiter with same email
   - ✅ Should see error: "User already exists" or similar

2. **Attempt to create waiter with invalid email format**
   - Try to create waiter with email: `not-an-email`
   - ✅ Should see error: "Invalid email format" or similar

3. **Attempt to create waiter with missing fields**
   - Try to create waiter without filling all fields
   - ✅ Should see validation errors

4. **Verify appropriate error messages display**
   - ✅ All error messages should be clear and user-friendly

---

### Test 6.3: Authentication and Authorization

1. **Verify non-admin users cannot access waiter management**
   - Logout from admin account
   - Login as a waiter (if you have one)
   - Try to access: https://your-app-url/admin/waiters
   - ✅ Should be redirected or see "Access Denied"

2. **Test with expired session token**
   - Login as admin
   - Wait for session to expire (or manually clear session)
   - Try to perform any waiter management action
   - ✅ Should be redirected to login

3. **Verify proper redirect to login when unauthorized**
   - Open browser in incognito mode
   - Try to access: https://your-app-url/admin/waiters
   - ✅ Should redirect to login page

---

## Expected Results Summary

### All Tests Should Pass:
- ✅ Admin can login successfully
- ✅ Admin can view waiter list
- ✅ Admin can create new waiters
- ✅ Admin can delete waiters
- ✅ Duplicate emails are rejected
- ✅ Invalid emails are rejected
- ✅ Missing fields are validated
- ✅ Non-admin users cannot access waiter management
- ✅ Unauthorized access redirects to login

---

## Troubleshooting

### "Forbidden: Admin access required" Error

This means the admin user doesn't have the correct role in the profiles table. Run the SQL fix from Step 1.

### "Invalid login credentials" Error

Verify the admin credentials:
- Email: `admin@cocoloko.com`
- Password: `123456`

### Edge Functions Not Working

1. Check that Edge Functions are deployed:
   ```bash
   supabase functions list
   ```

2. Check Edge Function logs:
   ```bash
   supabase functions logs list-waiters
   supabase functions logs create-waiter
   supabase functions logs delete-waiter
   ```

### Frontend Not Loading

1. Check browser console for errors
2. Verify environment variables are set
3. Check that the app is running: `npm run dev`

---

## Requirements Coverage

This test suite validates:

- **Requirement 1.1**: Admin can view list of waiters
- **Requirement 1.5**: Admin can delete waiter accounts
- **Requirement 2.1**: System creates waiter accounts with email/password
- **Requirement 2.3**: System validates email format
- **Requirement 2.5**: System prevents duplicate emails
- **Requirement 3.1**: Waiter list displays correctly
- **Requirement 3.4**: Delete confirmation works
- **Requirement 3.5**: Success/error messages display
- **Requirement 5.1**: Only admins can access waiter management
- **Requirement 5.2**: Unauthorized users are redirected
- **Requirement 5.3**: Duplicate emails show error
- **Requirement 5.4**: Invalid emails show error
- **Requirement 5.5**: Missing fields show error
- **Requirement 6.3**: Error messages are clear
- **Requirement 6.5**: UI updates after operations
