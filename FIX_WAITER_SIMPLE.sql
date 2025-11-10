-- Simple waiter authentication fix
-- Run this in Supabase SQL Editor

-- First, create the waiters table if it doesn't exist
CREATE TABLE IF NOT EXISTS waiters (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  commission_rate decimal(3,2) DEFAULT 0.10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on waiters table
ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;

-- Create policy for waiters table
DROP POLICY IF EXISTS "Waiters can view their own data" ON waiters;
CREATE POLICY "Waiters can view their own data" ON waiters
  FOR ALL USING (auth.uid() = id);

-- Update existing waiter with proper role in metadata
UPDATE auth.users 
SET 
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "waiter"}'::jsonb,
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "waiter"}'::jsonb,
  updated_at = now()
WHERE email = 'garcom1@cocoloko.com';

-- If waiter doesn't exist, create one
DO $$
DECLARE
  waiter_id uuid;
BEGIN
  -- Check if waiter exists
  SELECT id INTO waiter_id FROM auth.users WHERE email = 'garcom1@cocoloko.com';
  
  -- If not exists, create waiter
  IF waiter_id IS NULL THEN
    waiter_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      waiter_id,
      'authenticated',
      'authenticated',
      'garcom1@cocoloko.com',
      crypt('123456', gen_salt('bf')),
      now(),
      '{"role": "waiter"}'::jsonb,
      '{"role": "waiter"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;
  
  -- Ensure waiter exists in waiters table
  INSERT INTO waiters (id, name, email, commission_rate, created_at, updated_at)
  VALUES (waiter_id, 'Garçom 1', 'garcom1@cocoloko.com', 0.10, now(), now())
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    commission_rate = EXCLUDED.commission_rate,
    updated_at = now();
    
END $$;

-- Create RPC function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from auth.users metadata
  SELECT 
    COALESCE(
      raw_user_meta_data->>'role',
      raw_app_meta_data->>'role'
    ) INTO user_role
  FROM auth.users
  WHERE id = user_id;
  
  -- If no role found, check tables
  IF user_role IS NULL THEN
    IF EXISTS (SELECT 1 FROM waiters WHERE id = user_id) THEN
      user_role := 'waiter';
    ELSE
      user_role := 'admin';
    END IF;
  END IF;
  
  RETURN user_role;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO anon;

-- Verify the fix
SELECT 
  'Waiter created successfully:' as status,
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as user_role,
  u.raw_app_meta_data->>'role' as app_role,
  w.name as waiter_name
FROM auth.users u
LEFT JOIN waiters w ON u.id = w.id
WHERE u.email = 'garcom1@cocoloko.com';