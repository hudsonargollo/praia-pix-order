# Implementation Plan

- [x] 1. Optimize payment page header layout
  - Modify header section in `src/pages/customer/Payment.tsx` to use compact horizontal layout
  - Change padding from `p-6` to `p-3` to reduce vertical space
  - Update title size from `text-2xl` to `text-xl`
  - Combine back button and title in horizontal flex layout
  - Update order info text from `text-base` to `text-sm`
  - Ensure back button remains functional with new layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Add prominent "Copy PIX Code" button after QR code
  - Create new button component immediately after QR code image in the QR code card
  - Style button with `py-6` for larger touch target (48px height)
  - Use `text-lg` font size for better readability
  - Apply primary color scheme with hover states
  - Add Copy icon from lucide-react
  - Wire button to existing `copyPixCode` function
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implement responsive spacing adjustments
  - Add CSS media query for viewports with height < 700px in `src/index.css`
  - Reduce container padding from `p-4` to `p-3` on small viewports
  - Reduce card spacing from `space-y-6` to `space-y-4` on small viewports
  - Add media query for ultra-compact mode (< 600px height)
  - Test layout on iPhone SE (375x667) and similar devices
  - _Requirements: 1.5, 3.1, 3.2, 3.4_


- [x] 4. Add conditional rendering for copy button based on payment status
  - Wrap prominent copy button in conditional check for `paymentStatus === 'pending'`
  - Ensure button is hidden when payment is approved, expired, or error
  - Verify button appears correctly when payment data loads
  - Test button visibility across all payment status transitions
  - _Requirements: 2.6_

- [x] 5. Ensure accessibility compliance
  - Verify copy button has minimum 44x44px touch target size
  - Test color contrast ratio meets WCAG AA standards (4.5:1 for text)
  - Ensure button has clear aria-label or accessible text
  - Verify keyboard navigation works correctly (tab order)
  - Test with screen reader to confirm button purpose is clear
  - Ensure text remains readable with minimum 14px font size
  - _Requirements: 3.3, 3.5_

- [x] 6. Perform cross-device testing
  - Test on iPhone SE (375x667) to verify no scrolling needed for QR + button
  - Test on iPhone 12/13 (390x844) to verify layout optimization
  - Test on Samsung Galaxy S21 (360x800) to verify Android compatibility
  - Test on small tablet (768x1024) to ensure responsive behavior
  - Verify smooth scrolling without layout shifts
  - Test copy functionality on iOS Safari and Chrome Android
  - _Requirements: 3.1, 3.4_
