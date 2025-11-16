# Implementation Plan

## Overview

This implementation plan breaks down the conversational checkout feature into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring the system remains functional throughout development.

## Current State Analysis

**Existing Implementation:**
- ✅ Legacy checkout exists at `src/pages/customer/Checkout.tsx`
- ✅ Current checkout collects customer info (name, phone) via `CustomerInfoForm` component
- ✅ Current checkout creates orders and navigates to `/payment/:orderId`
- ✅ Phone formatting utility exists in `src/lib/phoneUtils.ts` (formatPhoneNumber)
- ✅ Cart context and hooks are functional
- ✅ Routing configured in `src/App.tsx`

**Missing Implementation:**
- ❌ No CheckoutLegacy component (needs to be created by renaming)
- ❌ No `/checkout2` route for legacy checkout
- ❌ No conversational multi-step checkout UI
- ❌ No framer-motion dependency installed
- ❌ No normalizePhone function in phoneUtils.ts
- ❌ No customer upsert logic before payment
- ❌ No step-by-step animated flow

**Implementation Strategy:**
1. Preserve existing checkout by renaming to CheckoutLegacy and adding /checkout2 route
2. Build new conversational checkout from scratch with 4 steps (NAME → WHATSAPP → CONFIRM → REVIEW)
3. Add phone normalization and customer database upsert
4. Integrate with existing Payment component flow

---

## Phase 1: Route Refactoring (Legacy Preservation)

### Task 1: Preserve legacy checkout and set up routing

- [x] 1.1 Rename existing Checkout component to CheckoutLegacy
  - Rename file `src/pages/customer/Checkout.tsx` to `src/pages/customer/CheckoutLegacy.tsx`
  - Update the default export name from `Checkout` to `CheckoutLegacy`
  - Verify no other files import this component directly (only App.tsx should)
  - _Requirements: 5.2_

- [x] 1.2 Update routing in App.tsx
  - Add lazy import for `CheckoutLegacy` component: `const CheckoutLegacy = lazy(() => import("./pages/customer/CheckoutLegacy"));`
  - Add new route `/checkout2` pointing to `CheckoutLegacy` (before the catch-all route)
  - Keep existing `/checkout` route (will point to new component later)
  - Ensure both routes are wrapped in `Suspense` with `LoadingFallback`
  - _Requirements: 5.1, 5.3_

- [ ]* 1.3 Test legacy checkout at /checkout2
  - Start dev server and navigate to `/checkout2`
  - Add items to cart and complete checkout flow
  - Verify order creation works identically to before
  - Verify navigation to payment page works
  - _Requirements: 5.4_

---

## Phase 2: UI Implementation (New Conversational Flow)

### Task 2: Set up new Checkout component structure

- [x] 2.1 Install framer-motion dependency
  - Run: `npm install framer-motion`
  - Verify installation in package.json
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Create new Checkout component skeleton
  - Create new file `src/pages/customer/Checkout.tsx`
  - Add imports: React, useState, useEffect, useNavigate, framer-motion (motion, AnimatePresence)
  - Import UI components: Button, Card, Input, Label from shadcn/ui
  - Import hooks: useCart from cartContext
  - Import utilities: supabase client, toast from sonner
  - Define `CheckoutStep` type: `'NAME' | 'WHATSAPP' | 'CONFIRM' | 'REVIEW'`
  - Initialize state variables: `step`, `name`, `whatsapp`, `errors`, `isSubmitting`
  - Add empty cart redirect logic in useEffect (redirect to `/menu` if cart is empty)
  - Export default Checkout component
  - _Requirements: 1.1, 2.1_

### Task 3: Implement Step 1 - Name Input

- [x] 3.1 Create NAME step UI
  - Add background gradient container: `bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100`
  - Create centered card with max-width constraint (max-w-md)
  - Add conversational prompt heading: "Olá! 👋 Para quem é o pedido?"
  - Add text input field with Label and Input components
  - Add emoji icon (👤) before input placeholder
  - Style input with focus states and proper spacing
  - _Requirements: 1.1, 1.5_

- [x] 3.2 Implement NAME step validation and logic
  - Create validation function: `validateName(name: string)` - min 2 characters, trim whitespace
  - Add "Continuar" button (primary style)
  - Disable button when name is invalid
  - Display inline error message below input when validation fails (red text)
  - Handle button click: validate → set step to 'WHATSAPP'
  - Wrap entire step in `motion.div` with initial/animate/exit props
  - _Requirements: 1.1, 1.5, 6.1_

