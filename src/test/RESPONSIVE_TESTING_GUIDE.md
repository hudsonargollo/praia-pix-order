# Responsive Behavior Testing Guide

This guide provides manual testing procedures to verify the responsive behavior improvements made to the Waiter Dashboard.

## Test Environment Setup

### Browser DevTools
1. Open Chrome/Firefox DevTools (F12)
2. Enable Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test with both device presets and custom dimensions

### Test Account
- Role: Waiter
- Access: `/waiter/dashboard`

## Test Cases

### 1. Desktop Layout - Side-by-side Cards

**Objective**: Verify that "Place Order" and "Total Sales" cards display side-by-side on desktop viewports.

**Test Steps**:
1. Navigate to Waiter Dashboard
2. Set viewport to 1280x800 (Desktop)
3. Verify cards are displayed horizontally
4. Set viewport to 1024x768 (Breakpoint)
5. Verify cards remain side-by-side
6. Set viewport to 1023x768 (Below breakpoint)
7. Verify cards stack vertically

**Expected Results**:
- ✅ Cards display side-by-side at ≥1024px width
- ✅ Cards stack vertically at <1024px width
- ✅ Equal spacing between cards
- ✅ No horizontal scrolling
- ✅ Proper alignment and padding

**Requirements Verified**: 1.1, 1.2, 1.3, 1.4, 1.5

---

### 2. Mobile Modal Behavior

**Objective**: Verify that modals (OrderEditModal) display correctly on mobile devices without layout issues.

**Test Steps**:
1. Set viewport to 375x667 (iPhone SE)
2. Open an order for editing
3. Verify modal fits within viewport
4. Scroll through modal content
5. Test with 390x844 (iPhone 12 Pro)
6. Test with 360x800 (Galaxy S21)

**Expected Results**:
- ✅ Modal fits within viewport width
- ✅ No horizontal scrolling required
- ✅ Content is scrollable vertically
- ✅ Action buttons are visible and accessible
- ✅ Proper padding and spacing on mobile

**Requirements Verified**: 4.1, 4.2, 4.3, 4.4, 4.5

---

### 3. Touch Target Verification

**Objective**: Verify that all interactive elements meet the 44px minimum touch target size on mobile.

**Test Steps**:
1. Set viewport to 375x667 (Mobile)
2. Navigate to Waiter Dashboard
3. Inspect button elements in DevTools
4. Measure height of interactive elements:
   - Edit order buttons
   - Status change buttons
   - Modal action buttons (Save, Cancel)
   - Add item buttons

**Expected Results**:
- ✅ All buttons have min-height of 44px on mobile
- ✅ Adequate spacing between touch targets (≥8px)
- ✅ Touch targets are easily tappable
- ✅ No accidental taps on adjacent elements

**Requirements Verified**: 4.2, 5.3

---

### 4. Scroll Behavior in Modals

**Objective**: Verify that modals handle long content with proper scrolling on mobile.

**Test Steps**:
1. Set viewport to 375x667 (Mobile)
2. Open an order with many items (10+ items)
3. Verify content scrolls within modal
4. Scroll to bottom of content
5. Verify action buttons remain visible (sticky footer)
6. Test on different mobile sizes

**Expected Results**:
- ✅ Modal content scrolls smoothly
- ✅ Sticky footer remains visible during scroll
- ✅ No content is cut off
- ✅ Scroll indicators are visible
- ✅ Modal doesn't exceed 90vh height

**Requirements Verified**: 4.3, 5.4

---

### 5. Phone Number Formatting

**Objective**: Verify that phone numbers display in (XX) 00000-0000 format across all views.

**Test Steps**:
1. Navigate to Waiter Dashboard
2. Check phone numbers in order list
3. Open order edit modal
4. Verify phone format in modal header
5. Check MobileOrderCard component
6. Test on both mobile and desktop viewports

**Expected Results**:
- ✅ All phone numbers formatted as (XX) 00000-0000
- ✅ Format consistent across all views
- ✅ Invalid numbers display gracefully
- ✅ Format works on mobile and desktop

**Test Data**:
- Valid: `11987654321` → `(11) 98765-4321`
- Valid: `21987654321` → `(21) 98765-4321`
- Invalid: `123` → `123` (fallback)

**Requirements Verified**: 7.1, 7.2, 7.3, 7.4, 7.5

---

### 6. Order Number Display

**Objective**: Verify that order numbers display as "Pedido #123" instead of UUID hashes.

**Test Steps**:
1. Navigate to Waiter Dashboard
2. Check order numbers in order list
3. Open order edit modal
4. Verify order number in modal header
5. Check MobileOrderCard component
6. Test with orders that have order_number
7. Test with legacy orders (UUID fallback)

**Expected Results**:
- ✅ Order numbers display as "Pedido #123"
- ✅ Format consistent across all views
- ✅ Legacy orders show short UUID as fallback
- ✅ Numbers are easily readable

**Requirements Verified**: 6.1, 6.2, 6.3, 6.4, 6.5

---

### 7. Responsive Breakpoint Transitions

**Objective**: Verify smooth transitions between responsive breakpoints.

