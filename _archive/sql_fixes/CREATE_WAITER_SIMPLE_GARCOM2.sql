    -- Simple waiter account creation: garcom2@cocoloko.com
    -- Run this in Supabase SQL Editor

    -- Enable pgcrypto extension
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- Create the waiter user (simplified version)
    INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    phone_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
    ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'garcom@cocoloko.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"], "role": "waiter"}'::jsonb,
    '{"role": "waiter", "full_name": "Garçom 2"}'::jsonb,
    false
    );

    -- Verify the account was created
    SELECT 
    id,
    email,
    raw_app_meta_data ->> 'role' as role,
    raw_user_meta_data ->> 'full_name' as full_name,
    email_confirmed_at,
    created_at
    FROM auth.users 
    WHERE email = 'garcom@cocoloko.com';