### Task 4: Implement Step 2 - WhatsApp Input

- [x] 4.1 Create WHATSAPP step UI
  - Create centered card with personalized prompt: "Legal, {name}! E qual o seu WhatsApp com DDD?"
  - Add tel input field with Label and Input components (type="tel")
  - Add emoji icon (📱) before input placeholder
  - Add placeholder text: "71987654321"
  - Style consistently with NAME step
  - _Requirements: 1.1, 1.5_

- [x] 4.2 Implement WHATSAPP step validation and logic
  - Implement input handler: strip non-digits, max 11 characters
  - Create validation function: `validateWhatsApp(phone: string)` - exactly 11 digits, DDD 11-99
  - Add "Confirmar WhatsApp" button (primary style)
  - Disable button when phone is invalid
  - Display inline error message below input when validation fails
  - Handle button click: validate → set step to 'CONFIRM'
  - Wrap entire step in `motion.div` with fade/slide animation
  - _Requirements: 1.1, 1.5, 6.2_

### Task 5: Implement Step 3 - Confirmation Message

- [x] 5.1 Create CONFIRM step with auto-advance
  - Create centered card with success message: "Perfeito! Vamos te avisar sobre o pedido pelo WhatsApp. 👍"
  - Add animated checkmark icon (CheckCircle from lucide-react) with green color
  - Implement `useEffect` hook with 1500ms setTimeout
  - Auto-advance to 'REVIEW' step after timeout
  - Add cleanup function to clear timeout on unmount
  - Wrap in `motion.div` with fade animation
  - _Requirements: 1.1, 1.4, 2.1_

### Task 6: Implement Step 4 - Order Review

- [x] 6.1 Create REVIEW step UI with cart summary
  - Create centered card with personalized greeting: "Aqui está o seu pedido, {name}. Tudo certo?"
  - Use `useCart()` hook to access cart items and total
  - Display cart items list with: item name, quantity, unit price, subtotal
  - Reuse styling patterns from legacy checkout for consistency
  - Display total amount in highlighted card with gradient background
  - Style with proper spacing and responsive design
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [x] 6.2 Add REVIEW step action buttons
  - Add "Editar Pedido" button (secondary/outline style)
  - Connect to navigation: `onClick={() => navigate('/menu')}`
  - Add "Ir para Pagamento" button (primary style with gradient)
  - Connect to `handleGoToPayment` function (to be implemented)
  - Show loading state on payment button when `isSubmitting` is true
  - Add loading spinner or text during submission
  - Wrap entire step in `motion.div` with fade/slide animation
  - _Requirements: 1.1, 3.4, 3.5_

### Task 7: Add AnimatePresence wrapper and configure animations

- [x] 7.1 Implement smooth step transitions
  - Wrap all step components in `<AnimatePresence mode="wait">`
  - Configure consistent motion variants for all steps:
    - initial: `{ opacity: 0, x: 20 }`
    - animate: `{ opacity: 1, x: 0 }`
    - exit: `{ opacity: 0, x: -20 }`
    - transition: `{ duration: 0.3 }`
  - Ensure only one step renders at a time based on `step` state
  - Test transitions between all steps for smoothness
  - _Requirements: 2.1, 2.2, 2.3_

---

## Phase 3: Persistence Logic and Navigation

### Task 8: Implement phone normalization utility

- [x] 8.1 Add normalizePhone function to phoneUtils.ts
  - Open `src/lib/phoneUtils.ts`
  - Create `normalizePhone(rawPhone: string): string | null` function
  - Strip all non-digit characters: `rawPhone.replace(/\D/g, '')`
  - Validate exactly 11 digits
  - Extract DDD (first 2 digits) and validate range 11-99
  - Prepend `+55` country code to create E.164 format
  - Return normalized phone string or `null` if invalid
  - Add JSDoc comments with examples (input: "71987654321", output: "+5571987654321")
  - Export function
  - _Requirements: 4.1, 4.4_

### Task 9: Implement customer upsert and payment navigation

- [x] 9.1 Create handleGoToPayment function
  - Import `normalizePhone` function from phoneUtils
  - Create async function `handleGoToPayment` in Checkout component
  - Set `isSubmitting` to true at start (in try block)
  - Call `normalizePhone(whatsapp)` and store result
  - If result is null, show error toast "Número de WhatsApp inválido" and return early
  - _Requirements: 4.1, 4.4, 4.5_

