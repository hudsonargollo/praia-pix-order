# Deployment Guide

This guide covers deploying the Coco Loko Açaiteria application to GitHub and Cloudflare Pages.

## Prerequisites

1. **GitHub Account** with repository access
2. **Cloudflare Account** with Pages enabled
3. **Git** installed locally
4. **Node.js** and npm installed

## Step 1: Push to GitHub

### First Time Setup

If this is your first time pushing to GitHub:

```bash
# Add all changes
git add .

# Commit changes
git commit -m "feat: Add waiter edit permissions and improvements"

# Push to GitHub
git push origin main
```

### Regular Updates

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

## Step 2: Configure GitHub Secrets

For automated deployment, add these secrets to your GitHub repository:

1. Go to: `https://github.com/hudsonargollo/praia-pix-order/settings/secrets/actions`

2. Add the following secrets:

### Cloudflare Secrets
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Application Secrets
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key
- `VITE_MERCADOPAGO_PUBLIC_KEY` - MercadoPago public key
- `VITE_MERCADOPAGO_ACCESS_TOKEN` - MercadoPago access token
- `VITE_EVOLUTION_API_URL` - Evolution API URL for WhatsApp
- `VITE_EVOLUTION_API_KEY` - Evolution API key
- `VITE_EVOLUTION_INSTANCE_NAME` - Evolution instance name

### How to Get Cloudflare Credentials

#### Get API Token:
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Add "Cloudflare Pages" permissions
5. Copy the token

#### Get Account ID:
1. Go to: https://dash.cloudflare.com/
2. Select your account
3. Copy the Account ID from the URL or sidebar

## Step 3: Automated Deployment (Recommended)

Once GitHub secrets are configured, deployment is automatic:

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **GitHub Actions will automatically**:
   - Install dependencies
   - Run tests
   - Build the application
   - Deploy to Cloudflare Pages

3. **Monitor deployment**:
   - Go to: `https://github.com/hudsonargollo/praia-pix-order/actions`
   - Watch the deployment progress

## Step 4: Manual Deployment (Alternative)

If you prefer manual deployment:

### Using Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the application
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=main
```

### Using Deployment Script

```bash
# Run the automated deployment script
npm run deploy:full
```

This script will:
1. Check environment variables
2. Install dependencies
3. Run tests
4. Build application
5. Deploy to Cloudflare Pages

## Step 5: Verify Deployment

After deployment:

1. **Check Cloudflare Dashboard**:
   - Go to: https://dash.cloudflare.com/
   - Navigate to Pages > coco-loko-acaiteria
   - Verify deployment status

2. **Test the Application**:
   - Visit: https://coco-loko-acaiteria.pages.dev
   - Test key features:
     - Customer menu access
     - Waiter dashboard
     - Kitchen dashboard
     - Admin panel

3. **Test WhatsApp Integration**:
   - Go to: https://coco-loko-acaiteria.pages.dev/whatsapp-admin
   - Scan QR code to connect
   - Test notifications

## Deployment Workflow

```
┌─────────────────┐
│  Local Changes  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Git Commit    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push to GitHub │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│  - Run Tests    │
│  - Build App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloudflare Pages│
│   Deployment    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Live Site     │
└─────────────────┘
```

## Environment Variables

The application requires these environment variables:

### Frontend (VITE_*)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- `VITE_MERCADOPAGO_PUBLIC_KEY` - MercadoPago public key
- `VITE_MERCADOPAGO_ACCESS_TOKEN` - MercadoPago access token
- `VITE_EVOLUTION_API_URL` - WhatsApp API URL
- `VITE_EVOLUTION_API_KEY` - WhatsApp API key
- `VITE_EVOLUTION_INSTANCE_NAME` - WhatsApp instance name

### Backend (Cloudflare Functions)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `MERCADOPAGO_ACCESS_TOKEN` - MercadoPago access token
- `WHATSAPP_SESSION_ID` - WhatsApp session identifier

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Fails

1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Ensure Cloudflare API token has correct permissions
4. Check Cloudflare Pages dashboard for errors

### Environment Variables Not Working

1. Verify secrets in GitHub repository settings
2. Check `wrangler.toml` for correct variable names
3. Ensure variables are prefixed with `VITE_` for frontend

### WhatsApp Not Connecting

1. Check Evolution API is running
2. Verify API credentials in environment variables
3. Test API connection manually
4. Check Cloudflare Functions logs

## Custom Domain Setup

To use a custom domain:

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to "Custom domains"
4. Add your domain
5. Update DNS records as instructed

## Rollback

To rollback to a previous deployment:

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to "Deployments"
4. Find the previous working deployment
5. Click "Rollback to this deployment"

## Monitoring

### Cloudflare Analytics
- Go to: Cloudflare Dashboard > Pages > Analytics
- Monitor traffic, errors, and performance

### Application Logs
- Check Cloudflare Functions logs for backend errors
- Use browser console for frontend errors

## Support

For issues:
1. Check GitHub Actions logs
2. Review Cloudflare Pages deployment logs
3. Test locally with `npm run dev`
4. Check Supabase logs for database issues

## Quick Commands Reference

```bash
# Development
npm run dev                 # Start dev server

# Testing
npm run test               # Run tests in watch mode
npm run test:run           # Run tests once

# Building
npm run build              # Production build
npm run build:dev          # Development build

# Deployment
git push origin main       # Trigger auto-deployment
npm run deploy:full        # Manual deployment script
wrangler pages deploy dist # Direct Wrangler deployment

# Maintenance
npm install                # Install dependencies
npm run lint               # Check code quality
```