**Test Steps**:
1. Start at 375px width (Mobile)
2. Gradually increase width to 640px (Tablet)
3. Continue to 768px (Large Tablet)
4. Continue to 1024px (Desktop)
5. Continue to 1440px (Large Desktop)
6. Observe layout changes at each breakpoint

**Expected Results**:
- ✅ Smooth transitions without layout breaks
- ✅ No content overflow at any size
- ✅ Proper spacing maintained
- ✅ Typography scales appropriately
- ✅ Images and cards resize properly

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 767px
- Large Tablet: 768px - 1023px
- Desktop: ≥ 1024px

**Requirements Verified**: 1.1, 1.2, 1.3

---

### 8. Device-Specific Testing

**Objective**: Verify correct rendering on common mobile devices.

**Test Devices**:

#### iPhone SE (375x667)
- ✅ Dashboard loads correctly
- ✅ Cards stack vertically
- ✅ Modals fit viewport
- ✅ Touch targets adequate

#### iPhone 12 Pro (390x844)
- ✅ Dashboard loads correctly
- ✅ Extra height utilized well
- ✅ Modals display properly
- ✅ Scrolling smooth

#### Samsung Galaxy S21 (360x800)
- ✅ Dashboard loads correctly
- ✅ Narrower width handled
- ✅ No horizontal scroll
- ✅ Touch targets accessible

#### iPad (768x1024)
- ✅ Dashboard loads correctly
- ✅ Layout optimized for tablet
- ✅ Cards may stack or display side-by-side
- ✅ Modals sized appropriately

#### iPad Pro (1024x1366)
- ✅ Dashboard loads correctly
- ✅ Desktop layout active
- ✅ Cards side-by-side
- ✅ Full desktop experience

**Requirements Verified**: 1.1, 4.1, 5.1

---

## Automated Test Coverage

The following automated tests verify responsive behavior:

```bash
npm test -- waiter-dashboard-responsive.test.tsx --run
```

**Test Coverage**:
- ✅ Desktop viewport support (1024px, 1280px, 1440px, 1920px)
- ✅ Mobile viewport support (360px, 375px, 390px)
- ✅ Tablet viewport support (640px, 768px)
- ✅ Touch target size verification (44px minimum)
- ✅ Phone number formatting (Brazilian format)
- ✅ Order number formatting (Pedido #123)
- ✅ Breakpoint transitions
- ✅ Device-specific viewports

---

## Common Issues and Solutions

### Issue: Horizontal scrolling on mobile
**Solution**: Check for fixed-width elements, ensure max-width: 100%

### Issue: Touch targets too small
**Solution**: Verify min-height: 44px and adequate padding

### Issue: Modal doesn't fit viewport
**Solution**: Check max-height: 90vh and overflow-y: auto

### Issue: Phone numbers not formatted
**Solution**: Verify formatPhoneNumber() is called in component

### Issue: Cards not side-by-side on desktop
**Solution**: Check lg: breakpoint classes (lg:grid-cols-2)

---

## Performance Considerations

### Mobile Performance
- ✅ Smooth scrolling (60fps)
- ✅ Fast modal open/close
- ✅ No layout shifts
- ✅ Optimized images

### Desktop Performance
- ✅ Efficient grid layout
- ✅ No unnecessary re-renders
- ✅ Fast data loading
- ✅ Smooth transitions

---

## Accessibility Verification

### Touch Accessibility
- ✅ Minimum 44px touch targets
- ✅ Adequate spacing between elements
- ✅ Clear visual feedback on tap

### Visual Accessibility
- ✅ Readable font sizes on mobile (≥16px)
- ✅ Sufficient color contrast
- ✅ Clear visual hierarchy

### Keyboard Accessibility
- ✅ Tab navigation works
- ✅ Focus indicators visible
- ✅ Modal traps focus appropriately

---

## Sign-off Checklist

Before marking task complete, verify:

- [ ] All automated tests pass
- [ ] Manual testing completed on 3+ devices
- [ ] Desktop layout verified at 1024px+
- [ ] Mobile modals tested on 375px viewport
- [ ] Touch targets meet 44px minimum
- [ ] Scroll behavior works in modals
- [ ] Phone numbers formatted correctly
- [ ] Order numbers display properly
- [ ] No horizontal scrolling on any device
- [ ] Smooth transitions between breakpoints
- [ ] Performance is acceptable
- [ ] Accessibility requirements met

---

## Test Results Summary

**Date**: _____________
**Tester**: _____________

| Test Case | Status | Notes |
|-----------|--------|-------|
| Desktop Layout | ⬜ Pass ⬜ Fail | |
| Mobile Modals | ⬜ Pass ⬜ Fail | |
| Touch Targets | ⬜ Pass ⬜ Fail | |
| Scroll Behavior | ⬜ Pass ⬜ Fail | |
| Phone Formatting | ⬜ Pass ⬜ Fail | |
| Order Numbers | ⬜ Pass ⬜ Fail | |
| Breakpoints | ⬜ Pass ⬜ Fail | |
| Device Testing | ⬜ Pass ⬜ Fail | |

**Overall Result**: ⬜ Pass ⬜ Fail

**Additional Notes**:
_____________________________________________
_____________________________________________
_____________________________________________
