-- Create a function to securely retrieve waiter users for the admin panel
-- This function must be called by the Cloudflare Worker using the Service Role Key
CREATE OR REPLACE FUNCTION public.get_waiter_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user calling this function is an admin (e.g., via RLS or another check)
  -- Since this is called by the Service Role Key, we trust the caller (the Cloudflare Worker)
  -- to have performed the necessary authentication checks (e.g., checking for 'admin' role in the request).
  
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    (u.raw_user_meta_data ->> 'full_name')::text AS full_name,
    u.created_at
  FROM
    auth.users u
  WHERE
    u.raw_app_meta_data ->> 'role' = 'waiter'
    AND u.deleted_at IS NULL;
END;
$$;

-- Grant execution to the service role (which the Cloudflare Worker uses)
GRANT EXECUTE ON FUNCTION public.get_waiter_users() TO service_role;
