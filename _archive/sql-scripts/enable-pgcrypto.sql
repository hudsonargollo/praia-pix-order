-- Enable pgcrypto extension for password hashing
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify it was enabled
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
