# Splash Screen Setup Instructions

## Background Image Setup

To complete the splash screen setup, you need to add the background image:

### Step 1: Add the Background Image

1. Place your `bck.webp` file in the `public` folder at the root of the project
2. The file path should be: `public/bck.webp`

### Step 2: Verify the Setup

The splash screen is now configured to use this image with a purple gradient overlay.

## User Flow

The simplified flow is now:

1. **User scans QR code** → Redirects to `/qr` (splash screen)
2. **User clicks "Ver Cardápio"** → Goes to `/menu` to start ordering

### QR Code URLs

You can use any of these URLs for your QR codes:
- `https://your-domain.com/qr` - Direct to splash screen
- `https://your-domain.com/mesa-1` - With table ID (still shows splash screen)
- `https://your-domain.com/` - Home page (has button to splash screen)

All paths lead to the same beautiful splash screen!

## What Changed

### Removed
- ❌ Separate Welcome page with table information
- ❌ Customer information form on landing

### Simplified
- ✅ Direct splash screen on QR scan
- ✅ Single "Ver Cardápio" button
- ✅ Cleaner, faster user experience

## File Structure

```
public/
  └── bck.webp          # Background image (YOU NEED TO ADD THIS)

src/
  ├── assets/
  │   └── coco-loko-logo.png
  └── pages/
      ├── QRLanding.tsx  # Main splash screen
      ├── QRRedirect.tsx # Handles QR code scans
      └── Menu.tsx       # Menu page (after splash)
```

## Design Features

### Layout
- Background image with purple gradient overlay
- Centered white logo container with rounded corners
- 3x4 food grid showcasing menu items
- Bright yellow CTA button

### Responsive
- Mobile-first design
- Adapts to desktop with larger elements
- Works on all screen sizes

### Colors
- Background overlay: Purple gradient (rgba(88, 28, 135))
- Logo container: White with shadow
- Button: Yellow (#FACC15) with purple text

## Testing

After adding `bck.webp`:

1. Visit `http://localhost:8080/qr`
2. Verify background image loads
3. Check logo displays correctly
4. Test food grid images
5. Click "Ver Cardápio" button
6. Verify redirect to menu

## Troubleshooting

### Background image not showing
- Verify `bck.webp` is in `public/` folder
- Check file name is exactly `bck.webp` (case-sensitive)
- Clear browser cache and reload
- Check browser console for 404 errors

### Images not loading
- Check internet connection (food images from Unsplash)
- Verify logo file exists in `src/assets/`

### Button not working
- Check browser console for errors
- Verify routing is configured correctly

## Next Steps

1. Add `bck.webp` to `public/` folder
2. Test the splash screen
3. Generate QR codes pointing to your domain
4. Print and place QR codes at tables
5. Enjoy the streamlined customer experience!
