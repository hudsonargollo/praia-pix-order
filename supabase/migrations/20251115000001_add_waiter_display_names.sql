-- Migration: Add Waiter Display Names
-- Description: Adds display_name and has_set_display_name fields to profiles table
--              for unique waiter identification system
-- Date: 2025-11-15

-- Add display_name column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS has_set_display_name BOOLEAN DEFAULT false;

-- Create unique index for display names (only for waiters)
-- This ensures each waiter has a unique display name
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_display_name_unique 
ON profiles(display_name) 
WHERE display_name IS NOT NULL AND role = 'waiter';

-- Create function to set waiter display name
-- This function provides a secure way for waiters to set their display name
CREATE OR REPLACE FUNCTION set_waiter_display_name(p_display_name TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_trimmed_name TEXT;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get user role
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  IF v_role != 'waiter' THEN
    RAISE EXCEPTION 'Only waiters can set display names';
  END IF;
  
  -- Trim and validate display name
  v_trimmed_name := TRIM(p_display_name);
  
  IF v_trimmed_name = '' OR v_trimmed_name IS NULL THEN
    RAISE EXCEPTION 'Display name cannot be empty';
  END IF;
  
  -- Check if display name is already taken
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE display_name = v_trimmed_name 
    AND id != v_user_id 
    AND role = 'waiter'
  ) THEN
    RAISE EXCEPTION 'Display name already in use';
  END IF;
  
  -- Update profile
  UPDATE profiles 
  SET 
    display_name = v_trimmed_name,
    has_set_display_name = true,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Return success with updated profile data
  RETURN json_build_object(
    'success', true,
    'display_name', v_trimmed_name,
    'message', 'Display name set successfully'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Display name already in use';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error setting display name: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_waiter_display_name(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION set_waiter_display_name(TEXT) IS 
'Allows authenticated waiters to set their unique display name. Validates uniqueness and role.';

-- Add comments to new columns
COMMENT ON COLUMN profiles.display_name IS 
'Unique display name chosen by waiter for identification in orders and reports';

COMMENT ON COLUMN profiles.has_set_display_name IS 
'Flag indicating whether waiter has completed display name setup on first login';
