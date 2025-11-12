# Cloudflare Pages Deployment Guide

## ✅ Deployment Status: SUCCESS

Your Coco Loko Açaiteria application has been successfully deployed to Cloudflare Pages!

**Current URL:** https://coco-loko-acaiteria.pages.dev

## 🌐 Setting up Custom Domain (pdv.clubemkt.digital)

Since your domain is in a different Cloudflare account, follow these steps:

### Step 1: Add Custom Domain in Pages Dashboard
1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Click on your `coco-loko-acaiteria` project
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `pdv.clubemkt.digital`
6. Cloudflare will provide you with DNS records to add

### Step 2: Configure DNS in Your Domain Account
In your `clubemkt.digital` Cloudflare account:

1. Go to **DNS** settings for `clubemkt.digital`
2. Add the CNAME record provided by Pages:
   ```
   Type: CNAME
   Name: pdv
   Target: coco-loko-acaiteria.pages.dev
   Proxy: ✅ Proxied (Orange cloud)
   ```

### Step 3: SSL/TLS Configuration
1. In your domain's Cloudflare account, go to **SSL/TLS**
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**

## 🚀 Deployment Commands

For future deployments:

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

## 🔧 Environment Variables

The following environment variables are configured in production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

To add more environment variables:
```bash
wrangler pages secret put VARIABLE_NAME --project-name=coco-loko-acaiteria
```

## 📱 Testing the Deployment

Once the custom domain is configured, test these URLs:
- Main app: https://pdv.clubemkt.digital
- QR flow: https://pdv.clubemkt.digital/qr
- Kitchen: https://pdv.clubemkt.digital/kitchen
- Cashier: https://pdv.clubemkt.digital/cashier

## 🔄 Automatic Deployments

To set up automatic deployments from Git:
1. Connect your repository in the Pages dashboard
2. Set build command: `npm run build`
3. Set build output directory: `dist`
4. Set root directory: `/` (if deploying from root)