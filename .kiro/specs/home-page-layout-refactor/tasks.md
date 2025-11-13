# Implementation Plan

- [x] 1. Set up carousel dependencies and imports
  - Verify embla-carousel-react is installed in package.json
  - Add embla-carousel-react and embla-carousel-autoplay imports to Index.tsx
  - Import necessary React hooks (useState, useEffect, useCallback)
  - _Requirements: 3.1, 4.1_

- [x] 2. Refactor Quick Access section to 2x2 grid layout
  - Remove the "Acesso Rápido" h2 heading element
  - Change grid container from `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` to `grid-cols-2`
  - Update max-width from `max-w-5xl` to `max-w-3xl` for better mobile layout
  - Adjust gap spacing to `gap-4 sm:gap-6` for consistent spacing
  - Verify all four buttons maintain their existing colors, icons, labels, and navigation targets
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. Create carousel structure for "Como Funciona" section
  - Initialize embla carousel with useEmblaCarousel hook
  - Configure carousel options: `{ loop: true, align: 'center' }`
  - Set up Autoplay plugin with `{ delay: 5000, stopOnInteraction: true }`
  - Create carousel viewport container with emblaRef
  - Wrap three role cards (Cliente, Garçom, Gerente) in carousel slide containers
  - Add proper flex classes to carousel container and slides
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [x] 4. Implement carousel state management
  - Create state for selectedIndex using useState
  - Create state for scrollSnaps using useState
  - Implement useEffect to update selectedIndex when carousel scrolls
  - Implement useEffect to initialize scrollSnaps on carousel mount
  - Create scrollTo callback function using useCallback for pagination navigation
  - _Requirements: 5.3, 5.4_

- [x] 5. Add pagination dots component
  - Create inline DotButton component with selected and onClick props
  - Render pagination dots below carousel based on scrollSnaps length
  - Style active dot with expanded width (w-8) and purple-900 background
  - Style inactive dots with circular shape (w-3 h-3) and purple-300 background
  - Add smooth transitions for dot state changes
  - Connect dots to scrollTo callback for navigation
  - Add aria-label for accessibility
  - Ensure minimum 44x44px touch target with padding
  - _Requirements: 5.2, 5.3, 5.4, 6.1, 7.4_

- [x] 6. Implement auto-play pause and resume logic
  - Create useEffect to handle user interaction events
  - Implement pause logic when user swipes or clicks pagination dots
  - Create 10-second timer to resume auto-play after interaction
  - Clean up timer on component unmount
  - Test that auto-play stops on pointerDown event
  - Test that auto-play resumes after 10 seconds of inactivity
  - _Requirements: 4.3, 4.4_

- [x] 7. Add keyboard navigation support
  - Create handleKeyDown function to capture arrow key events
  - Implement scrollPrev on ArrowLeft key press
  - Implement scrollNext on ArrowRight key press
  - Add onKeyDown handler to carousel container
  - Add tabIndex={0} to make carousel focusable
  - Add role="region" and aria-label="Como Funciona carousel" for accessibility
  - _Requirements: 7.5_

- [x] 8. Implement initial animation hint
  - Create useEffect that triggers after 2 seconds on component mount
  - Call emblaApi.scrollNext() to advance to second slide
  - This demonstrates to users that the carousel auto-slides
  - Clean up timer on component unmount
  - _Requirements: 6.2_

- [x] 9. Add peek effect for next card visibility
  - Add horizontal padding to carousel slides (px-4 on mobile, px-6 on desktop)
  - Adjust slide flex basis to account for padding
  - Ensure partial visibility of next card hints at swipeable content
  - Test that peek effect works on various screen sizes
  - _Requirements: 6.3_

- [x] 10. Verify responsive behavior and spacing
  - Test grid layout at 320px, 640px, and 1024px widths
  - Verify carousel displays correctly on mobile and desktop
  - Ensure no horizontal scrolling occurs
  - Check that spacing between grid cards is consistent
  - Verify carousel cards maintain proper padding and borders
  - Test on actual mobile devices (iOS and Android)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 11. Accessibility and visual polish
  - Verify all text remains in Portuguese (BR)
  - Check color contrast ratios meet WCAG AA standards
  - Test keyboard navigation with Tab and Arrow keys
  - Verify focus indicators are visible on all interactive elements
  - Test with screen reader to ensure proper announcements
  - Verify touch targets are at least 44x44px
  - Ensure hover effects work correctly on grid buttons
  - Test carousel transitions are smooth (300ms ease-in-out)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Cross-browser and device testing
  - Test on Chrome mobile and desktop
  - Test on Safari iOS and macOS
  - Test on Firefox desktop
  - Test on Edge desktop
  - Verify swipe gestures work on touch devices
  - Verify auto-play works consistently across browsers
  - Check that all navigation targets work correctly
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
