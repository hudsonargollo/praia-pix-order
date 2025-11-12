# Deploying Background Image to Cloudflare Pages

## Overview

Static assets in the `public/` folder are automatically deployed with your Cloudflare Pages site. Here's how to ensure your `bck.webp` image is included.

## Method 1: Include in Git Repository (Recommended)

### Steps:

1. **Add the image to your project:**
   ```bash
   # Place bck.webp in the public folder
   cp /path/to/your/bck.webp public/bck.webp
   ```

2. **Commit to Git:**
   ```bash
   git add public/bck.webp
   git commit -m "Add splash screen background image"
   git push
   ```

3. **Cloudflare Pages will automatically:**
   - Detect the push
   - Build your project
   - Include all files from `public/` in the deployment
   - Serve `bck.webp` at `https://your-domain.pages.dev/bck.webp`

### Verify Deployment:

After deployment completes, check:
```
https://your-domain.pages.dev/bck.webp
```

You should see your image!

---

## Method 2: Manual Upload via Cloudflare Dashboard

If you don't want to commit the image to Git (e.g., large file):

### Steps:

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Add image to dist folder:**
   ```bash
   cp /path/to/your/bck.webp dist/bck.webp
   ```

3. **Deploy manually:**
   ```bash
   wrangler pages deploy dist --project-name=coco-loko-acaiteria
   ```

### Note:
This method requires manual upload each time you deploy.

---

## Method 3: Use Cloudflare Images (Advanced)

For better performance and optimization:

### Steps:

1. **Upload to Cloudflare Images:**
   - Go to Cloudflare Dashboard
   - Navigate to Images
   - Upload `bck.webp`
   - Get the image URL (e.g., `https://imagedelivery.net/your-account/image-id/public`)

2. **Update QRLanding.tsx:**
   ```typescript
   backgroundImage: `linear-gradient(...), url('https://imagedelivery.net/your-account/image-id/public')`
   ```

3. **Benefits:**
   - Automatic optimization
   - CDN delivery
   - Responsive images
   - Smaller bundle size

---

## Recommended Approach

**For your use case, use Method 1 (Git Repository):**

### Complete Steps:

```bash
# 1. Add image to public folder
cp bck.webp public/bck.webp

# 2. Verify it's there
ls -lh public/bck.webp

# 3. Add to git
git add public/bck.webp

# 4. Commit
git commit -m "Add splash screen background image"

# 5. Push to trigger deployment
git push origin main

# 6. Wait for Cloudflare Pages to build (2-3 minutes)

# 7. Verify deployment
curl -I https://your-domain.pages.dev/bck.webp
```

---

## Build Process

When Cloudflare Pages builds your project:

1. **Runs:** `npm run build`
2. **Vite copies:** Everything from `public/` to `dist/`
3. **Cloudflare deploys:** Everything in `dist/` to their CDN
4. **Result:** `public/bck.webp` → `dist/bck.webp` → `https://your-domain.pages.dev/bck.webp`

---

## Troubleshooting

### Image not showing after deployment

**Check 1: Verify image is in dist folder**
```bash
npm run build
ls -lh dist/bck.webp
```

**Check 2: Verify image is accessible**
```bash
curl -I https://your-domain.pages.dev/bck.webp
```

Should return `200 OK`

**Check 3: Check browser console**
- Open DevTools (F12)
- Go to Network tab
- Reload page
- Look for `bck.webp` request
- Check if it's 200 or 404

**Check 4: Clear Cloudflare cache**
- Go to Cloudflare Dashboard
- Navigate to Caching → Configuration
- Click "Purge Everything"
- Wait 30 seconds
- Try again

### Image is too large

**Optimize the image:**

```bash
# Install imagemagick or use online tools
# Resize to reasonable dimensions
convert bck.webp -resize 1920x1080 -quality 85 bck-optimized.webp

# Use the optimized version
cp bck-optimized.webp public/bck.webp
```

**Recommended specs:**
- Format: WebP
- Dimensions: 1920x1080 or 1200x1600
- Quality: 80-85%
- File size: < 500KB

---

## Testing Locally

Before deploying, test locally:

```bash
# 1. Add image to public folder
cp bck.webp public/bck.webp

# 2. Start dev server
npm run dev

# 3. Visit
open http://localhost:8080/qr

# 4. Check if background shows
# 5. Check browser console for errors
```

---

## Production Checklist

- [ ] Image added to `public/bck.webp`
- [ ] Image optimized (< 500KB)
- [ ] Tested locally
- [ ] Committed to Git
- [ ] Pushed to repository
- [ ] Cloudflare Pages build completed
- [ ] Image accessible at `https://your-domain.pages.dev/bck.webp`
- [ ] Splash screen displays correctly
- [ ] Tested on mobile and desktop

---

## Alternative: Use Existing Image

If you don't have `bck.webp` yet, you can temporarily use an Unsplash image:

**Update `src/pages/QRLanding.tsx`:**

```typescript
backgroundImage: `linear-gradient(to bottom, rgba(88, 28, 135, 0.3) 0%, rgba(88, 28, 135, 0.85) 100%), url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop')`
```

This works immediately without needing to add any files!

---

## Summary

**Easiest method:**
1. Put `bck.webp` in `public/` folder
2. Commit and push to Git
3. Cloudflare Pages automatically includes it
4. Done!

**The image will be available at:**
- Local: `http://localhost:8080/bck.webp`
- Production: `https://your-domain.pages.dev/bck.webp`

No special configuration needed - Cloudflare Pages handles everything automatically! 🎉
