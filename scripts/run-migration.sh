#!/bin/bash

# Run the confirm_order_payment migration
echo "Running migration: create_confirm_order_payment_function..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI not found. Please install it first."
    echo "Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Run the migration
supabase db push

echo "Migration complete!"
echo ""
echo "The confirm_order_payment function has been created."
echo "This function is used by the payment polling service to update order status."
