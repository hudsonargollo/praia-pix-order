# Test Infrastructure Documentation

This directory contains the test infrastructure and utilities for the Coco Loko Açaiteria application.

## Directory Structure

```
src/test/
├── mocks/              # Mock implementations
│   └── supabase.ts    # Centralized Supabase mock
├── utils/              # Test utilities
│   └── test-helpers.tsx # Common test helpers
└── README.md          # This file
```

## Supabase Mock (`mocks/supabase.ts`)

The centralized Supabase mock provides a complete implementation of the Supabase client with all query builder methods properly chained.

### Basic Usage

```typescript
import { createSupabaseMock } from '@/test/mocks/supabase';

// Create a basic mock
const mockSupabase = createSupabaseMock({
  selectData: [{ id: '1', name: 'Test' }],
  selectError: null
});

// Use in tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseMock
}));
```

### Query Builder Mock

The query builder mock supports all common Supabase operations:

```typescript
import { createQueryBuilderMock } from '@/test/mocks/supabase';

// Create a query builder with data
const queryBuilder = createQueryBuilderMock([
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' }
]);

// All methods are chainable
await queryBuilder
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10);
```

### Supported Methods

#### SELECT Methods
- `select(columns)`

#### FILTER Methods
- `eq(column, value)` - Equal to
- `neq(column, value)` - Not equal to
- `gt(column, value)` - Greater than
- `gte(column, value)` - Greater than or equal
- `lt(column, value)` - Less than
- `lte(column, value)` - Less than or equal
- `like(column, pattern)` - Pattern matching
- `ilike(column, pattern)` - Case-insensitive pattern matching
- `is(column, value)` - IS comparison
- `in(column, values)` - IN array
- `contains(column, value)` - Contains
- `match(query)` - Match multiple conditions
- `not(column, operator, value)` - NOT condition
- `or(filters)` - OR condition
- `filter(column, operator, value)` - Generic filter

#### MODIFIER Methods
- `order(column, options)` - Sort results
- `limit(count)` - Limit results
- `range(from, to)` - Range of results
- `single()` - Return single row
- `maybeSingle()` - Return single row or null

#### MUTATION Methods
- `insert(data)` - Insert rows
- `update(data)` - Update rows
- `delete()` - Delete rows
- `upsert(data)` - Upsert rows

### Creating Errors

```typescript
import { createSupabaseError, createSupabaseErrorResponse } from '@/test/mocks/supabase';

// Create an error object
const error = createSupabaseError('Not found', 'PGRST116');

// Create an error response
const response = createSupabaseErrorResponse(error);
```

### Table-Specific Mocks

```typescript
import { createTableMock } from '@/test/mocks/supabase';

const ordersMock = createTableMock('orders', [
  { id: '1', total: 100 },
  { id: '2', total: 200 }
]);
```

## Test Helpers (`utils/test-helpers.tsx`)

Common utilities for testing React components and hooks.

### Rendering Components

```typescript
import { renderWithProviders } from '@/test/utils/test-helpers';

test('renders component', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { createHookWrapper } from '@/test/utils/test-helpers';

test('uses custom hook', () => {
  const { result } = renderHook(() => useMyHook(), {
    wrapper: createHookWrapper()
  });
  
  expect(result.current.value).toBe(42);
});
```

### Query Client

```typescript
import { createTestQueryClient } from '@/test/utils/test-helpers';

const queryClient = createTestQueryClient();

// Use in tests
const { result } = renderHook(() => useQuery(...), {
  wrapper: createHookWrapper(queryClient)
});
```

### Mocking Browser APIs

```typescript
import { 
  mockMatchMedia, 
  mockIntersectionObserver,
  mockResizeObserver,
  setupLocalStorageMock
} from '@/test/utils/test-helpers';

describe('My Component', () => {
  // Mock localStorage
  const localStorage = setupLocalStorageMock();
  
  // Mock matchMedia for responsive tests
  beforeEach(() => {
    mockMatchMedia(true); // matches = true
  });
  
  // Mock observers
  beforeAll(() => {
    mockIntersectionObserver();
    mockResizeObserver();
  });
});
```

### Async Utilities

```typescript
import { 
  waitForAsync, 
  flushPromises, 
  waitFor,
  createDeferred
} from '@/test/utils/test-helpers';

// Wait for async operations
await waitForAsync();

// Flush all pending promises
await flushPromises();

// Wait for a condition
await waitFor(() => element.textContent === 'Loaded');

// Create deferred promise
const deferred = createDeferred<string>();
setTimeout(() => deferred.resolve('done'), 100);
await deferred.promise;
```

