# Payment Page Cross-Device Testing Guide

## Overview
This guide provides comprehensive testing procedures for the Payment page UX improvements, focusing on cross-device compatibility and responsive behavior.

## Test Environment Setup

### Prerequisites
1. Development server running: `npm run dev`
2. Browser DevTools available (Chrome/Firefox/Safari)
3. Test order created in the system
4. Access to payment page: `http://localhost:8080/payment/:orderId`

### Testing Tools
- **Browser DevTools**: For viewport simulation
- **Responsive Design Mode**: Chrome DevTools (Cmd+Shift+M on Mac, Ctrl+Shift+M on Windows)
- **Device Emulation**: Built-in browser device presets
- **Accessibility Inspector**: For WCAG compliance checks

## Target Devices & Viewports

### 1. iPhone SE (375×667px) - Critical Small Screen
**Priority**: HIGH - This is the minimum supported viewport

**Test Scenarios**:
- [ ] Header height is ≤120px
- [ ] QR code is fully visible without scrolling
- [ ] "Copy PIX Code" button is visible without scrolling
- [ ] No horizontal overflow or scrolling
- [ ] Touch targets are minimum 44×44px
- [ ] Text is readable (≥14px)

**How to Test**:
```
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M)
3. Select "iPhone SE" from device dropdown
4. Navigate to payment page
5. Verify all elements fit in initial viewport
6. Test copy button functionality
```

**Expected Behavior**:
- Header: ~72px height (p-3 = 12px padding)
- QR Code: 256×256px
- Copy Button: Visible immediately below QR code
- Total viewport usage: ~600px (leaving 67px buffer)

### 2. iPhone 12/13 (390×844px) - Standard iOS
**Priority**: HIGH - Common iOS device

**Test Scenarios**:
- [ ] Layout is optimized with appropriate spacing
- [ ] All elements are properly aligned
- [ ] Copy button is prominent and easy to tap
- [ ] Smooth scrolling behavior
- [ ] No layout shifts during interactions

**How to Test**:
```
1. Open Safari DevTools or Chrome DevTools
2. Set viewport to 390×844px
3. Test all interactive elements
4. Verify spacing is comfortable (not cramped)
5. Test copy functionality
```

**Expected Behavior**:
- More spacious layout than iPhone SE
- Standard padding applies (p-4 = 16px)
- QR code at full size (256×256px)
- Comfortable spacing between cards

### 3. Samsung Galaxy S21 (360×800px) - Android
**Priority**: HIGH - Common Android device

**Test Scenarios**:
- [ ] Layout renders correctly on Android
- [ ] No layout shifts or overflow issues
- [ ] Copy functionality works in Chrome Android
- [ ] Touch targets are appropriate
- [ ] Scrolling is smooth

**How to Test**:
```
1. Open Chrome DevTools
2. Select "Galaxy S21" or set custom 360×800px
3. Test all functionality
4. Verify Android-specific behaviors
5. Test clipboard API
```

**Expected Behavior**:
- Similar to iPhone SE due to narrow width
- Compact mode activated (height < 700px)
- Copy button uses Clipboard API
- Toast notifications work correctly

### 4. Small Tablet (768×1024px) - iPad Mini
**Priority**: MEDIUM - Tablet support

**Test Scenarios**:
- [ ] Responsive behavior is appropriate
- [ ] Content is centered and well-spaced
- [ ] Max-width constraint (max-w-2xl = 672px) is applied
- [ ] Layout doesn't look stretched

**How to Test**:
```
1. Open DevTools
2. Set viewport to 768×1024px
3. Verify content centering
4. Check spacing and proportions
```

**Expected Behavior**:
- Content centered with max-width
- Standard spacing (no compact mode)
- Comfortable reading experience
- Proper use of available space

## Functional Testing

### Copy Button Functionality

**Test Cases**:

