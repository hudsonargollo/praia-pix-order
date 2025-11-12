-- Check if auth schema and tables exist
-- Run this in Supabase SQL Editor

-- Check if auth schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check auth.users table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
AND table_name = 'users';

-- Count users in auth.users
SELECT COUNT(*) as user_count 
FROM auth.users;

-- Check if we can query auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users
LIMIT 5;
