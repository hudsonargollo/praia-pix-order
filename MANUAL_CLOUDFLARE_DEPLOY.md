# Manual Cloudflare Pages Deployment

## If Automatic Deployment Doesn't Start

### Option 1: Trigger Manual Deployment via Dashboard

1. **Go to Cloudflare Pages Dashboard** (where you are now)
2. Click on your project: `coco-loko-acaiteria`
3. Click the **"Create deployment"** button (top right)
4. Select branch: `main`
5. Click **"Save and Deploy"**

This will manually trigger a new deployment with your latest code including `bck.webp`.

---

### Option 2: Deploy Using Wrangler CLI

Run these commands in your terminal:

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=coco-loko-acaiteria --branch=main
```

This will:
- Build your project locally
- Upload the `dist/` folder (including `bck.webp`) to Cloudflare
- Deploy immediately

---

### Option 3: Check GitHub Integration

The automatic deployments might not be working because:

1. **Check if GitHub is connected:**
   - In Cloudflare Dashboard → Pages → Your Project
   - Go to "Settings" → "Builds & deployments"
   - Check if GitHub repository is connected
   - If not, click "Connect to Git" and authorize

2. **Check branch configuration:**
   - Make sure "Production branch" is set to `main`
   - Check if "Automatic deployments" is enabled

3. **Verify webhook:**
   - Go to your GitHub repository settings
   - Navigate to "Webhooks"
   - Look for Cloudflare webhook
   - Check if it's active and has recent deliveries

---

### Option 4: Force Push (if needed)

If nothing else works, try a force push to trigger the webhook:

```bash
# Make a small change
echo "# Trigger deployment" >> README.md

# Commit
git add README.md
git commit -m "Trigger Cloudflare deployment"

# Push
git push
```

---

## Verify Deployment

After deployment completes (2-3 minutes), verify:

```bash
# Check if image is accessible
curl -I https://coco-loko-acaiteria.pages.dev/bck.webp
```

Should return: `HTTP/2 200`

Or visit: `https://coco-loko-acaiteria.pages.dev/qr`

---

## Quick Fix: Use Wrangler Now

The fastest way to get your image deployed right now:

```bash
# Install wrangler if you haven't
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build
npm run build

# Deploy
wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

This bypasses GitHub and deploys directly from your local machine.
