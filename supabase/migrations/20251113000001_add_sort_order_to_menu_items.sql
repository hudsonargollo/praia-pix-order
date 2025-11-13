-- Migration: Add sort_order column to menu_items table

-- Add sort_order column to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for efficient sorting queries
CREATE INDEX IF NOT EXISTS idx_menu_items_category_sort 
ON menu_items(category_id, sort_order);

-- Initialize sort_order for existing items (alphabetical within category)
WITH ranked_items AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY name) as rn
  FROM menu_items
  WHERE sort_order = 0 OR sort_order IS NULL
)
UPDATE menu_items
SET sort_order = (SELECT rn FROM ranked_items WHERE ranked_items.id = menu_items.id)
WHERE id IN (SELECT id FROM ranked_items);

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create RPC function for batch updating sort order
CREATE OR REPLACE FUNCTION update_menu_items_sort_order(
  item_updates JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update sort order';
  END IF;

  -- Update each item's sort_order
  FOR item IN SELECT * FROM jsonb_array_elements(item_updates)
  LOOP
    UPDATE menu_items
    SET sort_order = (item->>'sort_order')::INTEGER,
        updated_at = NOW()
    WHERE id = (item->>'id')::UUID;
  END LOOP;
END;
$$;

-- Update RLS policies to allow admins to update sort_order
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can update menu items sort order" ON menu_items;

-- Create policy for admin updates
CREATE POLICY "Admins can update menu items sort order"
ON menu_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
