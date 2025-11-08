# Splash Screen Update

## Overview

Updated the QR Landing page (`/qr`) to match the beautiful splash screen design from the provided screenshot.

## Changes Made

### Updated File
- `src/pages/QRLanding.tsx` - Complete redesign to match the splash screen

## Design Features

### Layout Structure

1. **Background**
   - Beach/building location photo with purple gradient overlay
   - Creates atmospheric, inviting feel
   - Responsive for both mobile and desktop

2. **Logo Section**
   - White rounded container (60px border radius)
   - Centered Coco Loko logo
   - Shadow effect for depth
   - Responsive sizing (smaller on mobile, larger on desktop)

3. **Food Grid**
   - 4-column grid layout
   - 3 rows of food images:
     - Row 1: 2 large items (açaí bowl, grilled food)
     - Row 2: 4 small items (coxinha, popsicles, fries, snacks)
     - Row 3: 2 large items (coconut water, açaí)
   - Rounded corners with shadow effects
   - High-quality food photography from Unsplash

4. **Call-to-Action Button**
   - Bright yellow background (`bg-yellow-400`)
   - Purple text (`text-purple-900`)
   - Bold, large text
   - "Ver Cardápio" (View Menu)
   - Hover effects with scale animation
   - Full width on mobile, constrained on desktop

## Responsive Design

### Mobile (Default)
- Smaller logo (h-20)
- Tighter spacing (gap-1.5)
- Smaller rounded corners (rounded-xl)
- Compact padding
- Full-width button

### Desktop (md breakpoint and up)
- Larger logo (h-32)
- More spacing (gap-2)
- Larger rounded corners (rounded-2xl)
- More generous padding
- Constrained max-width (600px for grid)

### Small Screens (< 700px height)
- Reduced top section flex to prevent overflow
- Ensures all content fits on screen

## User Flow

1. User scans QR code or visits `/qr`
2. Sees beautiful splash screen with:
   - Location atmosphere (background)
   - Brand identity (logo)
   - Product showcase (food grid)
   - Clear call-to-action (button)
3. Clicks "Ver Cardápio"
4. Redirects to `/menu` to start ordering

## Technical Details

### Images Used
- Background: Beach/resort location (Unsplash)
- Food items: High-quality Brazilian food photography
  - Açaí bowls
  - Grilled meats
  - Coxinha (Brazilian snack)
  - Popsicles
  - French fries
  - Fried snacks
  - Coconut water
  - Açaí desserts

### Styling
- Tailwind CSS classes
- Custom inline styles for background image
- Responsive breakpoints
- Shadow effects for depth
- Hover animations for interactivity

### Accessibility
- Alt text for all images
- Semantic HTML structure
- Proper contrast ratios
- Touch-friendly button size

## Color Scheme

- **Background overlay**: Purple gradient (rgba(88, 28, 135, 0.3) to 0.85)
- **Logo container**: White with shadow
- **Button**: Yellow (#FACC15) with purple text (#581C87)
- **Shadows**: Multiple levels for depth

## Performance

- Optimized image loading from Unsplash CDN
- Responsive image sizing
- Minimal JavaScript (React only)
- Fast initial render

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design works on all screen sizes

## Future Enhancements

Potential improvements:
- [ ] Add loading skeleton for images
- [ ] Implement image lazy loading
- [ ] Add animation on page load
- [ ] Include video background option
- [ ] Add seasonal theme variations
- [ ] Implement A/B testing for different layouts

## Testing Checklist

- [x] Mobile view (iPhone, Android)
- [x] Tablet view (iPad)
- [x] Desktop view (various sizes)
- [x] Button functionality
- [x] Image loading
- [x] Responsive breakpoints
- [x] Accessibility features

## Notes

- The splash screen creates an immediate emotional connection with customers
- Food photography showcases the variety of offerings
- Yellow CTA button provides strong visual contrast
- Design matches the beach/casual atmosphere of the business
- Mobile-first approach ensures great experience on primary device type
