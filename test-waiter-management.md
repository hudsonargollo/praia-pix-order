# Waiter Management Frontend Testing Guide

## Test Environment
- Development Server: http://localhost:8080/
- Supabase Edge Functions: Deployed and Active
  - create-waiter (v4)
  - list-waiters (v4)
  - delete-waiter (v4)

## Prerequisites
1. Admin account credentials ready
2. Development server running on port 8080
3. Browser with developer console open

## Test Cases

### Test 1: List Waiters Display
**Objective**: Verify that the waiter list loads correctly

**Steps**:
1. Navigate to http://localhost:8080/auth
2. Login with admin credentials
3. Navigate to Admin Waiters page
4. Observe loading state
5. Verify waiter list displays

**Expected Results**:
- ✅ Loading spinner appears initially
- ✅ Waiter list loads without errors
- ✅ Table shows: Nome Completo, Email, Criado em, Ações columns
- ✅ Total count displays correctly
- ✅ No console errors

**Status**: ⏳ Pending

---

### Test 2: Create Waiter - Valid Data
**Objective**: Successfully create a new waiter account

**Steps**:
1. Click "Novo Garçom" button
2. Fill in form:
   - Nome Completo: "Teste Garçom"
   - Email: "teste.garcom@example.com"
   - Senha: "senha123"
3. Click "Criar Garçom"
4. Wait for response

**Expected Results**:
- ✅ Form submits without errors
- ✅ Success toast: "Garçom criado com sucesso!"
- ✅ Dialog closes automatically
- ✅ Waiter list refreshes
- ✅ New waiter appears in list
- ✅ Submit button disabled during operation

**Status**: ⏳ Pending

---

### Test 3: Create Waiter - Duplicate Email
**Objective**: Verify duplicate email error handling

**Steps**:
1. Click "Novo Garçom" button
2. Fill in form with existing email:
   - Nome Completo: "Outro Garçom"
   - Email: "teste.garcom@example.com" (same as Test 2)
   - Senha: "senha456"
3. Click "Criar Garçom"
4. Wait for response

**Expected Results**:
- ✅ Error toast: "Este email já está cadastrado."
- ✅ Dialog remains open
- ✅ Form fields retain values
- ✅ No waiter created

**Status**: ⏳ Pending

---

### Test 4: Create Waiter - Invalid Email
**Objective**: Verify email validation

**Steps**:
1. Click "Novo Garçom" button
2. Fill in form with invalid email:
   - Nome Completo: "Garçom Teste"
   - Email: "invalid-email"
   - Senha: "senha123"
3. Click "Criar Garçom"

**Expected Results**:
- ✅ Error toast: "Email inválido"
- ✅ Dialog remains open
- ✅ No API call made

**Status**: ⏳ Pending

---

### Test 5: Create Waiter - Missing Fields
**Objective**: Verify required field validation

**Steps**:
1. Click "Novo Garçom" button
2. Leave fields empty or partially filled
3. Try to submit

**Expected Results**:
- ✅ Browser validation prevents submission OR
- ✅ Error toast: "Preencha todos os campos obrigatórios."
- ✅ Dialog remains open

**Status**: ⏳ Pending

---

### Test 6: Create Waiter - Short Password
**Objective**: Verify password length validation

**Steps**:
1. Click "Novo Garçom" button
2. Fill in form:
   - Nome Completo: "Garçom Teste"
   - Email: "short.pass@example.com"
   - Senha: "123" (less than 6 characters)
3. Click "Criar Garçom"

**Expected Results**:
- ✅ Error toast: "Senha deve ter no mínimo 6 caracteres"
- ✅ Dialog remains open

**Status**: ⏳ Pending

---

### Test 7: Delete Waiter
**Objective**: Successfully delete a waiter account

**Steps**:
1. Locate test waiter in list
2. Click trash icon button
3. Confirm deletion in browser dialog
4. Wait for response

**Expected Results**:
- ✅ Confirmation dialog appears
- ✅ Success toast: "Garçom deletado com sucesso!"
- ✅ Waiter list refreshes
- ✅ Waiter removed from list
- ✅ Delete button shows spinner during operation
- ✅ Delete button disabled during operation

**Status**: ⏳ Pending

---

### Test 8: Delete Waiter - Cancel
**Objective**: Verify cancel functionality

**Steps**:
1. Click trash icon for any waiter
2. Click "Cancel" in confirmation dialog

**Expected Results**:
- ✅ No API call made
- ✅ Waiter remains in list
- ✅ No toast message

**Status**: ⏳ Pending

---

### Test 9: Session Expiry Handling
**Objective**: Verify expired session redirect

**Steps**:
1. Clear browser session/cookies
2. Try to access waiter management page
3. Or wait for session to expire naturally

**Expected Results**:
- ✅ Error toast: "Sessão expirada. Faça login novamente."
- ✅ Redirect to /auth page

**Status**: ⏳ Pending

---

### Test 10: Non-Admin Access
**Objective**: Verify authorization for non-admin users

**Steps**:
1. Logout from admin account
2. Login with waiter or kitchen account
3. Try to access /admin/waiters directly

**Expected Results**:
- ✅ Error toast: "Acesso negado. Apenas administradores podem gerenciar garçons."
- ✅ Redirect to home page

**Status**: ⏳ Pending

---

## Console Logging Verification

During all tests, verify console logs show:
- 🔵 "Calling Supabase Edge Function: list-waiters"
- 🔵 "Creating waiter via Supabase Edge Function: {email, full_name}"
- Edge Function responses
- No unexpected errors

## Error Message Verification

All error messages should be in Portuguese:
- ✅ "Sessão expirada. Faça login novamente."
- ✅ "Acesso negado. Apenas administradores podem gerenciar garçons."
- ✅ "Este email já está cadastrado."
- ✅ "Email inválido"
- ✅ "Preencha todos os campos obrigatórios."
- ✅ "Senha deve ter no mínimo 6 caracteres"
- ✅ "Erro ao carregar lista de garçons"
- ✅ "Erro ao criar conta de garçom."
- ✅ "Erro ao deletar conta de garçom."
- ✅ "Erro no servidor. Tente novamente."

## Success Message Verification

- ✅ "Garçom criado com sucesso!"
- ✅ "Garçom deletado com sucesso!"

## UI State Verification

- ✅ Loading spinner during fetch
- ✅ Submit button disabled during create
- ✅ Delete button disabled during delete
- ✅ Delete button shows spinner during operation
- ✅ Dialog closes after successful create
- ✅ List refreshes after create/delete

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. List Waiters Display | ⏳ | |
| 2. Create Valid | ⏳ | |
| 3. Duplicate Email | ⏳ | |
| 4. Invalid Email | ⏳ | |
| 5. Missing Fields | ⏳ | |
| 6. Short Password | ⏳ | |
| 7. Delete Waiter | ⏳ | |
| 8. Delete Cancel | ⏳ | |
| 9. Session Expiry | ⏳ | |
| 10. Non-Admin Access | ⏳ | |

## Next Steps

After completing manual testing:
1. Update test results in this document
2. Document any issues found
3. Proceed to Task 5.2: Build and deploy to production
