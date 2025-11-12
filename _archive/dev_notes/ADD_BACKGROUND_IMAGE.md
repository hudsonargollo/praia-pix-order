# Add Background Image

## Quick Instructions

To complete the splash screen setup:

1. **Add your background image:**
   - Place `bck.webp` in the `public/` folder
   - Path should be: `public/bck.webp`

2. **That's it!** The splash screen is ready to use.

## Test It

Visit: `http://localhost:8080/qr`

You should see:
- Your background image with purple overlay
- Coco Loko logo in white container
- Food grid with 8 images
- Yellow "Ver Cardápio" button

## Image Requirements

- **Format:** WebP (recommended for performance)
- **Recommended size:** 1200x1600px or larger
- **Content:** Should show your location/building (like in the screenshot)
- **File name:** Must be exactly `bck.webp`

## Alternative: Use a Different Image

If you want to use a different image or format:

1. Open `src/pages/QRLanding.tsx`
2. Find line with `url('/bck.webp')`
3. Change to your image path, e.g., `url('/my-image.jpg')`

## Need Help?

If the image doesn't show:
- Check the file is in `public/` folder
- Verify the file name matches exactly
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors
