# Design Document

## Overview

The Waiter Management Fix consolidates the backend implementation to use Supabase Edge Functions exclusively, removing the duplicate Cloudflare Functions implementation. This design ensures proper authentication, consistent error handling, and maintainable code by leveraging Supabase's native integration with its Auth system.

## Architecture

### Current State (Problem)
- **Dual Implementation**: Both Cloudflare Functions (`/api/admin/*`) and Supabase Edge Functions (`/functions/*`) exist
- **Frontend Confusion**: AdminWaiters.tsx calls Cloudflare Functions via `/api/admin/*` endpoints
- **Authentication Issues**: Cloudflare Functions use service role key directly without proper admin verification
- **Maintenance Burden**: Two codebases doing the same thing

### Target State (Solution)
- **Single Implementation**: Supabase Edge Functions only
- **Proper Auth**: Edge Functions verify admin role through Supabase Auth context
- **Frontend Integration**: Use Supabase client's `functions.invoke()` method
- **Clean Codebase**: Remove Cloudflare Functions for waiter management

## Components and Interfaces

### 1. Supabase Edge Functions

#### create-waiter Function
**Location**: `supabase/functions/create-waiter/index.ts`

**Flow**:
1. Receive request with Authorization header
2. Verify user is authenticated via Supabase Auth
3. Check user has admin role from profiles table
4. Validate request body (email, password, full_name)
5. Use service role client to create user with waiter role
6. Return success with user ID

**Request Interface**:
```typescript
{
  email: string;
  password: string;
  full_name: string;
}
```

**Response Interface**:
```typescript
{
  message: string;
  userId: string;
}
```

#### list-waiters Function
**Location**: `supabase/functions/list-waiters/index.ts`

**Flow**:
1. Receive request with Authorization header
2. Verify user is authenticated via Supabase Auth
3. Check user has admin role from profiles table
4. Use service role client to list all users
5. Filter users with waiter role
6. Return formatted waiter list

**Response Interface**:
```typescript
{
  waiters: Array<{
    id: string;
    email: string;
    full_name: string;
    created_at: string;
  }>;
}
```

#### delete-waiter Function
**Location**: `supabase/functions/delete-waiter/index.ts`

**Flow**:
1. Receive request with Authorization header
2. Verify user is authenticated via Supabase Auth
3. Check user has admin role from profiles table
4. Validate waiterId in request body
5. Use service role client to delete user
6. Return success confirmation

**Request Interface**:
```typescript
{
  waiterId: string;
}
```

**Response Interface**:
```typescript
{
  message: string;
  userId: string;
}
```

### 2. Frontend Component Updates

#### AdminWaiters.tsx Modifications

**Current Issues**:
- Uses `fetch('/api/admin/...')` to call Cloudflare Functions
- No authentication headers passed
- Direct REST API calls instead of Supabase client

**Required Changes**:
- Import Supabase client
- Get current session for authentication
- Use `supabase.functions.invoke()` for all operations
- Pass session token in Authorization header
- Update error handling for Supabase function responses

**Updated API Call Pattern**:
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { ...params },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
});
```

## Data Flow

### Create Waiter Flow
```
Admin UI (AdminWaiters.tsx)
  ↓ [Submit form with email, password, full_name]
Supabase Client
  ↓ [functions.invoke('create-waiter') with auth token]
Supabase Edge Function (create-waiter)
  ↓ [Verify admin role]
  ↓ [Validate input]
Supabase Auth Admin API
  ↓ [Create user with waiter role]
Response
  ↓ [Return user ID]
Admin UI
  ↓ [Show success, refresh list]
```

### List Waiters Flow
```
Admin UI (AdminWaiters.tsx)
  ↓ [Page load / refresh]
Supabase Client
  ↓ [functions.invoke('list-waiters') with auth token]
Supabase Edge Function (list-waiters)
  ↓ [Verify admin role]
Supabase Auth Admin API
  ↓ [List all users]
Edge Function
  ↓ [Filter waiter role]
Response
  ↓ [Return waiter array]
Admin UI
  ↓ [Display in table]
```

### Delete Waiter Flow
```
Admin UI (AdminWaiters.tsx)
  ↓ [Click delete, confirm]
Supabase Client
  ↓ [functions.invoke('delete-waiter') with auth token and waiterId]
Supabase Edge Function (delete-waiter)
  ↓ [Verify admin role]
Supabase Auth Admin API
  ↓ [Delete user]
Response
  ↓ [Return success]
Admin UI
  ↓ [Show success, refresh list]
