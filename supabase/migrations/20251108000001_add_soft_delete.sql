-- Add soft delete column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NULL;

-- Add cancelled_at timestamp
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Update existing cancelled/expired orders (use created_at since updated_at doesn't exist)
UPDATE orders 
SET cancelled_at = created_at 
WHERE status IN ('cancelled', 'expired') AND cancelled_at IS NULL;