- [x] 9.2 Implement customer database upsert
  - Execute upsert to `customers` table using supabase client
  - Set fields: `whatsapp` (normalized), `name` (trimmed), `last_order_date` (current timestamp)
  - Use `{ onConflict: 'whatsapp' }` option for upsert behavior
  - Handle database errors with try-catch block
  - Show error toast "Erro ao salvar informações. Tente novamente." on failure
  - Log errors to console for debugging
  - _Requirements: 4.2, 4.3, 4.5_

- [x] 9.3 Add sessionStorage persistence and navigation
  - After successful upsert, store customer info in sessionStorage
  - Use key `'customerInfo'` with JSON.stringify of object: `{ name: name.trim(), phone: normalizedPhone }`
  - Navigate to `/payment/:orderId` route (note: orderId will come from order creation in Payment component)
  - Set `isSubmitting` to false in finally block
  - Ensure navigation only happens after successful upsert
  - _Requirements: 4.6_

---

## Phase 4: Integration and Testing

### Task 10: Update Payment component to handle new flow

- [x] 10.1 Analyze Payment component order creation logic
  - Review `src/pages/customer/Payment.tsx` to understand current order creation flow
  - Identify where order is created (currently expects orderId from URL params)
  - Determine if Payment component needs modification to create order from sessionStorage
  - Document findings and required changes
  - _Requirements: 4.6_

- [x] 10.2 Modify navigation to Payment page
  - Update `handleGoToPayment` in Checkout to navigate to correct Payment route
  - If Payment expects orderId, create order before navigation
  - If Payment can handle sessionStorage, navigate to `/payment` without orderId
  - Ensure customer info from sessionStorage is properly used
  - Test navigation flow works correctly
  - _Requirements: 4.6_

### Task 11: End-to-end testing

- [ ]* 11.1 Test legacy checkout preservation
  - Navigate to `/checkout2` in browser
  - Add items to cart from menu
  - Complete entire checkout flow
  - Verify order is created in database
  - Verify navigation to payment page works
  - Confirm functionality is identical to original checkout
  - _Requirements: 5.4_

- [ ]* 11.2 Test new conversational flow end-to-end
  - Navigate to `/checkout` in browser
  - Verify empty cart redirects to menu
  - Add items to cart and return to checkout
  - Complete NAME step with valid name
  - Complete WHATSAPP step with valid phone (e.g., 71987654321)
  - Observe CONFIRM step auto-advance after 1.5s
  - Review order in REVIEW step
  - Click "Ir para Pagamento" and verify navigation
  - Verify payment page loads correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.6_

- [ ]* 11.3 Test validation and error handling
  - Test NAME step with empty input → verify error message
  - Test NAME step with 1 character → verify error message
  - Test WHATSAPP step with empty input → verify error message
  - Test WHATSAPP step with 10 digits → verify error message
  - Test WHATSAPP step with 12 digits → verify error message
  - Test WHATSAPP step with invalid DDD (e.g., 00, 10) → verify error message
  - Verify "Continuar" buttons are disabled when validation fails
  - Verify error messages are displayed in red color
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 11.4 Test animation smoothness
  - Complete full checkout flow and observe all transitions
  - Verify fade/slide animations between NAME → WHATSAPP
  - Verify fade/slide animations between WHATSAPP → CONFIRM
  - Verify fade animation on CONFIRM step
  - Verify fade/slide animations between CONFIRM → REVIEW
  - Ensure animations are smooth (no jank) and complete in ~300ms
  - Test on both desktop and mobile viewports
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 11.5 Verify database customer record creation
  - Open Supabase Studio and navigate to `customers` table
  - Complete checkout flow with phone number (e.g., 71987654321)
  - Verify new record is created with:
    - `whatsapp` field in E.164 format (+5571987654321)
    - `name` field matches entered name
    - `last_order_date` is set to current timestamp
  - Note the customer record ID for next test
  - _Requirements: 4.2, 4.3_

- [ ]* 11.6 Test customer upsert (update existing record)
  - Complete checkout flow again with same phone number but different name
  - Check `customers` table in Supabase Studio
  - Verify the existing record is updated (same ID as before)
  - Verify `name` field is updated to new name
  - Verify `last_order_date` is updated to new timestamp
  - Verify no duplicate records were created
  - _Requirements: 4.2, 4.3_

---

## Notes

- All tasks should be completed in order within each phase
- Each task should be tested before moving to the next
- The legacy checkout at `/checkout2` must remain functional throughout development
- Database changes are non-destructive (upserts only)
- Payment component integration (Task 10) may require adjustments based on current implementation
- All testing tasks (Phase 4) are marked as optional (*) to focus on core implementation first
