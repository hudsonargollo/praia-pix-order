-- Add phone_number column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment
COMMENT ON COLUMN profiles.phone_number IS 'WhatsApp phone number for password reset (format: country code + area code + number, e.g., 5511999999999)';
