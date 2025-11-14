-- Diagnose pgcrypto installation
-- Run this in Supabase SQL Editor

-- Check which schema pgcrypto is in
SELECT 
    n.nspname as schema_name,
    e.extname as extension_name,
    e.extversion as version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'pgcrypto';

-- Check where gen_salt function is located
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('gen_salt', 'crypt')
ORDER BY n.nspname, p.proname;

-- Check current search_path
SHOW search_path;
