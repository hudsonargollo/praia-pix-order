-- 🔍 Check what accounts already exist
SELECT 
  email, 
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email LIKE '%cocoloko.com.br%'
ORDER BY created_at;