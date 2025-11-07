#!/bin/bash

# Simple deployment script for Cloudflare Pages
# Builds and deploys the site with functions

set -e

echo "🚀 Deploying to Cloudflare Pages..."
echo ""

# Build the project
echo "📦 Building project..."
npm run build

# Deploy with wrangler
echo "🌐 Deploying to Cloudflare..."
npx wrangler pages deploy dist --project-name=coco-loko-acaiteria --commit-dirty=true

echo ""
echo "✅ Deployment complete!"
echo "🌍 Your site is live at: https://coco-loko-acaiteria.pages.dev"
