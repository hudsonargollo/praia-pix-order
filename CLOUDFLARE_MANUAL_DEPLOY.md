# 🔄 Cloudflare Pages Manual Deployment

## Current Status
✅ Code pushed to GitHub (commit `10702a2`)
⏳ Waiting for Cloudflare Pages to auto-deploy

## Option 1: Wait for Auto-Deploy (Recommended)
Cloudflare Pages should automatically detect the GitHub push and deploy within 2-5 minutes.

**Check deployment status:**
1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages** → **cocoloko**
3. Look for the latest deployment
4. Should show commit `10702a2` with message "fix: convert payment IDs to strings to fix polling crash"

## Option 2: Manual Trigger via Cloudflare Dashboard
If auto-deploy doesn't start after 5 minutes:

1. Go to https://dash.cloudflare.com/
2. Click **Pages** in the left sidebar
3. Click on your **cocoloko** project
4. Click **"Create deployment"** or **"Retry deployment"**
5. Select branch: **main**
6. Click **"Save and Deploy"**

## Option 3: Force Redeploy with Empty Commit
If Cloudflare doesn't detect the changes:

```bash
# Create an empty commit to trigger deployment
git commit --allow-empty -m "trigger: force Cloudflare redeploy"
git push origin main
```

This will force Cloudflare to redeploy even though no files changed.

## Verify Deployment is Live

### Method 1: Check Deployment Logs
1. In Cloudflare dashboard, click on the latest deployment
2. Check the **Build log** - should show "Build completed"
3. Check the **Functions** tab - should show the updated functions

### Method 2: Test the API Endpoint
```bash
# Test create-payment endpoint (should return 500 without proper data, but endpoint should exist)
curl -X POST https://cocoloko.pages.dev/api/mercadopago/create-payment \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test check-payment endpoint (should return 400 without paymentId)
curl https://cocoloko.pages.dev/api/mercadopago/check-payment
```

If you get responses (even error responses), the endpoints are deployed.

### Method 3: Check in Browser
1. Go to https://cocoloko.pages.dev
2. Create a test order
3. Go to payment page
4. Open browser console (F12)
5. Look for "Payment polling check" logs
6. Should NOT see "TypeError: e.startsWith is not a function"

## Troubleshooting

### Deployment Stuck in "Building"
- Wait 5 minutes
- If still stuck, cancel and retry deployment

### Deployment Failed
- Check build logs for errors
- Verify GitHub connection is active
- Try manual deployment option

### Changes Not Reflected
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Try incognito/private window
- Check deployment timestamp matches your commit time

## Expected Timeline
- **0-2 minutes:** Cloudflare detects GitHub push
- **2-4 minutes:** Build and deployment process
- **4-5 minutes:** Changes live on production

---

**Current Time:** Check Cloudflare dashboard now
**Expected Ready:** Within 5 minutes of push
**Commit to Deploy:** `10702a2`
