-- 🔧 Fix identities for existing accounts
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email LIKE '%cocoloko.com.br%'
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i 
  WHERE i.user_id = u.id AND i.provider = 'email'
);