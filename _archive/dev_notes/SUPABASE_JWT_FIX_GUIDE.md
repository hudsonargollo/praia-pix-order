# Supabase JWT Custom Claims Fix

## The Problem
Supabase doesn't automatically include `user_metadata.role` in JWT tokens. The role is stored in the database but not accessible in the JWT that gets sent to the client.

## Solution: Configure Custom JWT Claims

### Step 1: Go to Supabase Dashboard
1. Open your project: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq
2. Go to **Authentication** > **Policies** > **Custom Claims**

### Step 2: Add Custom Claims Hook (SQL)
Run this SQL in the SQL Editor to create a hook that adds role to JWT:

```sql
-- Create a function to add custom claims to JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Get the user's role from metadata
  SELECT COALESCE(
    (event->'user'->'user_metadata'->>'role'),
    (event->'user'->'app_metadata'->>'role'),
    'default'
  ) INTO user_role;

  -- Add role to claims
  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  
  -- Update the event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;
```

### Step 3: Enable the Hook in Supabase Dashboard
1. Go to **Authentication** > **Hooks**
2. Find "Custom Access Token Hook"
3. Enable it and select the function: `public.custom_access_token_hook`
4. Save

### Step 4: Update the Code to Read from JWT Claims
The app code needs to read from `app_metadata.user_role` instead of `user_metadata.role`.

### Step 5: Test
1. Logout completely
2. Clear browser cache
3. Login again
4. The JWT will now include the role

## Alternative: Use Supabase's Built-in Roles
Instead of custom metadata, use Supabase's built-in role system:

```sql
-- Create roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all roles
CREATE POLICY "Service role can manage roles"
  ON public.user_roles
  FOR ALL
  TO service_role
  USING (true);

-- Insert admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@cocoloko.com.br'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

Then update the app to query this table instead of metadata.

## Recommended Approach
Use the RPC function approach (already implemented in the code) which queries the database directly, bypassing JWT entirely. This is the most reliable solution.
