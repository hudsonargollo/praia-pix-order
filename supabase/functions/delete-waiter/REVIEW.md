# Delete Waiter Edge Function - Review & Test Plan

## Function Overview
**Location**: `supabase/functions/delete-waiter/index.ts`
**Purpose**: Delete waiter accounts from the system (admin-only operation)

## Authentication & Authorization Review ✅

### 1. Authentication Check
- ✅ Extracts Authorization header from request
- ✅ Creates Supabase client with user context
- ✅ Calls `auth.getUser()` to verify valid session
- ✅ Returns 401 Unauthorized if no user found

### 2. Admin Role Verification
- ✅ Queries `profiles` table for user role
- ✅ Checks if `role === 'admin'`
- ✅ Returns 403 Forbidden if not admin
- ✅ Proper error message: "Forbidden: Admin access required"

## Input Validation Review ✅

### 1. Request Body Validation
- ✅ Checks for `waiterId` field presence
- ✅ Returns 400 Bad Request if missing
- ✅ **NEW**: UUID format validation with regex
- ✅ **NEW**: Returns 400 for invalid UUID format

### 2. Waiter Existence Check
- ✅ **NEW**: Calls `auth.admin.getUserById()` before deletion
- ✅ **NEW**: Returns 404 Not Found if user doesn't exist
- ✅ **NEW**: Verifies user has 'waiter' role (safety check)
- ✅ **NEW**: Returns 400 if attempting to delete non-waiter

## Error Handling Review ✅

### 1. Missing waiterId
- Status: 400 Bad Request
- Message: "Waiter ID is required"
- ✅ Logged to console

### 2. Invalid UUID Format
- Status: 400 Bad Request
- Message: "Invalid waiter ID format"
- ✅ Logged to console with waiterId value

### 3. User Not Found
- Status: 404 Not Found
- Message: "Waiter not found"
- ✅ Logged to console with waiterId and error

### 4. Non-Waiter User
- Status: 400 Bad Request
- Message: "User is not a waiter"
- ✅ Logged to console with waiterId and role

### 5. Deletion Error
- Status: 500 Internal Server Error
- Message: Error message from Supabase
- ✅ Logged to console

### 6. Unexpected Errors
- Status: 500 Internal Server Error
- Message: Error message
- ✅ Caught by try-catch block
- ✅ Logged to console

## Deletion Confirmation ✅

### User Deletion Process
1. ✅ Verifies user exists before deletion
2. ✅ Logs user email before deletion
3. ✅ Calls `auth.admin.deleteUser(waiterId)`
4. ✅ Checks for deletion errors
5. ✅ Logs success after deletion
6. ✅ Returns userId in response for confirmation

### Response Format
```json
{
  "message": "Waiter deleted successfully",
  "userId": "uuid-here"
}
```

## Security Review ✅

### 1. Service Role Key Usage
- ✅ Only used within Edge Function (not exposed)
- ✅ Retrieved from environment variables
- ✅ Used only for admin operations

### 2. Authorization Flow
- ✅ Two-step verification (auth + role check)
- ✅ Cannot be bypassed by client
- ✅ Proper HTTP status codes

### 3. Input Sanitization
- ✅ UUID validation prevents injection
- ✅ Role verification prevents accidental admin deletion
- ✅ Existence check prevents blind deletion attempts

## CORS Configuration ✅
- ✅ Handles OPTIONS preflight requests
- ✅ Allows all origins (appropriate for public API)
- ✅ Includes necessary headers

## Logging & Debugging ✅
- ✅ Logs missing waiterId
- ✅ Logs invalid UUID format
- ✅ Logs user not found errors
- ✅ Logs non-waiter deletion attempts
- ✅ Logs user email before deletion
- ✅ Logs successful deletion
- ✅ Logs all errors with context

## Requirements Compliance

### Requirement 3.2 ✅
> WHEN deletion is confirmed, THE Waiter_Management_API SHALL validate admin authentication

