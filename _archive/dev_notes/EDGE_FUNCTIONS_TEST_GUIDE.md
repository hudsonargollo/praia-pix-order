# Edge Functions Testing Guide

## Deployment Status

✅ All three Edge Functions have been successfully deployed to Supabase:

- `create-waiter` - Version 4, Status: ACTIVE
- `list-waiters` - Version 4, Status: ACTIVE  
- `delete-waiter` - Version 4, Status: ACTIVE

You can view them in the Supabase Dashboard:
https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/functions

## Testing Instructions

### Prerequisites

1. Ensure you have an admin account in the system
2. The admin account should have `role: "admin"` in the profiles table

### Option 1: Test via Frontend (Recommended)

1. Navigate to the Admin Waiters page in your application
2. Login with admin credentials (e.g., `admin@cocoloko.com.br` / `admin123`)
3. Test the following operations:
   - **List Waiters**: The page should load and display existing waiters
   - **Create Waiter**: Fill out the form and create a new test waiter
   - **Delete Waiter**: Delete the test waiter you just created

### Option 2: Test via Script

Run the automated test script with your admin credentials:

```bash
npx tsx test-edge-functions.ts <admin-email> <admin-password>
```

Example:
```bash
npx tsx test-edge-functions.ts admin@cocoloko.com.br admin123
```

The script will test:
1. ✅ Authentication with admin credentials
2. ✅ List all waiters
3. ✅ Create a test waiter
4. ✅ Delete the test waiter
5. ✅ Error handling for invalid inputs
6. ✅ Authentication requirement (reject unauthenticated requests)

### Option 3: Test via cURL

#### 1. Get Admin Session Token

First, authenticate to get a session token:

```bash
curl -X POST 'https://sntxekdwdllwkszclpiq.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudHhla2R3ZGxsd2tzemNscGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDQ1ODksImV4cCI6MjA3Nzc4MDU4OX0.aPQeASkYkf7jl3Sl-1GFHH7B8VU-pOtn5sYJKMs9u8I" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cocoloko.com.br",
    "password": "admin123"
  }'
```

Save the `access_token` from the response.

#### 2. Test list-waiters

```bash
curl -X POST 'https://sntxekdwdllwkszclpiq.supabase.co/functions/v1/list-waiters' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### 3. Test create-waiter

```bash
curl -X POST 'https://sntxekdwdllwkszclpiq.supabase.co/functions/v1/create-waiter' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-waiter@example.com",
    "password": "TestPassword123",
    "full_name": "Test Waiter"
  }'
```

#### 4. Test delete-waiter

```bash
curl -X POST 'https://sntxekdwdllwkszclpiq.supabase.co/functions/v1/delete-waiter' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "waiterId": "WAITER_USER_ID_FROM_CREATE"
  }'
```

## Expected Test Results

### ✅ Success Scenarios

1. **list-waiters**: Returns array of waiters with email, full_name, created_at
2. **create-waiter**: Returns `{ message: "...", userId: "..." }`
3. **delete-waiter**: Returns `{ message: "...", userId: "..." }`

### ✅ Error Scenarios

1. **401 Unauthorized**: Missing or invalid auth token
2. **403 Forbidden**: Non-admin user attempting operations
3. **400 Bad Request**: Invalid input (missing fields, invalid email, duplicate email)
4. **500 Internal Server Error**: Unexpected server errors

## Verification Checklist

- [ ] All three functions show as ACTIVE in Supabase Dashboard
- [ ] list-waiters returns current waiters with valid admin session
- [ ] create-waiter successfully creates a new waiter account
- [ ] delete-waiter successfully removes a waiter account
- [ ] Functions reject requests without authentication (401)
- [ ] Functions reject requests from non-admin users (403)
- [ ] Functions validate input and return appropriate errors (400)
- [ ] Frontend AdminWaiters page works correctly with deployed functions

## Troubleshooting

### "Invalid login credentials" error
- Verify the admin account exists in Supabase Auth
- Check that the password is correct
- Ensure the admin account has `role: "admin"` in the profiles table

### "403 Forbidden" error
- Verify the user has admin role in the profiles table
- Check that the Edge Function is correctly querying the profiles table

### "Function not found" error
- Verify functions are deployed: `supabase functions list --project-ref sntxekdwdllwkszclpiq`
- Check the function names match exactly: `create-waiter`, `list-waiters`, `delete-waiter`

## Next Steps

After successful testing:
1. Update the frontend AdminWaiters component to use these functions
2. Remove the old Cloudflare Functions implementation
3. Deploy the updated frontend to production
