-- Create customers table for marketing and analytics
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp VARCHAR(20) UNIQUE NOT NULL, -- Unique key (format: +5511999999999)
    name VARCHAR(255) NOT NULL,
    first_order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_orders INTEGER DEFAULT 1,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);

-- Create function to update customer data when order is created
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update customer record
    INSERT INTO customers (whatsapp, name, first_order_date, last_order_date, total_orders, total_spent)
    VALUES (
        NEW.customer_phone,
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update customer stats when order is created
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON orders;
CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- Create function to get business analytics
CREATE OR REPLACE FUNCTION get_business_analytics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    start_date := NOW() - INTERVAL '1 day' * days_back;
    
    SELECT json_build_object(
        'total_revenue', COALESCE(SUM(CASE WHEN payment_confirmed_at IS NOT NULL THEN total_amount ELSE 0 END), 0),
        'total_orders', COUNT(*),
        'paid_orders', COUNT(CASE WHEN payment_confirmed_at IS NOT NULL THEN 1 END),
        'pending_orders', COUNT(CASE WHEN payment_confirmed_at IS NULL AND status != 'cancelled' THEN 1 END),
        'cancelled_orders', COUNT(CASE WHEN status = 'cancelled' THEN 1 END),
        'unique_customers', COUNT(DISTINCT customer_phone),
        'avg_order_value', COALESCE(AVG(CASE WHEN payment_confirmed_at IS NOT NULL THEN total_amount END), 0),
        'orders_today', COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END),
        'revenue_today', COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE AND payment_confirmed_at IS NOT NULL THEN total_amount ELSE 0 END), 0)
    ) INTO result
    FROM orders
    WHERE created_at >= start_date
    AND deleted_at IS NULL;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get customer analytics
CREATE OR REPLACE FUNCTION get_customer_analytics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_customers', COUNT(*),
        'new_customers_today', COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END),
        'new_customers_this_week', COUNT(CASE WHEN created_at >= DATE_TRUNC('week', NOW()) THEN 1 END),
        'new_customers_this_month', COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END),
        'repeat_customers', COUNT(CASE WHEN total_orders > 1 THEN 1 END),
        'top_customers', (
            SELECT json_agg(
                json_build_object(
                    'name', name,
                    'whatsapp', whatsapp,
                    'total_orders', total_orders,
                    'total_spent', total_spent
                )
            )
            FROM (
                SELECT name, whatsapp, total_orders, total_spent
                FROM customers
                ORDER BY total_spent DESC
                LIMIT 5
            ) top_5
        )
    ) INTO result
    FROM customers;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_analytics TO authenticated;