## Common Test Patterns

### Testing Components with Supabase

```typescript
import { vi } from 'vitest';
import { renderWithProviders } from '@/test/utils/test-helpers';
import { createSupabaseMock } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createSupabaseMock({
    selectData: [{ id: '1', name: 'Test Order' }]
  })
}));

test('loads orders', async () => {
  const { findByText } = renderWithProviders(<OrderList />);
  expect(await findByText('Test Order')).toBeInTheDocument();
});
```

### Testing Hooks with TanStack Query

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/utils/test-helpers';
import { createSupabaseMock } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createSupabaseMock({
    selectData: [{ id: '1', name: 'Test' }]
  })
}));

test('fetches data', async () => {
  const { result } = renderHook(() => useOrders(), {
    wrapper: createHookWrapper()
  });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(1);
});
```

### Testing Error States

```typescript
import { createSupabaseMock, createSupabaseError } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createSupabaseMock({
    selectError: createSupabaseError('Network error', 'NETWORK_ERROR')
  })
}));

test('handles errors', async () => {
  const { findByText } = renderWithProviders(<OrderList />);
  expect(await findByText(/error/i)).toBeInTheDocument();
});
```

### Testing with Different Data States

```typescript
describe('OrderList', () => {
  it('shows loading state', () => {
    // Mock will return empty initially
    const { getByText } = renderWithProviders(<OrderList />);
    expect(getByText(/loading/i)).toBeInTheDocument();
  });
  
  it('shows empty state', async () => {
    vi.mock('@/integrations/supabase/client', () => ({
      supabase: createSupabaseMock({ selectData: [] })
    }));
    
    const { findByText } = renderWithProviders(<OrderList />);
    expect(await findByText(/no orders/i)).toBeInTheDocument();
  });
  
  it('shows orders', async () => {
    vi.mock('@/integrations/supabase/client', () => ({
      supabase: createSupabaseMock({
        selectData: [{ id: '1', name: 'Order 1' }]
      })
    }));
    
    const { findByText } = renderWithProviders(<OrderList />);
    expect(await findByText('Order 1')).toBeInTheDocument();
  });
});
```

## Timeout Configuration

For long-running tests, increase the timeout:

```typescript
test('long operation', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

Or configure globally in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  }
});
```

## Best Practices

1. **Use Centralized Mocks**: Always use the centralized Supabase mock instead of creating ad-hoc mocks
2. **Clean Up**: Use `beforeEach` and `afterEach` to clean up mocks and state
3. **Async/Await**: Always use `async/await` with `findBy*` queries for async operations
4. **Specific Queries**: Use specific queries (`getByRole`, `getByLabelText`) over generic ones
5. **User Events**: Use `@testing-library/user-event` for user interactions
6. **Accessibility**: Test with screen readers in mind (use proper ARIA attributes)
7. **Isolation**: Each test should be independent and not rely on other tests
8. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested

## Debugging Tests

### View Rendered Output

```typescript
import { screen } from '@testing-library/react';

test('debug test', () => {
  renderWithProviders(<MyComponent />);
  screen.debug(); // Prints the DOM
});
```

### Check Query Results

```typescript
import { screen } from '@testing-library/react';

test('find element', () => {
  renderWithProviders(<MyComponent />);
  
  // This will show all available roles
  screen.logTestingPlaygroundURL();
  
  // This will show suggestions if query fails
  screen.getByRole('button', { name: /submit/i });
});
```

### Enable Verbose Logging

```typescript
import { vi } from 'vitest';

// Don't mock console in specific tests
test('with logging', () => {
  // console.log will work normally
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests matching pattern
npm test -- --grep "OrderList"
```

## Common Issues

### "Cannot read properties of undefined"

Usually means a mock method is missing. Check that all chained methods are included in the mock.

### "Test timed out"

Increase timeout or check for unresolved promises. Use `waitFor` for async operations.

### "Element not found"

Use `findBy*` queries for async elements, or check that the element is actually rendered.

### "Query client not provided"

Make sure to use `renderWithProviders` or `createHookWrapper` for components/hooks using TanStack Query.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)
- [Supabase Documentation](https://supabase.com/docs)
