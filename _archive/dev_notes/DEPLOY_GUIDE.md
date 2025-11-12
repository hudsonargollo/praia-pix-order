# Deployment Guide

## Quick Deploy

Deploy your site with functions to Cloudflare Pages:

```bash
npm run deploy
```

That's it! This will:
1. Build your project (`npm run build`)
2. Deploy to Cloudflare Pages with functions
3. Your site will be live at: https://coco-loko-acaiteria.pages.dev

---

## What Gets Deployed

### Static Assets
- All files from `dist/` folder
- Including `bck.webp` background image
- React app bundle
- CSS and other assets

### Cloudflare Functions
- `/api/whatsapp/connection` - WhatsApp connection management
- `/api/whatsapp/session-manager` - Session persistence
- `/api/mercadopago/*` - Payment functions
- `/api/health` - Health check endpoint

---

## Deployment Methods

### Method 1: Quick Deploy (Recommended)
```bash
npm run deploy
```

### Method 2: Manual Steps
```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

### Method 3: Automatic (GitHub)
Just push to main branch:
```bash
git push
```
Cloudflare will automatically build and deploy.

---

## Configuration

### Node.js Compatibility

The `wrangler.toml` file includes:
```toml
compatibility_flags = ["nodejs_compat"]
```

This enables Node.js built-in modules (`crypto`, `fs`, etc.) in Cloudflare Functions, which are required for the WhatsApp integration.

### Environment Variables

Set these in Cloudflare Dashboard (Pages → Settings → Environment Variables):

**Production:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_ENCRYPTION_KEY`
- `WHATSAPP_SESSION_ID`
- `MERCADOPAGO_ACCESS_TOKEN`

---

## Verify Deployment

After deployment, check:

### 1. Site is live
```bash
curl -I https://coco-loko-acaiteria.pages.dev
```

### 2. Background image
```bash
curl -I https://coco-loko-acaiteria.pages.dev/bck.webp
```

### 3. Health endpoint
```bash
curl https://coco-loko-acaiteria.pages.dev/api/health
```

### 4. Splash screen
Visit: https://coco-loko-acaiteria.pages.dev/qr

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Functions Not Working
1. Check `wrangler.toml` has `compatibility_flags = ["nodejs_compat"]`
2. Verify environment variables in Cloudflare Dashboard
3. Check function logs in Cloudflare Dashboard

### Image Not Showing
1. Verify `bck.webp` is in `public/` folder
2. Check it's in `dist/` after build: `ls dist/bck.webp`
3. Clear Cloudflare cache

---

## Deployment Checklist

Before deploying:
- [ ] Code is committed to Git
- [ ] Tests pass: `npm run test:run`
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables set in Cloudflare
- [ ] `bck.webp` is in `public/` folder

After deploying:
- [ ] Site loads correctly
- [ ] Splash screen shows background image
- [ ] Functions respond (check `/api/health`)
- [ ] WhatsApp admin page accessible
- [ ] Test order flow works

---

## Production URLs

- **Main Site**: https://coco-loko-acaiteria.pages.dev
- **Splash Screen**: https://coco-loko-acaiteria.pages.dev/qr
- **Health Check**: https://coco-loko-acaiteria.pages.dev/api/health
- **WhatsApp Admin**: https://coco-loko-acaiteria.pages.dev/whatsapp-admin
- **Monitoring**: https://coco-loko-acaiteria.pages.dev/monitoring

---

## Rollback

If something goes wrong:

### Via Cloudflare Dashboard
1. Go to Pages → coco-loko-acaiteria
2. Click "Deployments" tab
3. Find previous working deployment
4. Click "..." → "Rollback to this deployment"

### Via Git
```bash
git revert HEAD
git push
```

---

## Advanced

### Deploy to Preview
```bash
npx wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=preview
```

### Deploy Specific Branch
```bash
npx wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=feature-name
```

### View Logs
```bash
npx wrangler pages deployment tail --project-name=coco-loko-acaiteria
```

---

## CI/CD

The project is configured for automatic deployment via GitHub:
- Push to `main` → Deploys to production
- Push to other branches → Creates preview deployments

No additional CI/CD setup needed!

---

## Support

- Cloudflare Dashboard: https://dash.cloudflare.com
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
- Project Docs: See `PRODUCTION_DEPLOYMENT.md`
