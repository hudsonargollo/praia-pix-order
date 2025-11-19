-- Enable pgcrypto extension for password hashing
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
