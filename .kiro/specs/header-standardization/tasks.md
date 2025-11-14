# Implementation Plan - Header Standardization

- [x] 1. Create shared AppHeader component
  - Create `src/components/AppHeader.tsx` file
  - Define HeaderProps and HeaderAction interfaces
  - Implement desktop layout with logo, actions, connection status, logout
  - Implement mobile layout with stacked elements
  - Add responsive breakpoints (mobile < 768px, desktop > 1024px)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2_

- [x] 2. Create ConnectionStatusBadge component
  - Create `src/components/ConnectionStatusBadge.tsx` file
  - Implement connected state (green badge with WiFi icon)
  - Implement connecting state (yellow badge with pulsing WiFi icon)
  - Implement disconnected state (red badge with WiFi-off icon and reconnect button)
  - Add compact mode for mobile
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Add default action buttons to AppHeader
  - Implement Reports button with BarChart3 icon
  - Implement Products button with Package icon
  - Implement WhatsApp button with Bell icon
  - Add navigation handlers for each button
  - Make buttons responsive (icon + label on desktop, icon only on mobile)
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4. Add logout functionality to AppHeader
  - Implement logout button with LogOut icon
  - Add handleLogout function with Supabase signOut
  - Navigate to /auth after logout
  - Show success toast notification
  - Make button visible on all screen sizes
  - _Requirements: 2.4, 2.5_

- [x] 5. Update Gestão de Garçons page
  - Replace legacy header with AppHeader component
  - Move "Gestão de Garçons" title to page content
  - Add refresh button as custom action
  - Add "Novo Garçom" button as custom action
  - Remove old header code and styles
  - Test responsive behavior
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Update Reports page
  - Replace legacy header with AppHeader component
  - Move "Relatórios" title to page content
  - Remove "Voltar ao Caixa" button (use standard navigation)
  - Remove old header code and styles
  - Test responsive behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 7. Update AdminProducts page
  - Replace legacy header with AppHeader component
  - Move "Gerenciar Produtos" title to page content
  - Add "Novo Produto" button as custom action
  - Remove old header code and styles
  - Test responsive behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 8. Review and update other admin pages
  - Check AdminWaiterReports page header
  - Check WhatsAppAdmin page header
  - Update any other pages with inconsistent headers
  - Ensure all pages use AppHeader component
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 9. Add connection status to relevant pages
  - Enable connection status on Cashier page (already has it)
  - Enable connection status on WaiterDashboard (already has it)
  - Disable connection status on admin pages (not needed)
  - Test connection status updates in real-time
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 10. Test responsive behavior across all pages
  - Test on mobile (< 768px)
  - Test on tablet (768px - 1024px)
  - Test on desktop (> 1024px)
  - Verify logo sizing
  - Verify button visibility and labels
  - Verify connection status display
  - _Requirements: 1.5, 2.3, 3.5_

- [ ]* 11. Cleanup and documentation
  - Remove old header code from all pages
  - Remove duplicate header styles
  - Document AppHeader component usage
  - Add JSDoc comments to component props
  - Create usage examples in documentation
  - _Requirements: 5.3, 5.4, 5.5_
