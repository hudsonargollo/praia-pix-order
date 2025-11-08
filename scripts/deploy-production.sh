#!/bin/bash

# Production Deployment Script for Coco Loko Açaiteria
# This script handles the complete deployment process to Cloudflare Pages

set -e  # Exit on error

echo "🚀 Starting production deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required commands are available
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required but not installed.${NC}" >&2; exit 1; }

echo -e "${YELLOW}📋 Step 1: Pre-deployment checks${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create .env file with required variables"
    exit 1
fi

# Check for required environment variables in .env
required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_PUBLISHABLE_KEY" "VITE_MERCADOPAGO_PUBLIC_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables check passed${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Step 2: Installing dependencies${NC}"
echo ""
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Install function dependencies
echo -e "${YELLOW}📦 Step 3: Installing function dependencies${NC}"
echo ""
cd functions
npm install
cd ..
echo -e "${GREEN}✅ Function dependencies installed${NC}"
echo ""

# Run tests
echo -e "${YELLOW}🧪 Step 4: Running tests${NC}"
echo ""
if npm run test:run; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    echo "Fix test failures before deploying"
    exit 1
fi
echo ""

# Build the application
echo -e "${YELLOW}🔨 Step 5: Building application${NC}"
echo ""
npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build output directory 'dist' not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build output verified${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Wrangler CLI not found${NC}"
    echo "Installing Wrangler globally..."
    npm install -g wrangler
fi

# Deploy to Cloudflare Pages
echo -e "${YELLOW}🚀 Step 6: Deploying to Cloudflare Pages${NC}"
echo ""
echo "This will deploy to production. Continue? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Deploying..."
    wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=main
    
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Post-deployment steps:${NC}"
    echo "1. Verify deployment at your Cloudflare Pages URL"
    echo "2. Test WhatsApp connection at /whatsapp-admin"
    echo "3. Scan QR code to connect WhatsApp"
    echo "4. Test notification flow with a test order"
    echo "5. Monitor logs in Cloudflare dashboard"
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi
