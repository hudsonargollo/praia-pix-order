# Waiter Management End-to-End Test Guide

## Prerequisites - Fix Admin Role First

Before running tests, ensure admin has proper role in profiles table.

### Run this SQL in Supabase SQL Editor:

```sql
-- Fix admin profile role
INSERT INTO public.profiles (id, role, full_name)
SELECT 
  id, 
  'admin',
  COALESCE(user_metadata->>'full_name', 'Administrator')
FROM auth.users 
WHERE email = 'admin@cocoloko.com'
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';
```

## Run Automated Tests

After fixing the admin role, run:

```bash
./run-e2e-tests.sh
```

## Manual Test Checklist

### Test 6.1: Complete Workflow
- [ ] Login as admin (admin@cocoloko.com / 123456)
- [ ] Navigate to /admin/waiters
- [ ] Create new waiter
- [ ] Verify waiter appears in list
- [ ] Delete test waiter
- [ ] Verify waiter removed from list

### Test 6.2: Error Scenarios
- [ ] Try duplicate email - should fail
- [ ] Try invalid email format - should fail
- [ ] Try missing fields - should fail
- [ ] Verify error messages are clear

### Test 6.3: Auth & Authz
- [ ] Try accessing as non-admin (garcom1@cocoloko.com) - should fail
- [ ] Try with expired session - should redirect to login
- [ ] Try without login - should redirect to login

## Troubleshooting

**"Forbidden: Admin access required"**
→ Run the SQL above to fix admin role in profiles table

**"Invalid login credentials"**
→ Verify: admin@cocoloko.com (not .com.br) / 123456
