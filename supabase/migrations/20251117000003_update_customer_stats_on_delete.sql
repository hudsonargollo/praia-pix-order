-- Update customer statistics when orders are deleted
-- This ensures customer counts and totals stay accurate

-- Create function to update customer stats when order is deleted
CREATE OR REPLACE FUNCTION update_customer_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the deleted order was paid
    IF OLD.payment_confirmed_at IS NOT NULL THEN
        DECLARE
            formatted_phone TEXT;
        BEGIN
            -- Format phone number to match customers table format (+55...)
            IF OLD.customer_phone !~ '^\+' THEN
                formatted_phone := '+55' || OLD.customer_phone;
            ELSE
                formatted_phone := OLD.customer_phone;
            END IF;
            
            -- Decrease customer stats
            UPDATE customers
            SET 
                total_orders = GREATEST(total_orders - 1, 0),
                total_spent = GREATEST(total_spent - OLD.total_amount, 0),
                updated_at = NOW()
            WHERE whatsapp = formatted_phone;
            
            -- If customer now has 0 orders, delete the customer record
            DELETE FROM customers 
            WHERE whatsapp = formatted_phone 
            AND total_orders = 0;
        END;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for DELETE operations
CREATE TRIGGER trigger_update_customer_stats_on_delete
    BEFORE DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats_on_delete();

-- Also handle soft deletes (when deleted_at is set)
CREATE OR REPLACE FUNCTION update_customer_stats_on_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if deleted_at changed from NULL to a timestamp
    -- and the order was paid
    IF NEW.deleted_at IS NOT NULL 
       AND OLD.deleted_at IS NULL 
       AND OLD.payment_confirmed_at IS NOT NULL THEN
        DECLARE
            formatted_phone TEXT;
        BEGIN
            -- Format phone number to match customers table format (+55...)
            IF OLD.customer_phone !~ '^\+' THEN
                formatted_phone := '+55' || OLD.customer_phone;
            ELSE
                formatted_phone := OLD.customer_phone;
            END IF;
            
            -- Decrease customer stats
            UPDATE customers
            SET 
                total_orders = GREATEST(total_orders - 1, 0),
                total_spent = GREATEST(total_spent - OLD.total_amount, 0),
                updated_at = NOW()
            WHERE whatsapp = formatted_phone;
            
            -- If customer now has 0 orders, delete the customer record
            DELETE FROM customers 
            WHERE whatsapp = formatted_phone 
            AND total_orders = 0;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for soft delete (UPDATE of deleted_at)
CREATE TRIGGER trigger_update_customer_stats_on_soft_delete
    AFTER UPDATE OF deleted_at ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats_on_soft_delete();

COMMENT ON FUNCTION update_customer_stats_on_delete() IS 'Decreases customer statistics when a paid order is hard deleted';
COMMENT ON FUNCTION update_customer_stats_on_soft_delete() IS 'Decreases customer statistics when a paid order is soft deleted (deleted_at set)';