- ✅ Validates session token
- ✅ Verifies admin role from profiles table

### Requirement 3.3 ✅
> WHEN deleting a waiter, THE Auth_System SHALL permanently remove the user account

- ✅ Uses `auth.admin.deleteUser()` for permanent deletion
- ✅ Verifies user exists before deletion
- ✅ Confirms deletion success

### Requirement 3.4 ✅
> WHEN a waiter is deleted, THE Waiter_Management_API SHALL return success confirmation

- ✅ Returns 200 status code
- ✅ Returns success message
- ✅ Returns deleted userId for confirmation

### Requirement 5.1 ✅
> WHEN authentication fails, THE Waiter_Management_API SHALL return a 401 Unauthorized error

- ✅ Returns 401 when no valid session

### Requirement 5.2 ✅
> WHEN a non-admin user attempts operations, THE Waiter_Management_API SHALL return a 403 Forbidden error

- ✅ Returns 403 when user is not admin

## Test Scenarios

### Manual Testing Checklist

#### Positive Tests
- [ ] Delete existing waiter with valid admin session
- [ ] Verify waiter is removed from auth.users
- [ ] Verify success response with correct userId
- [ ] Verify waiter cannot login after deletion

#### Negative Tests - Authentication
- [ ] Call without Authorization header → 401
- [ ] Call with invalid token → 401
- [ ] Call with expired token → 401
- [ ] Call with non-admin user → 403

#### Negative Tests - Validation
- [ ] Call without waiterId → 400 "Waiter ID is required"
- [ ] Call with invalid UUID format → 400 "Invalid waiter ID format"
- [ ] Call with non-existent UUID → 404 "Waiter not found"
- [ ] Call with admin user ID → 400 "User is not a waiter"
- [ ] Call with kitchen user ID → 400 "User is not a waiter"

### cURL Test Commands

```bash
# Set variables
SUPABASE_URL="your-project-url"
ADMIN_TOKEN="your-admin-jwt-token"
WAITER_ID="waiter-uuid-to-delete"

# Test 1: Valid deletion
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"waiterId\": \"${WAITER_ID}\"}"

# Test 2: Missing waiterId
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{}"

# Test 3: Invalid UUID format
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"waiterId\": \"invalid-uuid\"}"

# Test 4: Non-existent waiter
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"waiterId\": \"00000000-0000-0000-0000-000000000000\"}"

# Test 5: No authorization
curl -X POST "${SUPABASE_URL}/functions/v1/delete-waiter" \
  -H "Content-Type: application/json" \
  -d "{\"waiterId\": \"${WAITER_ID}\"}"
```

## Improvements Made

### Enhanced Error Handling
1. Added UUID format validation
2. Added user existence check before deletion
3. Added role verification (prevents deleting non-waiters)
4. Improved error messages with specific status codes

### Enhanced Logging
1. Log all validation failures
2. Log user email before deletion
3. Log successful deletions
4. Log all error conditions with context

### Better Status Codes
- 400: Bad Request (validation errors)
- 401: Unauthorized (no valid session)
- 403: Forbidden (not admin)
- 404: Not Found (waiter doesn't exist)
- 500: Internal Server Error (unexpected errors)

## Deployment Checklist

- [ ] Deploy function: `supabase functions deploy delete-waiter`
- [ ] Verify function appears in Supabase dashboard
- [ ] Test with production admin credentials
- [ ] Monitor logs for any errors
- [ ] Verify waiter deletion works end-to-end

## Conclusion

The delete-waiter Edge Function has been reviewed and enhanced with:
- ✅ Proper authentication and admin role checking
- ✅ Comprehensive input validation (including UUID format)
- ✅ User existence verification before deletion
- ✅ Role verification to prevent accidental deletions
- ✅ Detailed error handling with appropriate status codes
- ✅ Extensive logging for debugging
- ✅ Confirmation of successful deletion

The function is ready for deployment and testing.
