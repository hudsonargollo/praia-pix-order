# Design Document - Waiter Identification System

## Overview

The Waiter Identification System allows waiters to set a unique display name on first login, which is then used throughout the application for order attribution and reporting.

## Architecture

### Database Schema Changes

```sql
-- Add display_name and has_set_display_name to profiles table
ALTER TABLE profiles 
ADD COLUMN display_name TEXT,
ADD COLUMN has_set_display_name BOOLEAN DEFAULT false;

-- Add unique constraint for display names
CREATE UNIQUE INDEX idx_profiles_display_name_unique 
ON profiles(display_name) 
WHERE display_name IS NOT NULL AND role = 'waiter';

-- Create function to set display name
CREATE OR REPLACE FUNCTION set_waiter_display_name(p_display_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get user role
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  
  IF v_role != 'waiter' THEN
    RAISE EXCEPTION 'Only waiters can set display names';
  END IF;
  
  -- Trim and validate display name
  p_display_name := TRIM(p_display_name);
  
  IF p_display_name = '' OR p_display_name IS NULL THEN
    RAISE EXCEPTION 'Display name cannot be empty';
  END IF;
  
  -- Update profile
  UPDATE profiles 
  SET 
    display_name = p_display_name,
    has_set_display_name = true,
    updated_at = NOW()
  WHERE id = v_user_id;
END;
$$;
```

### Component Structure

```
src/
├── pages/
│   └── waiter/
│       ├── WaiterSetup.tsx          # First-login setup screen
│       └── WaiterDashboard.tsx      # Updated to check setup status
├── components/
│   └── WaiterDisplayNameForm.tsx    # Display name input form
└── lib/
    └── waiterUtils.ts               # Updated to use display_name
```

## User Flow

### First Login Flow

1. Waiter logs in with credentials
2. App checks `has_set_display_name` flag in profile
3. If `false`, redirect to `/waiter/setup`
4. Display setup screen with instructions
5. Waiter enters unique display name
6. System validates uniqueness
7. On success, set `has_set_display_name = true`
8. Redirect to waiter dashboard

### Subsequent Logins

1. Waiter logs in
2. App checks `has_set_display_name` flag
3. If `true`, redirect directly to dashboard
4. Display name shown in header

## UI Design

### Setup Screen (`/waiter/setup`)

```
┌─────────────────────────────────────┐
│  🎯 Configure Seu Nome de Exibição  │
│                                     │
│  Escolha um nome único que será     │
│  usado para identificar você nos    │
│  pedidos e relatórios.              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Nome de Exibição            │   │
│  │ [________________]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Dicas:                             │
│  • Use seu apelido ou primeiro nome │
│  • Deve ser único                   │
│  • Será visível para toda equipe    │
│                                     │
│  [    Continuar    ]                │
└─────────────────────────────────────┘
```

### Error States

- **Empty name**: "Por favor, insira um nome de exibição"
- **Duplicate name**: "Esse nome já está em uso. Por favor, escolha outro."
- **Network error**: "Erro ao salvar. Tente novamente."

## Integration Points

### WaiterDashboard.tsx
- Check `has_set_display_name` on mount
- Redirect to setup if false
- Use `display_name` instead of `full_name` in header

### waiterUtils.ts
- Update `getWaiterName()` to prefer `display_name` over `full_name`
- Add fallback chain: `display_name → full_name → email → "Garçom"`

### Kitchen.tsx & Cashier.tsx
- Already use `getWaiterName()`, will automatically show display names

### AdminWaiterReports.tsx
- Show both `display_name` and `full_name` for admin clarity

## Security Considerations

1. **Authentication**: Only authenticated waiters can set display names
2. **Authorization**: Function checks user role is 'waiter'
3. **Uniqueness**: Database constraint prevents duplicates
4. **Validation**: Trim whitespace, reject empty strings
5. **SQL Injection**: Use parameterized queries

## Error Handling

1. **Duplicate Name**: Catch unique constraint violation, show friendly message
2. **Network Errors**: Show retry option
3. **Session Expired**: Redirect to login
4. **Invalid Role**: Show error, log out user

## Testing Strategy

1. **Unit Tests**:
   - Display name validation
   - Uniqueness checking
   - Error message display

2. **Integration Tests**:
   - First login flow
   - Setup completion
   - Redirect logic

3. **E2E Tests**:
   - Complete waiter onboarding
   - Display name shown in orders
   - Admin can see display names

## Migration Strategy

1. Run database migration to add columns
2. Existing waiters have `has_set_display_name = false`
3. On next login, they'll be prompted to set display name
4. No data loss - `full_name` remains as fallback

## Rollback Plan

If issues arise:
1. Remove unique constraint
2. Set all `has_set_display_name = true`
3. System falls back to `full_name`
4. No functionality broken
