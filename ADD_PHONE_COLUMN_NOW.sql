-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR NOW
-- ============================================
-- Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql/new
-- Copy this entire file and click RUN
-- ============================================

-- Step 1: Add phone_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number 
ON public.profiles(phone_number);

-- Step 3: Verify the column was added (you should see a result)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'phone_number';

-- Step 4: Show all profiles columns to confirm
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- After running this, refresh your waiter management page
-- and try editing the waiter again - it should work!
-- ============================================
