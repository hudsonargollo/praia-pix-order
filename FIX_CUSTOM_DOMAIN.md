# 🔧 Fix Custom Domain to Show Latest Version

## Issue
Custom domain `cocoloko.clubemkt.digital` is showing an old 2-column layout instead of the new 3-column layout.

## Latest Deployment
**New Deployment**: https://a1f7e86d.coco-loko-acaiteria.pages.dev
**Production Alias**: https://production.coco-loko-acaiteria.pages.dev

## Solution: Update Custom Domain in Cloudflare Pages

### Step 1: Access Cloudflare Pages Dashboard
1. Go to: https://dash.cloudflare.com/
2. Select **Pages**
3. Click on **coco-loko-acaiteria** project

### Step 2: Check Custom Domain Configuration
1. Click **Custom domains** tab
2. Look for `cocoloko.clubemkt.digital`
3. Check which branch/deployment it's pointing to

### Step 3: Set Production Branch as Default
1. Go to **Settings** tab
2. Under **Builds & deployments**
3. Set **Production branch** to: `production`
4. Save changes

### Step 4: Verify Custom Domain Points to Production
1. In **Custom domains** tab
2. Find `cocoloko.clubemkt.digital`
3. Click the three dots (⋯) next to it
4. Select **Set as production domain**
5. This ensures it uses the production branch

### Step 5: Purge Cloudflare Cache
1. Go to your Cloudflare dashboard for `clubemkt.digital`
2. Click **Caching** → **Configuration**
3. Click **Purge Everything**
4. Confirm the purge

## Alternative: Re-add Custom Domain

If the above doesn't work, remove and re-add the custom domain:

### Remove Domain
1. In Cloudflare Pages → Custom domains
2. Find `cocoloko.clubemkt.digital`
3. Click three dots (⋯) → **Remove domain**

### Re-add Domain
1. Click **Set up a custom domain**
2. Enter: `cocoloko.clubemkt.digital`
3. Click **Continue**
4. Click **Activate domain**
5. Wait 2-3 minutes for DNS propagation

## Verify It's Working

### Test the Latest Deployment Directly
Visit: https://a1f7e86d.coco-loko-acaiteria.pages.dev/kitchen

You should see **THREE columns**:
1. Novos Pedidos (Blue)
2. Em Preparo (Purple)
3. Pronto (Green)

### Test Production Alias
Visit: https://production.coco-loko-acaiteria.pages.dev/kitchen

Should also show three columns.

### Test Custom Domain (After Fix)
Visit: https://cocoloko.clubemkt.digital/kitchen

Should show three columns after cache is cleared.

## Quick Test Commands

```bash
# Check which deployment the custom domain is serving
curl -sI https://cocoloko.clubemkt.digital | grep -i "cf-ray\|x-deployment"

# Check production alias
curl -sI https://production.coco-loko-acaiteria.pages.dev | grep -i "cf-ray"

# Check latest deployment
curl -sI https://a1f7e86d.coco-loko-acaiteria.pages.dev | grep -i "cf-ray"
```

## Why This Happens

Cloudflare Pages can have multiple deployments:
- **Preview deployments** (from feature branches)
- **Production deployments** (from production branch)

If the custom domain was added before setting the production branch, it might be pointing to an older preview deployment instead of the production branch.

## Expected Result

After following these steps:
- ✅ https://cocoloko.clubemkt.digital/kitchen shows 3 columns
- ✅ Kitchen has: Novos Pedidos → Em Preparo → Pronto
- ✅ All latest features are visible

## If Still Not Working

### Check in Cloudflare Pages:
1. Go to **Deployments** tab
2. Find the deployment with ID `a1f7e86d`
3. Click on it
4. Click **Manage deployment** → **Promote to production**

This will ensure the latest deployment is set as production.

---

**Latest Deployment ID**: a1f7e86d
**Deployed**: Just now
**Status**: Contains 3-column kitchen layout
