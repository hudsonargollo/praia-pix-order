-- Alternative approach: Create database functions to manage waiters
-- This avoids using the Auth Admin API which is failing

-- ============================================================================
-- PART 1: Create a function to list waiters from auth.users
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.list_waiter_users();

-- Create function to list waiters (requires service role or security definer)
CREATE OR REPLACE FUNCTION public.list_waiter_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'full_name', 'N/A')::text as full_name,
    u.created_at
  FROM auth.users u
  WHERE 
    u.raw_user_meta_data->>'role' = 'waiter' 
    OR u.raw_app_meta_data->>'role' = 'waiter'
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.list_waiter_users() TO authenticated;

-- ============================================================================
-- PART 2: Create a function to create waiter users
-- ============================================================================

-- Note: Creating users still requires the Auth Admin API
-- We'll keep the edge function for this but simplify it

-- ============================================================================
-- PART 3: Create a function to delete waiter users  
-- ============================================================================

-- Note: Deleting users still requires the Auth Admin API
-- We'll keep the edge function for this but simplify it

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ WAITER MANAGEMENT FUNCTIONS CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 list_waiter_users() - Lists all waiters from auth.users';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: Create and Delete still use edge functions';
  RAISE NOTICE '   but listing now uses a database function';
  RAISE NOTICE '';
END $$;

-- Test the function
SELECT * FROM public.list_waiter_users();
