-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Also enable it in the auth schema if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA auth;