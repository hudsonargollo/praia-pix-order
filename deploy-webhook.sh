#!/bin/bash
# Quick deployment script for Mercado Pago webhook handler

echo "🚀 Deploying Mercado Pago Webhook Handler"
echo "=========================================="
echo ""

# Step 1: Apply migration
echo "📊 Step 1: Applying database migration..."
npx supabase db push --linked
if [ $? -ne 0 ]; then
    echo "❌ Migration failed. Please check your Supabase connection."
    exit 1
fi
echo "✅ Migration applied successfully"
echo ""

# Step 2: Check if secrets are set
echo "🔐 Step 2: Checking environment variables..."
npx supabase secrets list | grep MERCADOPAGO_ACCESS_TOKEN
if [ $? -ne 0 ]; then
    echo "⚠️  MERCADOPAGO_ACCESS_TOKEN not set"
    echo "Please set it with:"
    echo "npx supabase secrets set MERCADOPAGO_ACCESS_TOKEN=your_token_here"
    exit 1
fi
echo "✅ Environment variables configured"
echo ""

# Step 3: Deploy function
echo "🔧 Step 3: Deploying Edge Function..."
npx supabase functions deploy mercadopago-webhook
if [ $? -ne 0 ]; then
    echo "❌ Function deployment failed"
    exit 1
fi
echo "✅ Function deployed successfully"
echo ""

# Step 4: Get webhook URL
echo "🌐 Step 4: Getting webhook URL..."
PROJECT_REF=$(npx supabase status | grep "API URL" | awk '{print $3}' | sed 's/https:\/\///' | sed 's/.supabase.co//')
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/mercadopago-webhook"
echo "✅ Webhook URL: $WEBHOOK_URL"
echo ""

# Step 5: Instructions
echo "📋 Next Steps:"
echo "1. Configure this URL in Mercado Pago:"
echo "   $WEBHOOK_URL"
echo ""
echo "2. Go to: https://www.mercadopago.com.br/developers/panel/app"
echo "3. Select your app → Webhooks → Add URL"
echo "4. Select 'Pagamentos' events"
echo ""
echo "✅ Deployment complete!"