1. **Copy on Pending Payment**
   - [ ] Button is visible when payment status is 'pending'
   - [ ] Clicking button copies PIX code to clipboard
   - [ ] Toast notification appears: "Código Pix copiado!"
   - [ ] Clipboard contains correct PIX code

2. **Hidden on Non-Pending Status**
   - [ ] Button is hidden when status is 'approved'
   - [ ] Button is hidden when status is 'expired'
   - [ ] Button is hidden when status is 'error'

3. **Error Handling**
   - [ ] Graceful fallback if Clipboard API fails
   - [ ] Error toast appears on failure
   - [ ] No console errors

**Testing Script**:
```javascript
// Open browser console on payment page
// Test copy functionality
const copyButton = document.querySelector('button[aria-label*="Copiar"]');
copyButton.click();

// Verify clipboard
navigator.clipboard.readText().then(text => {
  console.log('Clipboard content:', text);
  console.log('Expected PIX code:', /* check against displayed code */);
});
```

### Responsive Spacing

**Viewport Height Tests**:

1. **Standard Mode (>700px height)**
   - [ ] Container padding: p-4 (16px)
   - [ ] Card spacing: space-y-6 (24px)
   - [ ] Card padding: p-6 (24px)

2. **Compact Mode (600-700px height)**
   - [ ] Container padding: p-3 (12px)
   - [ ] Card spacing: space-y-4 (16px)
   - [ ] Card padding: p-4 (16px)

3. **Ultra-Compact Mode (<600px height)**
   - [ ] Container padding: p-2 (8px)
   - [ ] Card spacing: space-y-3 (12px)
   - [ ] Card padding: p-3 (12px)
   - [ ] QR code size: 192×192px (reduced from 256px)

**Testing Method**:
```
1. Open DevTools
2. Set width to 375px (iPhone SE)
3. Gradually reduce height from 800px to 500px
4. Observe spacing changes at breakpoints
5. Verify no content is cut off
```

### Smooth Scrolling

**Test Scenarios**:
- [ ] No layout shifts when scrolling
- [ ] Smooth scroll behavior enabled
- [ ] No janky animations
- [ ] Content doesn't jump or reflow
- [ ] Fixed elements remain stable

**Testing Method**:
```
1. Load payment page
2. Scroll slowly from top to bottom
3. Observe for any jumps or shifts
4. Test on different viewport sizes
5. Verify smooth transitions
```

## Accessibility Testing

### Touch Targets

**Requirements**: Minimum 44×44px for all interactive elements

**Elements to Test**:
- [ ] Back button: ≥44×44px
- [ ] Copy PIX Code button (prominent): ≥48px height
- [ ] Copy button (secondary): ≥44×44px
- [ ] Status buttons (retry, etc.): ≥44×44px

**Testing Method**:
```javascript
// Run in browser console
document.querySelectorAll('button').forEach(btn => {
  const rect = btn.getBoundingClientRect();
  console.log(btn.textContent, {
    width: rect.width,
    height: rect.height,
    meetsStandard: rect.width >= 44 && rect.height >= 44
  });
});
```

### Color Contrast

**Requirements**: WCAG AA - 4.5:1 for normal text, 3:1 for large text

**Elements to Test**:
- [ ] Header text on gradient background
- [ ] Button text on primary color
- [ ] Body text on white background
- [ ] Status badge text
- [ ] Muted text (secondary information)

**Testing Tools**:
- Chrome DevTools Lighthouse
- WebAIM Contrast Checker
- Browser accessibility inspector

**Testing Method**:
```
1. Open Chrome DevTools
2. Run Lighthouse audit
3. Check "Accessibility" category
4. Review contrast issues
5. Verify all text meets WCAG AA
```

### Keyboard Navigation

**Test Scenarios**:
- [ ] Tab order is logical (top to bottom)
- [ ] All interactive elements are focusable
- [ ] Focus indicators are visible
- [ ] Enter/Space activates buttons
- [ ] No keyboard traps

