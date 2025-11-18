# Contributing to Coco Loko Açaiteria

Thank you for your interest in contributing to Coco Loko Açaiteria! This document provides guidelines and best practices for contributing to the project.

## 📋 Table of Contents

- [Code Organization](#code-organization)
- [File Placement Guidelines](#file-placement-guidelines)
- [Naming Conventions](#naming-conventions)
- [Git Workflow](#git-workflow)
- [Commit Message Format](#commit-message-format)
- [Testing Requirements](#testing-requirements)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)

## 🗂️ Code Organization

The project follows a clean, role-based organization pattern. Understanding this structure is crucial for contributing effectively.

### Directory Structure

```
src/
├── components/       # Reusable React components
│   ├── ui/          # shadcn/ui components (button, dialog, etc.)
│   └── ...          # Business logic components
├── hooks/           # Custom React hooks
├── integrations/    # External service integrations
├── lib/             # Utility functions and helpers
├── pages/           # Route components (role-based)
│   ├── customer/   # Customer-facing pages
│   ├── admin/      # Admin panel pages
│   ├── staff/      # Kitchen/Cashier pages
│   ├── waiter/     # Waiter-specific pages
│   ├── public/     # Public/auth pages
│   └── debug/      # Debug/diagnostic pages
└── test/            # Test setup and utilities
```

### Key Principles

1. **Separation of Concerns**: Keep business logic separate from UI components
2. **Role-Based Organization**: Pages are grouped by user role for easy navigation
3. **Reusability**: Extract common functionality into hooks and utilities
4. **Type Safety**: Use TypeScript for all new code
5. **Integration Isolation**: External services are isolated in the `integrations/` directory

## 📂 File Placement Guidelines

### Where to Place New Files

#### Pages (Route Components)

Place page components in the appropriate role directory based on the user who will access them:

- **`src/pages/customer/`** - Customer-facing pages
  - Menu browsing, checkout, payment, order status
  - Example: `Menu.tsx`, `Checkout.tsx`, `Payment.tsx`

- **`src/pages/admin/`** - Admin panel pages
  - Product management, waiter management, reports, settings
  - Example: `AdminProducts.tsx`, `AdminWaiters.tsx`, `Reports.tsx`

- **`src/pages/staff/`** - Kitchen and cashier pages
  - Order management, kitchen dashboard, cashier panel
  - Example: `Kitchen.tsx`, `Cashier.tsx`, `UnifiedCashier.tsx`

- **`src/pages/waiter/`** - Waiter-specific pages
  - Order placement, waiter dashboard, order tracking
  - Example: `Waiter.tsx`, `WaiterDashboard.tsx`, `WaiterManagement.tsx`

- **`src/pages/public/`** - Public and authentication pages
  - Landing pages, login, error pages
  - Example: `Index.tsx`, `Auth.tsx`, `NotFound.tsx`

- **`src/pages/debug/`** - Debug and diagnostic pages
  - Development tools, monitoring, diagnostics
  - Example: `SystemDiagnostic.tsx`, `Monitoring.tsx`, `PaymentDebug.tsx`

#### Components

- **`src/components/ui/`** - shadcn/ui components
  - Only place shadcn/ui components here
  - Follow shadcn/ui patterns and conventions
  - Example: `button.tsx`, `dialog.tsx`, `card.tsx`

- **`src/components/`** - Business logic components
  - Reusable components with business logic
  - Components used across multiple pages
  - Example: `ProtectedRoute.tsx`, `OrderDetailsDialog.tsx`, `CustomerInfoForm.tsx`

#### Hooks

- **`src/hooks/`** - Custom React hooks
  - Reusable stateful logic
  - Data fetching hooks
  - Example: `useRealtimeOrders.ts`, `usePaymentPolling.ts`, `useNotificationHistory.ts`

#### Utilities

- **`src/lib/`** - Utility functions and helpers
  - Pure functions without side effects
  - Helper utilities
  - Context providers
  - Example: `utils.ts`, `cartContext.tsx`, `qrCodeGenerator.ts`

#### Integrations

- **`src/integrations/`** - External service integrations
  - Supabase client and types
  - Payment integration (Mercado Pago)
  - WhatsApp messaging
  - Example: `supabase/client.ts`, `mercadopago/payment.ts`, `whatsapp/notifications.ts`

#### Tests

- **`src/components/__tests__/`** - Component tests
- **`src/pages/__tests__/`** - Page tests
- **`src/hooks/__tests__/`** - Hook tests
- Co-locate tests with the code they test

## 📝 Naming Conventions

### Files

- **Components**: PascalCase (e.g., `CustomerInfoForm.tsx`, `OrderDetailsDialog.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useRealtimeOrders.ts`, `usePaymentPolling.ts`)
- **Utilities**: camelCase (e.g., `utils.ts`, `qrCodeGenerator.ts`)
- **Types**: PascalCase (e.g., `types.ts`, `Order.ts`)
- **Tests**: Match the file being tested with `.test.tsx` or `.test.ts` suffix

### Code

- **Components**: PascalCase (e.g., `CustomerInfoForm`, `OrderCard`)
- **Functions**: camelCase (e.g., `calculateTotal`, `formatCurrency`)
- **Variables**: camelCase (e.g., `orderTotal`, `customerName`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ITEMS`, `API_ENDPOINT`)
- **Types/Interfaces**: PascalCase (e.g., `Order`, `Customer`, `PaymentStatus`)
- **Enums**: PascalCase for enum name, UPPER_SNAKE_CASE for values

### Routes

- **URLs**: kebab-case (e.g., `/order-status`, `/admin/waiter-reports`)
- **Route parameters**: camelCase (e.g., `:orderId`, `:tableId`)

### Database

- **Tables**: snake_case (e.g., `orders`, `order_items`, `whatsapp_notifications`)
- **Columns**: snake_case (e.g., `customer_name`, `created_at`, `payment_status`)
- **Functions**: snake_case (e.g., `get_user_role`, `create_waiter`)

## 🔄 Git Workflow

### Branch Naming

Use descriptive branch names with the following prefixes:

- `feature/` - New features (e.g., `feature/waiter-dashboard`)
- `fix/` - Bug fixes (e.g., `fix/payment-validation`)
- `refactor/` - Code refactoring (e.g., `refactor/order-components`)
- `docs/` - Documentation updates (e.g., `docs/api-documentation`)
- `test/` - Test additions or updates (e.g., `test/checkout-flow`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Workflow Steps

1. **Create a feature branch from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code organization guidelines
   - Write tests for new functionality
   - Ensure code passes linting and type checking

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add waiter dashboard with order tracking"
   ```

4. **Keep your branch up to date**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

5. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a pull request**
   - Provide a clear description of changes
   - Reference any related issues
   - Request review from team members

### Branch Protection

- Never commit directly to `main`
- All changes must go through pull requests
- Pull requests require at least one approval
- All CI checks must pass before merging

## 💬 Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for clear and structured commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates
- **ci**: CI/CD configuration changes
- **build**: Build system or external dependency changes

### Scope (Optional)

The scope specifies the area of the codebase affected:

- `customer` - Customer-facing features
- `admin` - Admin panel features
- `staff` - Kitchen/cashier features
- `waiter` - Waiter features
- `payment` - Payment integration
- `whatsapp` - WhatsApp notifications
- `database` - Database schema or migrations
- `ui` - UI components
- `api` - API endpoints

### Examples

```bash
# Feature addition
git commit -m "feat(customer): add order status tracking page"

# Bug fix
git commit -m "fix(payment): resolve PIX QR code generation issue"

# Documentation
git commit -m "docs: update installation instructions in README"

# Refactoring
git commit -m "refactor(admin): extract product form into reusable component"

# Performance improvement
git commit -m "perf(customer): implement lazy loading for menu images"

# Test addition
git commit -m "test(checkout): add tests for cart calculation logic"

# Chore
git commit -m "chore: update dependencies to latest versions"
```

### Commit Message Guidelines

- Use the imperative mood ("add" not "added" or "adds")
- Keep the subject line under 72 characters
- Capitalize the subject line
- Do not end the subject line with a period
- Separate subject from body with a blank line
- Use the body to explain what and why, not how
- Reference issues and pull requests in the footer

## 🧪 Testing Requirements

### Test Coverage

All new features and bug fixes must include appropriate tests:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test critical user flows (optional but recommended)

### Running Tests

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

#### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CustomerInfoForm } from '../CustomerInfoForm';

describe('CustomerInfoForm', () => {
  it('renders form fields correctly', () => {
    render(<CustomerInfoForm />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whatsapp/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CustomerInfoForm />);
    // Test validation logic
  });
});
```

#### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useRealtimeOrders } from '../useRealtimeOrders';

describe('useRealtimeOrders', () => {
  it('fetches orders on mount', async () => {
    const { result } = renderHook(() => useRealtimeOrders());
    await waitFor(() => expect(result.current.orders).toBeDefined());
  });
});
```

### Test Guidelines

- Focus on testing behavior, not implementation details
- Use meaningful test descriptions
- Keep tests simple and focused
- Mock external dependencies (API calls, database)
- Test edge cases and error scenarios
- Ensure tests are deterministic and repeatable

### Pre-Commit Checklist

Before committing, ensure:

- [ ] All tests pass (`npm run test:run`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Code is formatted consistently
- [ ] New features have tests
- [ ] Documentation is updated if needed

## 🎨 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define explicit types for function parameters and return values
- Avoid `any` type - use `unknown` if type is truly unknown
- Use interfaces for object shapes, types for unions/intersections
- Export types alongside components when needed

```typescript
// Good
interface OrderProps {
  orderId: string;
  onStatusChange: (status: OrderStatus) => void;
}

export const OrderCard: React.FC<OrderProps> = ({ orderId, onStatusChange }) => {
  // Component implementation
};

// Avoid
export const OrderCard = ({ orderId, onStatusChange }: any) => {
  // Component implementation
};
```

### React

- Use functional components with hooks
- Use default exports for page components
- Use named exports for utility components
- Destructure props in function parameters
- Use TypeScript for prop types

```typescript
// Good - Page component
const Menu: React.FC = () => {
  // Component implementation
};

export default Menu;

// Good - Utility component
export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  // Component implementation
};
```

### Styling

- Use Tailwind CSS utility classes
- Follow the custom design system (purple theme)
- Ensure responsive design (mobile-first)
- Use CSS custom properties for colors
- Avoid inline styles unless necessary

```typescript
// Good
<button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
  Confirmar Pedido
</button>

// Avoid
<button style={{ backgroundColor: '#9333ea', color: 'white' }}>
  Confirmar Pedido
</button>
```

### Imports

- Use absolute imports with `@/` alias
- Group imports logically (React, libraries, local)
- Sort imports alphabetically within groups

```typescript
// Good
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

// Avoid
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
```

### Error Handling

- Always handle errors gracefully
- Provide user-friendly error messages
- Log errors for debugging
- Use try-catch for async operations

```typescript
// Good
try {
  const { data, error } = await supabase
    .from('orders')
    .select('*');
  
  if (error) throw error;
  
  return data;
} catch (error) {
  console.error('Failed to fetch orders:', error);
  toast.error('Erro ao carregar pedidos. Tente novamente.');
  return [];
}
```

## 🔍 Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass**
   ```bash
   npm run test:run
   npm run lint
   npx tsc --noEmit
   ```

2. **Update documentation** if needed
   - Update README.md for new features
   - Add JSDoc comments for complex functions
   - Update CONTRIBUTING.md for new patterns

3. **Rebase on main** to ensure clean history
   ```bash
   git fetch origin
   git rebase origin/main
   ```

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List of specific changes
- Another change
- Yet another change

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged
```

### Review Process

1. **Request review** from at least one team member
2. **Address feedback** promptly and professionally
3. **Update PR** based on review comments
4. **Resolve conflicts** if main branch has changed
5. **Squash commits** if requested before merging

### Merging

- Use "Squash and merge" for feature branches
- Use "Rebase and merge" for small fixes
- Delete branch after merging
- Ensure CI/CD pipeline passes

## 🚀 Performance Considerations

- Use lazy loading for routes (already implemented)
- Optimize images (use WebP format, appropriate sizes)
- Minimize bundle size (check with `npm run build`)
- Use React.memo for expensive components
- Implement pagination for large lists
- Use Supabase real-time subscriptions efficiently

## 🔒 Security Guidelines

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate user input on both client and server
- Implement proper authentication and authorization
- Follow Supabase RLS (Row Level Security) policies
- Sanitize data before displaying to users

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Vitest Documentation](https://vitest.dev/)

## 🤝 Getting Help

If you have questions or need help:

1. Check existing documentation (README.md, this file)
2. Search for similar issues in the project
3. Ask in the team chat or communication channel
4. Create an issue for bugs or feature requests

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Coco Loko Açaiteria! 🥥
