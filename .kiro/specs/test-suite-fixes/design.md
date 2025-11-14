# Design Document - Test Suite Fixes

## Overview

This design addresses 30 failing tests across multiple integration areas. The failures fall into three main categories:
1. **Mock Configuration Issues** - Incomplete Supabase client mocks
2. **API Response Format Mismatches** - Expected vs actual data structures
3. **Timeout Issues** - Async operations exceeding test limits

## Test Failure Analysis

### Category 1: WhatsApp Integration (11 failures)

**Files Affected:**
- `src/integrations/whatsapp/__tests__/queue-manager.test.ts`
- `src/integrations/whatsapp/__tests__/delivery-monitor.test.ts`
- `src/integrations/whatsapp/__tests__/compliance.test.ts`
- `src/integrations/whatsapp/__tests__/notification-triggers.test.ts`
- `src/integrations/whatsapp/__tests__/phone-validator.test.ts`

**Root Causes:**
1. Supabase mock missing `.status` property in query chain
2. Supabase mock missing `.update()` method
3. Supabase mock missing `.limit()` method
4. Test timeouts on async operations
5. Incorrect validation logic expectations

### Category 2: MercadoPago Integration (8 failures)

**Files Affected:**
- `src/integrations/mercadopago/__tests__/client.test.ts`
- `src/integrations/mercadopago/__tests__/webhook.test.ts`

**Root Causes:**
1. API response uses snake_case but tests expect camelCase
2. Missing test data variable definitions
3. Network retry tests exceeding timeouts
4. QR code data structure mismatch

### Category 3: Notification Controls (6 failures)

**Files Affected:**
- `src/components/__tests__/NotificationControls.test.tsx`

**Root Causes:**
1. UI text changed but tests not updated
2. Dialog interactions timing out
3. Missing UI elements in test renders

### Category 4: React Hooks (5 failures)

**Files Affected:**
- `src/hooks/__tests__/useNotificationHistory.test.ts`

**Root Causes:**
1. All tests timing out
2. Likely missing TanStack Query provider wrapper

## Architecture

### Test Mock Infrastructure

```
Test Setup
├── Supabase Mock Factory
│   ├── Complete query builder chain
│   ├── All CRUD operations
│   └── Error simulation
├── API Response Transformers
│   ├── snake_case → camelCase
│   └── Nested object flattening
└── Timeout Configuration
    ├── Default: 5000ms
    └── Extended: 10000ms for network tests
```

### Fix Strategy by Category

#### 1. Supabase Mock Enhancements

**Current Issue:**
```typescript
// Incomplete mock
vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      // Missing: status, limit, update, etc.
    })
  })
})
```

**Solution:**
```typescript
// Complete mock with full chain
const createCompleteMock = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  status: 200,
  error: null,
  data: []
})
```

#### 2. API Response Normalization

**Current Issue:**
```typescript
// Test expects camelCase
expect(result).toEqual({
  qrCode: 'string',
  transactionAmount: 25.5
})

// API returns snake_case
{
  qr_code: 'string',
  transaction_amount: 25.5
}
```

**Solution:**
- Update tests to match actual API response format
- Or add response transformer in implementation
- Document expected format in types

#### 3. Timeout Management

**Current Issue:**
```typescript
// Default 5000ms timeout insufficient
it('should retry network errors', async () => {
  // Takes 6000ms with retries
})
```

**Solution:**
```typescript
// Extend timeout for specific tests
it('should retry network errors', async () => {
  // Test implementation
}, 10000) // 10 second timeout
```

#### 4. Component Test Updates

**Current Issue:**
```typescript
// Looking for old text
expect(screen.getByText('Notificar Pronto')).toBeInTheDocument()

// Component only has 'Mensagem' button
```

**Solution:**
- Update test expectations to match current UI
- Or restore missing UI elements if they were removed accidentally

## Components and Interfaces

### Mock Factory Module

```typescript
// src/test/mocks/supabase-mock-factory.ts

export interface MockQueryBuilder {
  select: Mock
  insert: Mock
  update: Mock
  delete: Mock
  eq: Mock
  limit: Mock
  single: Mock
  status: number
  error: null | Error
  data: any[]
}

export function createSupabaseMock(): MockQueryBuilder {
  const mock: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    status: 200,
    error: null,
    data: []
  }
  
  return mock
}
```

### Test Wrapper Utilities

```typescript
// src/test/utils/test-wrappers.tsx

export function createTestWrapper() {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}
```

## Data Models

### Test Configuration

```typescript
interface TestConfig {
  timeout: number
  retries: number
  mockLevel: 'minimal' | 'complete'
}

const defaultConfig: TestConfig = {
  timeout: 5000,
  retries: 0,
  mockLevel: 'complete'
}

const networkTestConfig: TestConfig = {
  timeout: 10000,
  retries: 1,
  mockLevel: 'complete'
}
```

## Error Handling

### Mock Error Simulation

```typescript
// Simulate database errors
mock.error = new Error('Database connection failed')
mock.status = 500
mock.data = null

// Simulate network errors
mock.error = new Error('Network timeout')
mock.status = 0
mock.data = null
```

### Test Error Recovery

```typescript
// Graceful failure handling
try {
  await testFunction()
} catch (error) {
  // Log detailed error for debugging
  console.error('Test failed:', {
    error,
    mockState: getMockState(),
    testContext: getTestContext()
  })
  throw error
}
```

## Testing Strategy

### Fix Priority

1. **High Priority** - Blocking deployment
   - Supabase mock fixes (affects 15+ tests)
   - Timeout configuration (affects 10+ tests)

2. **Medium Priority** - Feature-specific
   - MercadoPago response format (affects 8 tests)
   - Notification controls UI (affects 6 tests)

3. **Low Priority** - Nice to have
   - Test infrastructure improvements
   - Better error messages

### Verification Approach

1. Fix Supabase mocks globally
2. Run all tests: `npm test -- --run`
3. Fix category-specific issues
4. Re-run affected test files
5. Verify full suite passes
6. Document changes

## Implementation Notes

### Supabase Mock Location

Create centralized mock in:
- `src/test/setup.ts` - Global test setup
- Or `src/test/mocks/supabase.ts` - Dedicated mock file

### Test File Updates

Each test file needs:
1. Import centralized mock
2. Update timeout where needed
3. Fix assertion expectations
4. Add missing test wrappers

### Breaking Changes

None - these are test-only fixes that don't affect production code.

## Success Criteria

- All 30 failing tests pass
- Test suite completes in < 30 seconds
- No timeout errors
- Clear error messages when tests fail
- Maintainable mock infrastructure
