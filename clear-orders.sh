#!/bin/bash

# ============================================
# Clear All Orders Script
# ============================================
# This script will delete all orders from the database
# WARNING: This action cannot be undone!

echo "⚠️  WARNING: This will delete ALL orders from the database!"
echo "This action cannot be undone."
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled."
    exit 0
fi

echo ""
echo "🗑️  Deleting all orders..."

# Run the SQL commands via Supabase CLI
supabase db execute "
-- Delete order items first (foreign key constraint)
DELETE FROM order_items;

-- Delete all orders
DELETE FROM orders;
"

if [ $? -eq 0 ]; then
    echo "✅ All orders deleted successfully!"
    echo ""
    echo "Verifying deletion..."
    
    # Verify deletion
    supabase db execute "
    SELECT 
        (SELECT COUNT(*) FROM orders) as orders_count,
        (SELECT COUNT(*) FROM order_items) as items_count;
    "
else
    echo "❌ Error deleting orders. Please check the error message above."
    exit 1
fi
