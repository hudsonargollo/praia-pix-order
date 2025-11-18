# Fix Phone Number Error - Quick Guide

## Problem
The `phone_number` column doesn't exist in the `profiles` table yet, causing errors when trying to add/edit waiter phone numbers.

## Solution (Choose One)

### Option 1: Supabase Dashboard (Easiest) ⭐

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql/new

2. **Copy and paste this SQL**:
   ```sql
   -- Add phone_number column if it doesn't exist
   DO $$ 
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public'
       AND table_name = 'profiles' 
       AND column_name = 'phone_number'
     ) THEN
       ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
       RAISE NOTICE 'Added phone_number column to profiles table';
     ELSE
       RAISE NOTICE 'phone_number column already exists';
     END IF;
   END $$;

   -- Create index for better performance
   CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
   ```

3. **Click "Run"**

4. **Done!** ✅ Try adding phone number to waiter again

### Option 2: Using SQL File

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/sntxekdwdllwkszclpiq/sql/new

2. **Copy contents of `quick-add-phone-column.sql`**

3. **Paste and Run**

4. **Done!** ✅

### Option 3: Command Line (Advanced)

```bash
# Use single quotes to escape special characters
psql 'postgresql://postgres.sntxekdwdllwkszclpiq:Cocoloko2024!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' -f quick-add-phone-column.sql
```

## Verification

After running the SQL, test by:

1. Go to: https://coco-loko-acaiteria.pages.dev/waiter-management
2. Click "Edit" on any waiter
3. Add a phone number (e.g., `5511999999999`)
4. Click "Atualizar Garçom"
5. Should work without errors! ✅

## What Was Fixed

- ✅ Updated `update-waiter-profile` Edge Function with fallback handling
- ✅ Function now provides helpful error messages
- ✅ Created quick SQL scripts for easy column addition
- ⚠️ Still need to run the SQL to add the column

## After Adding Column

Once the column is added, you'll be able to:
- ✅ Add phone numbers when creating waiters
- ✅ Edit phone numbers for existing waiters
- ✅ Send password reset links via WhatsApp (Key icon button)
