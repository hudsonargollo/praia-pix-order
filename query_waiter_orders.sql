-- Query to identify and view waiter orders

-- 1. Get all orders created by waiters
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_phone,
    o.status,
    o.payment_status,
    o.total_amount,
    o.waiter_id,
    p.full_name as waiter_name,
    p.display_name as waiter_display_name,
    o.created_at
FROM orders o
LEFT JOIN profiles p ON p.id = o.waiter_id
WHERE o.waiter_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 20;

-- 2. Get orders by specific waiter
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.status,
    o.payment_status,
    o.total_amount,
    o.created_at
FROM orders o
WHERE o.waiter_id = 'YOUR_WAITER_UUID_HERE'
ORDER BY o.created_at DESC;

-- 3. Compare waiter orders vs customer orders
SELECT 
    CASE 
        WHEN waiter_id IS NOT NULL THEN 'Waiter Order'
        ELSE 'Customer Order'
    END as order_type,
    COUNT(*) as count,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY CASE WHEN waiter_id IS NOT NULL THEN 'Waiter Order' ELSE 'Customer Order' END;

-- 4. Get waiter orders with their items
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.status,
    o.payment_status,
    o.total_amount,
    p.full_name as waiter_name,
    json_agg(
        json_build_object(
            'item_name', oi.item_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
        )
    ) as items
FROM orders o
LEFT JOIN profiles p ON p.id = o.waiter_id
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.waiter_id IS NOT NULL
GROUP BY o.id, o.order_number, o.customer_name, o.status, o.payment_status, o.total_amount, p.full_name
ORDER BY o.created_at DESC
LIMIT 10;

-- 5. Get waiter performance summary
SELECT 
    p.full_name as waiter_name,
    p.display_name,
    COUNT(o.id) as total_orders,
    COUNT(CASE WHEN o.payment_status = 'confirmed' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN o.payment_status = 'pending' THEN 1 END) as pending_payment,
    SUM(o.total_amount) as total_sales,
    SUM(CASE WHEN o.payment_status = 'confirmed' THEN o.total_amount * 0.1 ELSE 0 END) as confirmed_commission,
    SUM(CASE WHEN o.payment_status = 'pending' THEN o.total_amount * 0.1 ELSE 0 END) as pending_commission
FROM profiles p
LEFT JOIN orders o ON o.waiter_id = p.id
WHERE p.role = 'waiter'
GROUP BY p.id, p.full_name, p.display_name
ORDER BY total_sales DESC;
