-- Fix missing sort_order column
-- Run this in Supabase SQL Editor

-- Add sort_order column to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add updated_at column if it doesn't exist  
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name IN ('sort_order', 'updated_at');
