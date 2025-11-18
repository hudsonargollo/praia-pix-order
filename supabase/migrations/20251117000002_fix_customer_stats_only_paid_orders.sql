-- Fix customer statistics to only count paid orders
-- This migration updates the trigger to only count orders when they are paid

-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON orders;

-- Create new function that only updates stats for paid orders
CREATE OR REPLACE FUNCTION update_customer_stats_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update customer stats when payment is confirmed
    IF NEW.payment_confirmed_at IS NOT NULL AND (OLD.payment_confirmed_at IS NULL OR OLD IS NULL) THEN
        -- Format phone number to match customers table format (+55...)
        DECLARE
            formatted_phone TEXT;
        BEGIN
            -- If phone doesn't start with +, add +55
            IF NEW.customer_phone !~ '^\+' THEN
                formatted_phone := '+55' || NEW.customer_phone;
            ELSE
                formatted_phone := NEW.customer_phone;
            END IF;
            
            -- Insert or update customer record
            INSERT INTO customers (whatsapp, name, first_order_date, last_order_date, total_orders, total_spent)
            VALUES (
                formatted_phone,
                NEW.customer_name,
                NEW.created_at,
                NEW.created_at,
                1,
                NEW.total_amount
            )
            ON CONFLICT (whatsapp) 
            DO UPDATE SET
                name = EXCLUDED.name, -- Update name in case it changed
                last_order_date = EXCLUDED.last_order_date,
                total_orders = customers.total_orders + 1,
                total_spent = customers.total_spent + EXCLUDED.total_spent,
                updated_at = NOW();
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires on INSERT and UPDATE
-- This way it catches both new paid orders and orders that get paid later
CREATE TRIGGER trigger_update_customer_stats_on_payment
    AFTER INSERT OR UPDATE OF payment_confirmed_at ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats_on_payment();

-- Recalculate all customer statistics from scratch based on paid orders only
-- This fixes any existing incorrect data
DO $$
DECLARE
    customer_record RECORD;
BEGIN
    -- Clear all customer stats
    UPDATE customers SET 
        total_orders = 0,
        total_spent = 0,
        first_order_date = NOW(),
        last_order_date = NOW();
    
    -- Recalculate stats from paid orders
    FOR customer_record IN 
        SELECT 
            CASE 
                WHEN customer_phone ~ '^\+' THEN customer_phone
                ELSE '+55' || customer_phone
            END as formatted_phone,
            customer_name,
            COUNT(*) as order_count,
            SUM(total_amount) as total_amount,
            MIN(created_at) as first_order,
            MAX(created_at) as last_order
        FROM orders
        WHERE payment_confirmed_at IS NOT NULL
        AND deleted_at IS NULL
        GROUP BY 
            CASE 
                WHEN customer_phone ~ '^\+' THEN customer_phone
                ELSE '+55' || customer_phone
            END,
            customer_name
    LOOP
        -- Update or insert customer with correct stats
        INSERT INTO customers (whatsapp, name, first_order_date, last_order_date, total_orders, total_spent)
        VALUES (
            customer_record.formatted_phone,
            customer_record.customer_name,
            customer_record.first_order,
            customer_record.last_order,
            customer_record.order_count,
            customer_record.total_amount
        )
        ON CONFLICT (whatsapp) 
        DO UPDATE SET
            name = EXCLUDED.name,
            first_order_date = EXCLUDED.first_order_date,
            last_order_date = EXCLUDED.last_order_date,
            total_orders = EXCLUDED.total_orders,
            total_spent = EXCLUDED.total_spent,
            updated_at = NOW();
    END LOOP;
    
    -- Remove customers with no paid orders
    DELETE FROM customers WHERE total_orders = 0;
END $$;

COMMENT ON FUNCTION update_customer_stats_on_payment() IS 'Updates customer statistics only when orders are paid (payment_confirmed_at is set)';
