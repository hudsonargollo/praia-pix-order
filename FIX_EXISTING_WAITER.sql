  -- ============================================
  -- Fix Existing Waiter Account
  -- ============================================
  -- This adds missing fields to the existing waiter

  -- Update the existing waiter to add phone_confirmed_at and other missing fields
  UPDATE auth.users
  SET 
    phone_confirmed_at = NOW(),
    confirmation_sent_at = NOW(),
    confirmation_token = '',
    email_change = '',
    email_change_token_new = '',
    recovery_token = '',
    is_super_admin = false
  WHERE email = 'garcom1@cocoloko.com';

  -- Verify the update
  SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as name,
    raw_app_meta_data->>'role' as role,
    email_confirmed_at IS NOT NULL as email_confirmed,
    phone_confirmed_at IS NOT NULL as phone_confirmed,
    confirmation_sent_at IS NOT NULL as confirmation_sent
  FROM auth.users
  WHERE email = 'garcom1@cocoloko.com';