```

## Error Handling

### Authentication Errors

**401 Unauthorized**:
- Cause: No valid session token
- Frontend Action: Redirect to login
- User Message: "Sessão expirada. Faça login novamente."

**403 Forbidden**:
- Cause: User is not admin
- Frontend Action: Show error, redirect to home
- User Message: "Acesso negado. Apenas administradores podem gerenciar garçons."

### Validation Errors

**400 Bad Request - Missing Fields**:
- Cause: Required fields not provided
- Frontend Action: Show field-specific errors
- User Message: "Preencha todos os campos obrigatórios."

**400 Bad Request - Duplicate Email**:
- Cause: Email already exists
- Frontend Action: Highlight email field
- User Message: "Este email já está cadastrado."

**400 Bad Request - Invalid Email**:
- Cause: Email format invalid
- Frontend Action: Highlight email field
- User Message: "Email inválido."

### Server Errors

**500 Internal Server Error**:
- Cause: Unexpected error in Edge Function
- Frontend Action: Show generic error
- User Message: "Erro no servidor. Tente novamente."

## Security Considerations

### Authentication Flow
1. **Session Verification**: Every Edge Function call verifies the session token
2. **Role Check**: Functions query profiles table to confirm admin role
3. **Service Role Isolation**: Service role key only used within Edge Functions, never exposed to frontend
4. **Token Expiry**: Frontend handles expired tokens and redirects to login

### Authorization
1. **Admin-Only Access**: All waiter management functions require admin role
2. **Profile Table**: Single source of truth for user roles
3. **RLS Policies**: Profiles table has RLS to prevent unauthorized role changes

### Input Validation
1. **Email Validation**: Regex pattern for valid email format
2. **Password Requirements**: Minimum 6 characters (enforced by Supabase Auth)
3. **Name Validation**: Non-empty string, max 255 characters
4. **SQL Injection Prevention**: Supabase client handles parameterization

## Migration Strategy

### Phase 1: Update Edge Functions (if needed)
- Review existing Supabase Edge Functions
- Ensure proper error handling
- Add detailed logging
- Test with Supabase CLI locally

### Phase 2: Update Frontend
- Modify AdminWaiters.tsx to use Supabase client
- Replace fetch calls with functions.invoke
- Update error handling
- Add proper loading states

### Phase 3: Remove Cloudflare Functions
- Delete `/functions/api/admin/create-waiter.js`
- Delete `/functions/api/admin/list-waiters.js`
- Delete `/functions/api/admin/delete-waiter.js`
- Verify no other code references these endpoints

### Phase 4: Testing
- Test create waiter with valid data
- Test create waiter with duplicate email
- Test create waiter with invalid data
- Test list waiters
- Test delete waiter
- Test unauthorized access (non-admin user)

## Performance Considerations

### Edge Function Optimization
- **Cold Start**: Supabase Edge Functions have minimal cold start time
- **Caching**: No caching needed for admin operations (always fresh data)
- **Pagination**: Not needed initially (small number of waiters expected)

### Frontend Optimization
- **Loading States**: Show skeleton loaders during API calls
- **Optimistic Updates**: Not recommended for user management (wait for confirmation)
- **Debouncing**: Not needed (explicit button clicks, not real-time input)

## Testing Strategy

### Unit Tests
- Edge Function input validation
- Role verification logic
- Error response formatting

### Integration Tests
- End-to-end create waiter flow
- End-to-end list waiters flow
- End-to-end delete waiter flow
- Authentication failure scenarios
- Authorization failure scenarios

### Manual Testing Checklist
- [ ] Admin can create waiter with valid data
- [ ] System rejects duplicate email
- [ ] System rejects invalid email format
- [ ] System rejects missing required fields
- [ ] Admin can view list of waiters
- [ ] Admin can delete waiter
- [ ] Non-admin cannot access waiter management
- [ ] Expired session redirects to login
- [ ] Success messages display correctly
- [ ] Error messages display correctly

## Deployment Checklist

### Supabase Edge Functions
- [ ] Deploy create-waiter function
- [ ] Deploy list-waiters function
- [ ] Deploy delete-waiter function
- [ ] Verify functions are accessible
- [ ] Test functions with Supabase CLI

### Frontend Deployment
- [ ] Update AdminWaiters.tsx
- [ ] Build and test locally
- [ ] Deploy to Cloudflare Pages
- [ ] Verify production functionality

### Cleanup
- [ ] Remove Cloudflare Functions files
- [ ] Update documentation
- [ ] Remove unused environment variables (if any)
