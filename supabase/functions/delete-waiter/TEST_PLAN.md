# Delete Waiter Function - Testing Guide

## Prerequisites

1. Supabase project with admin user
2. At least one test waiter account
3. Admin JWT token for authentication

## Getting Admin Token

```bash
# Login to get session
# Visit your app at /auth and login as admin
# Open browser console and run:
const session = await supabase.auth.getSession()
console.log(session.data.session.access_token)
```

## Test Execution Steps

### Setup Test Data

1. Create a test waiter account first:
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/create-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-waiter-delete@example.com",
    "password": "test123456",
    "full_name": "Test Waiter Delete"
  }'
```

2. Save the returned userId for testing

### Test Case 1: Successful Deletion ✅

**Expected**: 200 OK with success message

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"waiterId\": \"${TEST_WAITER_ID}\"}"
```

**Expected Response**:
```json
{
  "message": "Waiter deleted successfully",
  "userId": "uuid-here"
}
```

**Verification**:
- Check Supabase Auth dashboard - user should be gone
- Try to login with deleted waiter credentials - should fail

### Test Case 2: Missing waiterId ❌

**Expected**: 400 Bad Request

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Expected Response**:
```json
{
  "error": "Waiter ID is required"
}
```

### Test Case 3: Invalid UUID Format ❌

**Expected**: 400 Bad Request

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"waiterId": "not-a-uuid"}'
```

**Expected Response**:
```json
{
  "error": "Invalid waiter ID format"
}
```

### Test Case 4: Non-Existent Waiter ❌

**Expected**: 404 Not Found

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"waiterId": "00000000-0000-0000-0000-000000000000"}'
```

**Expected Response**:
```json
{
  "error": "Waiter not found"
}
```

### Test Case 5: No Authorization Header ❌

**Expected**: 401 Unauthorized

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Content-Type: application/json" \
  -d "{\"waiterId\": \"${TEST_WAITER_ID}\"}"
```

**Expected Response**:
```json
{
  "error": "Unauthorized"
}
```

### Test Case 6: Non-Admin User ❌

**Expected**: 403 Forbidden

```bash
# First get a waiter or kitchen user token
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${NON_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"waiterId\": \"${TEST_WAITER_ID}\"}"
```

**Expected Response**:
```json
{
  "error": "Forbidden: Admin access required"
}
```

### Test Case 7: Attempt to Delete Non-Waiter ❌

**Expected**: 400 Bad Request

```bash
# Try to delete an admin or kitchen user
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"waiterId\": \"${ADMIN_USER_ID}\"}"
```

**Expected Response**:
```json
{
  "error": "User is not a waiter"
}
```

## Integration Test with Frontend

### Test in AdminWaiters Component

1. Navigate to `/admin/waiters` (after implementing task 2.1)
2. Create a test waiter
3. Verify waiter appears in list
4. Click delete button
5. Confirm deletion
6. Verify waiter is removed from list
7. Check Supabase Auth dashboard to confirm deletion

## Monitoring & Logs

### Check Function Logs

```bash
# View recent logs
supabase functions logs delete-waiter --limit 50

# Follow logs in real-time
supabase functions logs delete-waiter --follow
```

### Expected Log Entries

**Successful deletion**:
```
Deleting waiter: uuid-here Email: test@example.com
Successfully deleted waiter: uuid-here
```

**Validation errors**:
```
Missing waiterId in request body
Invalid waiterId format: not-a-uuid
User not found: uuid-here
Attempted to delete non-waiter user: uuid-here Role: admin
```

## Rollback Plan

If issues occur in production:

1. Redeploy previous version:
```bash
git checkout previous-commit
supabase functions deploy delete-waiter
```

2. Temporarily disable function in frontend (task 2.1)

3. Investigate logs and fix issues

4. Redeploy fixed version

## Success Criteria

- ✅ All test cases return expected status codes
- ✅ All test cases return expected error messages
- ✅ Successful deletion removes user from Auth system
- ✅ Deleted users cannot login
- ✅ Non-admin users cannot delete waiters
- ✅ Invalid inputs are properly rejected
- ✅ Logs provide clear debugging information

## Notes

- Always test with non-production data first
- Keep admin credentials secure
- Monitor logs after deployment
- Test all error scenarios before production use
