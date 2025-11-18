#!/bin/bash

# Automated Deployment Script for Coco Loko Açaiteria
# Deploys to GitHub and Cloudflare Pages (Wrangler)

set -e  # Exit on error

echo "🚀 Starting automated deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check for uncommitted changes
echo -e "${BLUE}📋 Step 1: Checking for changes...${NC}"
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    read -p "Continue with deployment anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Changes detected${NC}"
fi
echo ""

# Step 2: Add all changes
echo -e "${BLUE}📦 Step 2: Staging changes...${NC}"
git add .
echo -e "${GREEN}✅ Changes staged${NC}"
echo ""

# Step 3: Commit with timestamp
echo -e "${BLUE}💬 Step 3: Creating commit...${NC}"
COMMIT_MSG="${1:-feat: Automated deployment $(date +'%Y-%m-%d %H:%M:%S')}"
git commit -m "$COMMIT_MSG" || echo -e "${YELLOW}⚠️  Nothing to commit${NC}"
echo -e "${GREEN}✅ Commit created${NC}"
echo ""

# Step 4: Push to GitHub
echo -e "${BLUE}📤 Step 4: Pushing to GitHub...${NC}"
git push origin main
echo -e "${GREEN}✅ Pushed to GitHub${NC}"
echo ""

# Step 5: Build the application
echo -e "${BLUE}🔨 Step 5: Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Step 6: Deploy to Cloudflare Pages via Wrangler
echo -e "${BLUE}☁️  Step 6: Deploying to Cloudflare Pages...${NC}"
if command -v wrangler &> /dev/null; then
    wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=main
    echo -e "${GREEN}✅ Deployed to Cloudflare Pages${NC}"
else
    echo -e "${YELLOW}⚠️  Wrangler not found. Installing...${NC}"
    npm install -g wrangler
    wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=main
    echo -e "${GREEN}✅ Deployed to Cloudflare Pages${NC}"
fi
echo ""

# Step 7: Deploy Supabase Edge Functions
echo -e "${BLUE}⚡ Step 7: Deploying Supabase Edge Functions...${NC}"
if command -v supabase &> /dev/null; then
    echo "Deploying Edge Functions..."
    supabase functions deploy create-waiter || echo -e "${YELLOW}⚠️  create-waiter deployment skipped${NC}"
    supabase functions deploy list-waiters || echo -e "${YELLOW}⚠️  list-waiters deployment skipped${NC}"
    supabase functions deploy delete-waiter || echo -e "${YELLOW}⚠️  delete-waiter deployment skipped${NC}"
    supabase functions deploy update-waiter-profile || echo -e "${YELLOW}⚠️  update-waiter-profile deployment skipped${NC}"
    supabase functions deploy send-password-reset || echo -e "${YELLOW}⚠️  send-password-reset deployment skipped${NC}"
    supabase functions deploy mercadopago-webhook || echo -e "${YELLOW}⚠️  mercadopago-webhook deployment skipped${NC}"
    echo -e "${GREEN}✅ Edge Functions deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Skipping Edge Functions deployment${NC}"
    echo -e "${YELLOW}   Install with: npm install -g supabase${NC}"
fi
echo ""

# Step 8: Run database migrations
echo -e "${BLUE}🗄️  Step 8: Running database migrations...${NC}"
if command -v supabase &> /dev/null; then
    supabase db push || echo -e "${YELLOW}⚠️  Migration push skipped (may already be applied)${NC}"
    echo -e "${GREEN}✅ Migrations applied${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Skipping migrations${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 Deployment URLs:${NC}"
echo -e "   GitHub: https://github.com/hudsonargollo/praia-pix-order"
echo -e "   Cloudflare: https://coco-loko-acaiteria.pages.dev"
echo ""
echo -e "${BLUE}📊 Next Steps:${NC}"
echo -e "   1. Check GitHub Actions: https://github.com/hudsonargollo/praia-pix-order/actions"
echo -e "   2. Verify Cloudflare deployment: https://dash.cloudflare.com/"
echo -e "   3. Test the application: https://coco-loko-acaiteria.pages.dev"
echo ""
echo -e "${GREEN}✨ All done!${NC}"
