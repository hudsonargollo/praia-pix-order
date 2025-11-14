# Implementation Plan

- [x] 1. Update payment page header with new title and subtitle
  - Modify header section in `src/pages/customer/Payment.tsx`
  - Change title from "Pagamento" to "Detalhes do pagamento PIX"
  - Add subtitle "Use o código PIX abaixo para concluir o pagamento" below title
  - Adjust header padding to `p-4` for better spacing
  - Ensure back button remains functional
  - Maintain gradient background styling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create utility functions for formatting
- [x] 2.1 Implement PIX code snippet formatter
  - Create `formatPixSnippet` function in `src/pages/customer/Payment.tsx`
  - Extract first 10 characters and last 6 characters from PIX code
  - Return formatted string as `${first10}...${last6}`
  - Handle edge cases for short PIX codes (< 16 chars)
  - _Requirements: 2.3_

- [x] 2.2 Implement phone number formatter
  - Create `formatPhoneNumber` function in `src/pages/customer/Payment.tsx`
  - Remove all non-digit characters from input
  - Extract last 11 digits (DDD + 9 digits)
  - Format as "(DDD) 00000-0000"
  - Return original value if formatting fails
  - _Requirements: 4.3, 4.4_

- [x] 3. Create primary PIX code section
  - Add new Card component above QR code section
  - Add "Código PIX" label with `text-lg font-bold`
  - Display PIX code snippet using `formatPixSnippet` function
  - Style snippet container with `bg-gray-50 p-4 rounded-lg`
  - Make snippet text selectable with `select-all` class
  - Add helper text "Clique em 'Copiar Código PIX' para colar no app do seu banco"
  - Add full-width "Copiar Código PIX" button with `py-6 text-lg`
  - Wire button to existing `copyPixCode` function
  - Add visual emphasis with `border-2 border-primary/20`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8_

- [x] 4. Demote QR code section to secondary option
  - Move QR code Card below primary PIX code section
  - Change title to "Pagar com QR Code (opcional)"
  - Reduce title size from `text-lg` to `text-base`
  - Add helper text "Se preferir, aponte a câmera do app do seu banco para o QR Code"
  - Reduce QR code image size from `w-64 h-64` to `w-48 h-48`
  - Reduce card padding from `p-6` to `p-4`
  - Remove the prominent copy button from QR code section (now in primary section)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 5. Remove old PIX code display section
  - Remove the "Ou copie o código Pix" Card that displays full PIX code
  - Remove the secondary copy button from that section
  - Ensure no duplicate copy functionality remains
  - _Requirements: 2.8_

- [x] 6. Update order summary with formatted phone number
  - Locate "Resumo do Pedido" Card in `src/pages/customer/Payment.tsx`
  - Apply `formatPhoneNumber` function to `order.customer_phone` display
  - Verify phone number displays as "(DDD) 00000-0000" format
  - Ensure other order summary fields remain unchanged
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Fix back button navigation
  - Create `handleBack` function in `src/pages/customer/Payment.tsx`
  - Implement `window.history.back()` as primary navigation method
  - Add fallback to `navigate('/menu')` if history is empty
  - Remove navigation to broken `checkout-...` route
  - Update back button onClick to use new `handleBack` function
  - Ensure button maintains minimum 44x44px touch target
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Update copy button success message
  - Modify `copyPixCode` function toast message
  - Change success message from "Código Pix copiado!" to "Copiado!"
  - Maintain error handling for clipboard failures
  - _Requirements: 2.6_

- [x] 9. Verify content hierarchy and layout
  - Confirm section order: Header → Status → PIX Code → QR Code → Order Summary
  - Verify PIX code section is visually prominent (larger, emphasized)
  - Verify QR code section is visually de-emphasized (smaller, labeled optional)
  - Ensure mobile-first full-width stacked layout
  - Test spacing between sections maintains readability
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Perform comprehensive testing
- [x] 10.1 Test PIX code functionality
  - Verify snippet displays correctly (first 10 + last 6 chars)
  - Verify copy button copies full PIX code (not snippet)
  - Test "Copiado!" toast appears after successful copy
  - Test on iOS Safari and Chrome Android
  - _Requirements: 2.2, 2.3, 2.5, 2.6_

- [x] 10.2 Test phone number formatting
  - Test with various input formats (+5511999999999, 5511999999999, 11999999999)
  - Verify output format is always "(11) 99999-9999"
  - Test edge cases (short numbers, invalid formats)
  - _Requirements: 4.3, 4.4_

- [x] 10.3 Test back button navigation
  - Test history.back() when navigating from menu → payment
  - Test fallback to /menu when opening payment directly
  - Verify no 404 errors occur
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 10.4 Test responsive layout
  - Test on iPhone SE (375x667)
  - Test on iPhone 12/13 (390x844)
  - Test on Samsung Galaxy S21 (360x800)
  - Test on small tablet (768x1024)
  - Verify smooth scrolling without layout shifts
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 10.5 Test accessibility compliance
  - Verify all buttons have minimum 44x44px touch target
  - Test color contrast meets WCAG AA standards
  - Test with screen reader for clear labels
  - Test keyboard navigation (tab order)
  - Verify text remains readable (minimum 14px)
  - _Requirements: 5.5, 6.3, 6.5_