**Testing Method**:
```
1. Load payment page
2. Press Tab repeatedly
3. Verify focus order: Back button → Copy button → Secondary copy button
4. Press Enter on focused buttons
5. Verify all actions work via keyboard
```

### Screen Reader

**Test Scenarios**:
- [ ] Header has proper role="banner"
- [ ] Main content has role="main"
- [ ] Status updates are announced (aria-live)
- [ ] Buttons have clear labels
- [ ] Images have descriptive alt text

**Testing Method**:
```
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate through payment page
3. Verify all content is announced
4. Check button labels are clear
5. Verify status changes are announced
```

## Browser-Specific Testing

### iOS Safari

**Specific Tests**:
- [ ] Clipboard API works correctly
- [ ] Touch events respond properly
- [ ] Viewport height handles iOS address bar
- [ ] No zoom on input focus
- [ ] Smooth scrolling works

**Known Issues to Check**:
- iOS Safari address bar affects viewport height
- Clipboard API may require user gesture
- Touch delay on buttons

### Chrome Android

**Specific Tests**:
- [ ] Clipboard API works correctly
- [ ] Material Design ripple effects
- [ ] Back button behavior
- [ ] Toast notifications appear correctly
- [ ] No horizontal overflow

**Known Issues to Check**:
- Android back button handling
- Clipboard permissions
- Toast positioning

### Desktop Browsers

**Specific Tests**:
- [ ] Chrome: Full functionality
- [ ] Firefox: Clipboard API compatibility
- [ ] Safari: WebKit-specific behaviors
- [ ] Edge: Chromium compatibility

## Performance Testing

### Load Time
- [ ] Payment page loads in <2 seconds
- [ ] QR code renders immediately
- [ ] No layout shift during load

### Interaction Performance
- [ ] Copy button responds in <100ms
- [ ] Toast appears in <200ms
- [ ] Smooth 60fps scrolling

### Memory Usage
- [ ] No memory leaks during polling
- [ ] Cleanup on component unmount
- [ ] Efficient re-renders

## Test Results Documentation

### Test Report Template

```markdown
## Test Session: [Date]
**Tester**: [Name]
**Environment**: [Browser/Device]

### Device: [Device Name]
**Viewport**: [Width × Height]
**Status**: ✅ Pass / ❌ Fail / ⚠️ Partial

#### Test Results:
- [ ] Header compact layout
- [ ] QR code visibility
- [ ] Copy button visibility
- [ ] Touch targets
- [ ] Scrolling behavior
- [ ] Copy functionality
- [ ] Accessibility

#### Issues Found:
1. [Description]
2. [Description]

#### Screenshots:
[Attach screenshots]
```

## Automated Testing

### Visual Regression Testing

```bash
# Install dependencies
npm install -D @playwright/test

# Run visual tests
npx playwright test --project=chromium
```

### Responsive Testing Script

```javascript
// tests/payment-responsive.spec.ts
import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 }
];

devices.forEach(device => {
  test(`Payment page on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto('/payment/test-order-id');
    
    // Check header height
    const header = page.locator('header');
    const headerBox = await header.boundingBox();
    expect(headerBox?.height).toBeLessThanOrEqual(120);
    
    // Check copy button visibility
    const copyButton = page.locator('button:has-text("Copiar Código Pix")');
    await expect(copyButton).toBeInViewport();
    
    // Check QR code visibility
    const qrCode = page.locator('img[alt*="QR Code"]');
    await expect(qrCode).toBeInViewport();
  });
});
```

## Sign-Off Checklist

Before marking task as complete:

- [ ] All target devices tested
- [ ] Copy functionality verified on iOS and Android
- [ ] No scrolling needed for QR + button on iPhone SE
- [ ] Smooth scrolling confirmed
- [ ] Layout shifts eliminated
- [ ] Touch targets meet 44×44px minimum
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility verified
- [ ] Test report documented
- [ ] Screenshots captured
- [ ] Issues logged (if any)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Safari Viewport Guide](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Android Touch Target Guidelines](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [Clipboard API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
