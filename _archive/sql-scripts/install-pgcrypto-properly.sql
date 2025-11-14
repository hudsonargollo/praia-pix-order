-- Install pgcrypto extension properly
-- Run this in Supabase SQL Editor

-- Install in extensions schema (Supabase standard)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Verify installation
SELECT 
    n.nspname as schema_name,
    e.extname as extension_name,
    e.extversion as version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'pgcrypto';

-- Verify functions exist
SELECT 
    n.nspname as schema_name,
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('gen_salt', 'crypt')
ORDER BY n.nspname, p.proname;
