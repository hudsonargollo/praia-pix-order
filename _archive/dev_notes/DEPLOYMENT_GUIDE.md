# Deployment Guide - Coco Loko Açaiteria

## Automatic Deployment (Already Configured ✅)

Your project is connected to Cloudflare Pages and automatically deploys on every push to the `main` branch.

### How It Works

1. **Push to GitHub**: `git push origin main`
2. **Cloudflare Detects**: Webhook triggers automatically
3. **Build Process**: Runs `npm run build`
4. **Deploy**: New version goes live in 2-5 minutes

### Check Deployment Status

Visit: https://dash.cloudflare.com/
- Navigate to **Pages** → **coco-loko-acaiteria**
- View deployment history and logs

## If Changes Don't Appear

### 1. Clear Browser Cache (Most Common)
- **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Incognito Mode**: Open site in private/incognito window
- **Clear Cache**: Browser settings → Clear browsing data

### 2. Wait for Deployment
- Deployments take **2-5 minutes**
- Check Cloudflare dashboard for build status
- Look for green checkmark ✅ next to latest commit

### 3. Purge Cloudflare Cache (If Needed)
1. Go to Cloudflare dashboard
2. Select your domain
3. Go to **Caching** → **Configuration**
4. Click **Purge Everything**

### 4. Verify Git Push Succeeded
```bash
git log --oneline -5
git status
```

## Manual Deployment Trigger

If automatic deployment fails, you can trigger manually:

### Option 1: Empty Commit
```bash
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

### Option 2: Cloudflare Dashboard
1. Go to Cloudflare Pages dashboard
2. Click on your project
3. Click **Create deployment**
4. Select branch: `main`
5. Click **Save and Deploy**

## Deployment Checklist

Before pushing important changes:

- [ ] Test locally: `npm run dev`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run build`
- [ ] Commit with clear message
- [ ] Push to main branch
- [ ] Wait 2-5 minutes
- [ ] Hard refresh browser
- [ ] Verify changes live

## Troubleshooting

### Build Fails
- Check Cloudflare build logs
- Verify all dependencies in `package.json`
- Test build locally first

### Changes Not Visible
1. Hard refresh (Ctrl+Shift+R)
2. Check deployment completed (green checkmark)
3. Try incognito mode
4. Purge Cloudflare cache
5. Wait 5 more minutes (CDN propagation)

### Deployment Stuck
- Check GitHub Actions tab for errors
- Verify Cloudflare webhook is active
- Try manual deployment from dashboard

## Current Setup

- **Repository**: https://github.com/hudsonargollo/praia-pix-order
- **Branch**: main
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite + React
- **Deployment**: Automatic on push

## Quick Commands

```bash
# Check current branch
git branch

# View recent commits
git log --oneline -5

# Force deployment
git commit --allow-empty -m "Deploy" && git push origin main

# Build locally
npm run build

# Test production build
npm run preview
```

## Support

If deployments consistently fail:
1. Check Cloudflare Pages dashboard for error logs
2. Verify GitHub webhook is active
3. Check build command and environment variables
4. Contact Cloudflare support if needed
