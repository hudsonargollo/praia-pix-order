# Implementation Plan

- [x] 1. Setup and preparation
  - Create git checkpoint before starting any work
  - Document current state (file counts, bundle size, routes)
  - Create validation script for continuous testing
  - _Requirements: All requirements_

- [x] 2. Create archive directory structure
  - Create _archive/ directory at repository root
  - Create _archive/dev_notes/ subdirectory
  - Create _archive/sql_fixes/ subdirectory
  - Create _archive/test_scripts/ subdirectory
  - Git commit archive structure
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Archive historical markdown files
  - [x] 3.1 Identify all .md files in root directory (exclude README.md, CONTRIBUTING.md)
    - Scan root directory for .md files
    - Filter out essential documentation files
    - Verify no .md file is imported by source code
    - _Requirements: 1.2_
  
  - [x] 3.2 Move markdown files to _archive/dev_notes/ in batches
    - Move files in batches of 50
    - After each batch: run TypeScript compiler, run Vite build, test dev server
    - Git commit each successful batch
    - If any validation fails, rollback batch and stop
    - _Requirements: 1.2, 7.1, 7.2_
  
  - [x] 3.3 Create _archive/dev_notes/README.md documenting archived files
    - List all archived markdown files with brief descriptions
    - Categorize by topic (planning, fixes, deployment, testing)
    - Document archival date and reason
    - _Requirements: 8.1, 8.2, 8.5_

- [x] 4. Archive historical SQL files
  - [x] 4.1 Identify all .sql files in root directory (exclude supabase/migrations/)
    - Scan root directory for .sql files
    - Verify no .sql file is referenced by source code
    - Identify which files contain essential schema changes
    - _Requirements: 1.2, 5.1, 5.2_
  
  - [x] 4.2 Move SQL files to _archive/sql_fixes/ in batches
    - Move files in batches of 50
    - After each batch: run TypeScript compiler, run Vite build, test dev server
    - Git commit each successful batch
    - If any validation fails, rollback batch and stop
    - _Requirements: 1.2, 7.1, 7.2_
  
  - [x] 4.3 Create _archive/sql_fixes/README.md documenting archived files
    - List all archived SQL files with descriptions
    - Mark which files contain essential schema changes
    - Mark which files are historical/obsolete
    - Document archival date and reason
    - _Requirements: 5.5, 8.1, 8.4_

- [x] 5. Archive shell scripts and test files
  - [x] 5.1 Identify all .sh and root-level .ts test files
    - Scan root directory for .sh files
    - Scan root directory for .ts files (exclude essential configs)
    - Verify no file is imported by source code
    - _Requirements: 1.2_
  
  - [x] 5.2 Move shell scripts to _archive/test_scripts/
    - Move all .sh files
    - Move root-level test .ts files
    - After moving: run TypeScript compiler, run Vite build, test dev server
    - Git commit successful move
    - If any validation fails, rollback and stop
    - _Requirements: 1.2, 7.1, 7.2_
  
  - [x] 5.3 Create _archive/test_scripts/README.md
    - List all archived scripts with descriptions
    - Document archival date and reason
    - _Requirements: 8.1, 8.2_

- [x] 6. Verify archive phase completion
  - Count files in root directory (should be ≤20 excluding _archive/)
  - Run full validation: TypeScript compile, Vite build, dev server start
  - Manually test all critical user flows
  - Git commit archive phase completion
  - Create git tag "archive-complete"
  - _Requirements: 1.6, 7.1, 7.2, 7.3_

- [x] 7. Create role-based page directories
  - Create src/pages/customer/ directory
  - Create src/pages/admin/ directory
  - Create src/pages/staff/ directory
  - Create src/pages/waiter/ directory
  - Create src/pages/public/ directory
  - Create src/pages/debug/ directory
  - Git commit directory structure
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.11_

- [x] 8. Migrate customer pages
  - [x] 8.1 Copy customer pages to new location
    - Copy (don't move yet) Menu.tsx to src/pages/customer/
    - Copy Checkout.tsx to src/pages/customer/
    - Copy Payment.tsx to src/pages/customer/
    - Copy OrderStatus.tsx to src/pages/customer/
    - Copy Welcome.tsx to src/pages/customer/
    - Copy QRLanding.tsx to src/pages/customer/
    - _Requirements: 2.6_
  
  - [x] 8.2 Update imports in App.tsx for customer pages
    - Change Menu import to './pages/customer/Menu'
    - Change Checkout import to './pages/customer/Checkout'
    - Change Payment import to './pages/customer/Payment'
    - Change OrderStatus import to './pages/customer/OrderStatus'
    - Change Welcome import to './pages/customer/Welcome'
    - Change QRLanding import to './pages/customer/QRLanding'
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 3.1, 3.4_
  
  - [x] 8.3 Delete original customer page files
    - Delete src/pages/Menu.tsx
    - Delete src/pages/Checkout.tsx
    - Delete src/pages/Payment.tsx
    - Delete src/pages/OrderStatus.tsx
    - Delete src/pages/Welcome.tsx
    - Delete src/pages/QRLanding.tsx
    - Run TypeScript compiler - must pass
    - _Requirements: 2.6, 3.4_
  
  - [x] 8.4 Test customer routes
    - Start dev server
    - Navigate to /menu - verify page loads
    - Navigate to /checkout - verify page loads
    - Navigate to /payment/:orderId - verify page loads
    - Navigate to /order-status/:orderId - verify page loads
    - Navigate to / - verify page loads
    - Navigate to /qr - verify page loads
    - Check browser console for errors
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 8.5 Git commit customer page migration
    - Commit with message "Migrate customer pages to role-based structure"
    - _Requirements: 7.1_

- [-] 9. Migrate admin pages
  - [x] 9.1 Copy admin pages to new location
    - Copy Admin.tsx to src/pages/admin/
    - Copy AdminProducts.tsx to src/pages/admin/
    - Copy AdminWaiters.tsx to src/pages/admin/
    - Copy AdminWaiterReportsPage.tsx to src/pages/admin/
    - Copy Reports.tsx to src/pages/admin/
    - Copy WhatsAppAdmin.tsx to src/pages/admin/
    - _Requirements: 2.7_
  
  - [x] 9.2 Update imports in App.tsx for admin pages
    - Change Admin import to './pages/admin/Admin'
    - Change AdminProducts import to './pages/admin/AdminProducts'
    - Change AdminWaiters import to './pages/admin/AdminWaiters'
    - Change AdminWaiterReportsPage import to './pages/admin/AdminWaiterReportsPage'
    - Change Reports import to './pages/admin/Reports'
    - Change WhatsAppAdmin import to './pages/admin/WhatsAppAdmin'
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 3.1, 3.4_
  
  - [x] 9.3 Delete original admin page files
    - Delete src/pages/Admin.tsx
    - Delete src/pages/AdminProducts.tsx
    - Delete src/pages/AdminWaiters.tsx
    - Delete src/pages/AdminWaiterReportsPage.tsx
    - Delete src/pages/Reports.tsx
    - Delete src/pages/WhatsAppAdmin.tsx
    - Run TypeScript compiler - must pass
    - _Requirements: 2.7, 3.4_
  
  - [x] 9.4 Test admin routes
    - Start dev server
    - Navigate to /admin - verify page loads
    - Navigate to /admin/products - verify page loads
    - Navigate to /admin/waiters - verify page loads
    - Navigate to /admin/waiter-reports - verify page loads
    - Navigate to /reports - verify page loads
    - Navigate to /whatsapp-admin - verify page loads
    - Check browser console for errors
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [-] 9.5 Git commit admin page migration
    - Commit with message "Migrate admin pages to role-based structure"
    - _Requirements: 7.1_

- [ ] 10. Migrate staff pages
  - [ ] 10.1 Copy staff pages to new location
    - Copy Kitchen.tsx to src/pages/staff/ (note: Kitchen.tsx may not exist, check first)
    - Copy Cashier.tsx to src/pages/staff/
    - Copy UnifiedCashier.tsx to src/pages/staff/
    - _Requirements: 2.8_
  
  - [ ] 10.2 Update imports in App.tsx for staff pages
    - Change Cashier import to './pages/staff/Cashier'
    - Change UnifiedCashier import to './pages/staff/UnifiedCashier' (if exists)
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 3.1, 3.4_
  
  - [ ] 10.3 Delete original staff page files
    - Delete src/pages/Cashier.tsx
    - Delete src/pages/UnifiedCashier.tsx (if exists)
    - Run TypeScript compiler - must pass
    - _Requirements: 2.8, 3.4_
  
  - [ ] 10.4 Test staff routes
    - Start dev server
    - Navigate to /kitchen - verify page loads
    - Navigate to /cashier - verify page loads
    - Check browser console for errors
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 10.5 Git commit staff page migration
    - Commit with message "Migrate staff pages to role-based structure"
    - _Requirements: 7.1_

- [ ] 11. Migrate waiter pages
  - [ ] 11.1 Copy waiter pages to new location
    - Copy Waiter.tsx to src/pages/waiter/
    - Copy WaiterDashboard.tsx to src/pages/waiter/
    - Copy WaiterManagement.tsx to src/pages/waiter/
    - Copy WaiterDiagnostic.tsx to src/pages/waiter/
    - _Requirements: 2.9_
  
  - [ ] 11.2 Update imports in App.tsx for waiter pages
    - Change Waiter import to './pages/waiter/Waiter'
    - Change WaiterDashboard import to './pages/waiter/WaiterDashboard'
    - Change WaiterManagement import to './pages/waiter/WaiterManagement'
    - Change WaiterDiagnostic import to './pages/waiter/WaiterDiagnostic'
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 3.1, 3.4_
  
  - [ ] 11.3 Delete original waiter page files
    - Delete src/pages/Waiter.tsx
    - Delete src/pages/WaiterDashboard.tsx
    - Delete src/pages/WaiterManagement.tsx
    - Delete src/pages/WaiterDiagnostic.tsx
    - Run TypeScript compiler - must pass
    - _Requirements: 2.9, 3.4_
  
  - [ ] 11.4 Test waiter routes
    - Start dev server
    - Navigate to /waiter - verify page loads
    - Navigate to /waiter-dashboard - verify page loads
    - Navigate to /waiter-management - verify page loads
    - Navigate to /waiter-diagnostic - verify page loads
    - Check browser console for errors
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 11.5 Git commit waiter page migration
    - Commit with message "Migrate waiter pages to role-based structure"
    - _Requirements: 7.1_

- [ ] 12. Migrate public pages
  - [ ] 12.1 Copy public pages to new location
    - Copy Index.tsx to src/pages/public/
    - Copy Auth.tsx to src/pages/public/
    - Copy NotFound.tsx to src/pages/public/
    - _Requirements: 2.10_
  
  - [ ] 12.2 Update imports in App.tsx for public pages
    - Change Index import to './pages/public/Index'
    - Change Auth import to './pages/public/Auth'
    - Change NotFound import to './pages/public/NotFound'
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 3.1, 3.4_
  
  - [ ] 12.3 Delete original public page files
    - Delete src/pages/Index.tsx
    - Delete src/pages/Auth.tsx
    - Delete src/pages/NotFound.tsx
    - Run TypeScript compiler - must pass
    - _Requirements: 2.10, 3.4_
  
  - [ ] 12.4 Test public routes
    - Start dev server
    - Navigate to / - verify page loads
    - Navigate to /auth - verify page loads
    - Navigate to /nonexistent - verify NotFound page loads
    - Check browser console for errors
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 12.5 Git commit public page migration
    - Commit with message "Migrate public pages to role-based structure"
    - _Requirements: 7.1_

- [ ] 13. Migrate debug pages
  - [ ] 13.1 Copy debug pages to new location
    - Copy MenuDebug.tsx to src/pages/debug/
    - Copy PaymentDebug.tsx to src/pages/debug/
    - Copy PaymentTest.tsx to src/pages/debug/
    - Copy SystemDiagnostic.tsx to src/pages/debug/
    - Copy Monitoring.tsx to src/pages/debug/
    - Copy OrderLookup.tsx to src/pages/debug/
    - Copy QRRedirect.tsx to src/pages/debug/
    - _Requirements: 2.11_
  
  - [ ] 13.2 Update imports in App.tsx for debug pages
    - Change MenuDebug import to './pages/debug/MenuDebug'
    - Change PaymentDebug import to './pages/debug/PaymentDebug'
    - Change PaymentTest import to './pages/debug/PaymentTest'
    - Change SystemDiagnostic import to './pages/debug/SystemDiagnostic'
    - Change Monitoring import to './pages/debug/Monitoring'
    - Change OrderLookup import to './pages/debug/OrderLookup'
    - Change QRRedirect import to './pages/debug/QRRedirect'
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 3.1, 3.4_
  
  - [ ] 13.3 Delete original debug page files
    - Delete src/pages/MenuDebug.tsx
    - Delete src/pages/PaymentDebug.tsx
    - Delete src/pages/PaymentTest.tsx
    - Delete src/pages/SystemDiagnostic.tsx
    - Delete src/pages/Monitoring.tsx
    - Delete src/pages/OrderLookup.tsx
    - Delete src/pages/QRRedirect.tsx
    - Run TypeScript compiler - must pass
    - _Requirements: 2.11, 3.4_
  
  - [ ] 13.4 Test debug routes
    - Start dev server
    - Navigate to /menu-debug - verify page loads
    - Navigate to /payment-debug - verify page loads
    - Navigate to /payment-test - verify page loads
    - Navigate to /diagnostic - verify page loads
    - Navigate to /monitoring - verify page loads
    - Navigate to /order-lookup - verify page loads
    - Navigate to /:tableId - verify QRRedirect works
    - Check browser console for errors
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 13.5 Git commit debug page migration
    - Commit with message "Migrate debug pages to role-based structure"
    - _Requirements: 7.1_

- [ ] 14. Verify page migration completion
  - Verify src/pages/ root only contains role directories and __tests__/
  - Run full validation: TypeScript compile, Vite build, dev server start
  - Manually test all critical user flows (customer, kitchen, cashier, admin, waiter)
  - Git commit page migration completion
  - Create git tag "pages-migrated"
  - _Requirements: 2.1-2.11, 3.1-3.5, 7.1-7.3_

- [ ] 15. Create LoadingFallback component
  - Create src/components/LoadingFallback.tsx with Portuguese loading message
  - Style component to match application design (purple theme)
  - Test component renders correctly
  - Git commit LoadingFallback component
  - _Requirements: 4.3_

- [ ] 16. Implement lazy loading for customer pages
  - [ ] 16.1 Convert customer page imports to lazy loading
    - Import React.lazy and Suspense in App.tsx
    - Change Menu import to lazy(() => import('./pages/customer/Menu'))
    - Change Checkout import to lazy(() => import('./pages/customer/Checkout'))
    - Change Payment import to lazy(() => import('./pages/customer/Payment'))
    - Change OrderStatus import to lazy(() => import('./pages/customer/OrderStatus'))
    - Change Welcome import to lazy(() => import('./pages/customer/Welcome'))
    - Change QRLanding import to lazy(() => import('./pages/customer/QRLanding'))
    - _Requirements: 4.1_
  
  - [ ] 16.2 Wrap customer routes with Suspense
    - Wrap /menu route with Suspense and LoadingFallback
    - Wrap /checkout route with Suspense and LoadingFallback
    - Wrap /payment/:orderId route with Suspense and LoadingFallback
    - Wrap /order-status/:orderId route with Suspense and LoadingFallback
    - Wrap / route with Suspense and LoadingFallback
    - Wrap /qr route with Suspense and LoadingFallback
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 4.2_
  
  - [ ] 16.3 Test customer routes with lazy loading
    - Start dev server
    - Navigate to each customer route
    - Verify loading state appears briefly
    - Verify page loads correctly after loading
    - Check network tab for chunk loading
    - Verify no console errors
    - _Requirements: 4.5, 7.1, 7.2, 7.3_
  
  - [ ] 16.4 Git commit customer lazy loading
    - Commit with message "Implement lazy loading for customer pages"
    - _Requirements: 4.1, 4.2_

- [ ] 17. Implement lazy loading for admin pages
  - [ ] 17.1 Convert admin page imports to lazy loading
    - Change Admin import to lazy(() => import('./pages/admin/Admin'))
    - Change AdminProducts import to lazy(() => import('./pages/admin/AdminProducts'))
    - Change AdminWaiters import to lazy(() => import('./pages/admin/AdminWaiters'))
    - Change AdminWaiterReportsPage import to lazy(() => import('./pages/admin/AdminWaiterReportsPage'))
    - Change Reports import to lazy(() => import('./pages/admin/Reports'))
    - Change WhatsAppAdmin import to lazy(() => import('./pages/admin/WhatsAppAdmin'))
    - _Requirements: 4.1_
  
  - [ ] 17.2 Wrap admin routes with Suspense
    - Wrap all admin routes with Suspense and LoadingFallback
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 4.2_
  
  - [ ] 17.3 Test admin routes with lazy loading
    - Start dev server
    - Navigate to each admin route
    - Verify loading state appears briefly
    - Verify page loads correctly after loading
    - Check network tab for chunk loading
    - Verify no console errors
    - _Requirements: 4.5, 7.1, 7.2, 7.3_
  
  - [ ] 17.4 Git commit admin lazy loading
    - Commit with message "Implement lazy loading for admin pages"
    - _Requirements: 4.1, 4.2_

- [ ] 18. Implement lazy loading for staff pages
  - [ ] 18.1 Convert staff page imports to lazy loading
    - Change Cashier import to lazy(() => import('./pages/staff/Cashier'))
    - Change UnifiedCashier import to lazy(() => import('./pages/staff/UnifiedCashier')) (if exists)
    - _Requirements: 4.1_
  
  - [ ] 18.2 Wrap staff routes with Suspense
    - Wrap all staff routes with Suspense and LoadingFallback
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 4.2_
  
  - [ ] 18.3 Test staff routes with lazy loading
    - Start dev server
    - Navigate to each staff route
    - Verify loading state appears briefly
    - Verify page loads correctly after loading
    - Check network tab for chunk loading
    - Verify no console errors
    - _Requirements: 4.5, 7.1, 7.2, 7.3_
  
  - [ ] 18.4 Git commit staff lazy loading
    - Commit with message "Implement lazy loading for staff pages"
    - _Requirements: 4.1, 4.2_

- [ ] 19. Implement lazy loading for waiter pages
  - [ ] 19.1 Convert waiter page imports to lazy loading
    - Change Waiter import to lazy(() => import('./pages/waiter/Waiter'))
    - Change WaiterDashboard import to lazy(() => import('./pages/waiter/WaiterDashboard'))
    - Change WaiterManagement import to lazy(() => import('./pages/waiter/WaiterManagement'))
    - Change WaiterDiagnostic import to lazy(() => import('./pages/waiter/WaiterDiagnostic'))
    - _Requirements: 4.1_
  
  - [ ] 19.2 Wrap waiter routes with Suspense
    - Wrap all waiter routes with Suspense and LoadingFallback
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 4.2_
  
  - [ ] 19.3 Test waiter routes with lazy loading
    - Start dev server
    - Navigate to each waiter route
    - Verify loading state appears briefly
    - Verify page loads correctly after loading
    - Check network tab for chunk loading
    - Verify no console errors
    - _Requirements: 4.5, 7.1, 7.2, 7.3_
  
  - [ ] 19.4 Git commit waiter lazy loading
    - Commit with message "Implement lazy loading for waiter pages"
    - _Requirements: 4.1, 4.2_

- [ ] 20. Implement lazy loading for public and debug pages
  - [ ] 20.1 Convert public and debug page imports to lazy loading
    - Change Index import to lazy(() => import('./pages/public/Index'))
    - Change Auth import to lazy(() => import('./pages/public/Auth'))
    - Change NotFound import to lazy(() => import('./pages/public/NotFound'))
    - Change all debug page imports to lazy loading
    - _Requirements: 4.1_
  
  - [ ] 20.2 Wrap public and debug routes with Suspense
    - Wrap all public routes with Suspense and LoadingFallback
    - Wrap all debug routes with Suspense and LoadingFallback
    - Run TypeScript compiler - must pass
    - Run Vite build - must succeed
    - _Requirements: 4.2_
  
  - [ ] 20.3 Test public and debug routes with lazy loading
    - Start dev server
    - Navigate to each public and debug route
    - Verify loading state appears briefly
    - Verify page loads correctly after loading
    - Check network tab for chunk loading
    - Verify no console errors
    - _Requirements: 4.5, 7.1, 7.2, 7.3_
  
  - [ ] 20.4 Git commit public and debug lazy loading
    - Commit with message "Implement lazy loading for public and debug pages"
    - _Requirements: 4.1, 4.2_

- [ ] 21. Measure performance improvements
  - Build production bundle with npm run build
  - Measure initial bundle size
  - Count number of lazy-loaded chunks
  - Measure size of each chunk
  - Compare with baseline measurements from task 1
  - Verify ≥30% reduction in initial bundle size
  - Document performance improvements
  - _Requirements: 4.4_

- [ ] 22. Review and consolidate SQL migrations
  - [ ] 22.1 Review archived SQL files
    - Read all .sql files in _archive/sql_fixes/
    - Identify files that contain essential schema changes
    - Identify files that are historical/obsolete
    - Document findings in _archive/sql_fixes/README.md
    - _Requirements: 5.1, 5.2_
  
  - [ ] 22.2 Create new migration files for essential changes
    - For each essential schema change not in supabase/migrations/
    - Create new timestamped migration file (YYYYMMDDHHMMSS_description.sql)
    - Copy essential SQL from archived file
    - Clean up and format SQL
    - _Requirements: 5.3, 5.4_
  
  - [ ] 22.3 Test new migrations on local database
    - Run npx supabase db reset
    - Verify all migrations apply successfully
    - Verify database schema is correct
    - _Requirements: 5.3_
  
  - [ ] 22.4 Git commit new migrations
    - Commit with message "Consolidate essential SQL migrations"
    - _Requirements: 5.3_

- [ ] 23. Update README.md
  - [ ] 23.1 Add project overview section
    - Include product description from .kiro/steering/product.md
    - Describe core features and user flows
    - _Requirements: 6.1_
  
  - [ ] 23.2 Add technology stack section
    - List all major technologies (React, Vite, TypeScript, Supabase, Tailwind)
    - Include information from .kiro/steering/tech.md
    - _Requirements: 6.6_
  
  - [ ] 23.3 Add project structure section
    - Document new role-based page organization
    - Explain directory structure (customer/, admin/, staff/, waiter/, public/, debug/)
    - Document _archive/ directory purpose
    - _Requirements: 6.2_
  
  - [ ] 23.4 Add getting started section
    - Document prerequisites (Node.js, npm, Supabase CLI)
    - Provide step-by-step setup instructions
    - Include npm install command
    - Include npx supabase start command
    - Include npm run dev command
    - Document environment variables required
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [ ] 23.5 Add development section
    - Document common commands (dev, build, lint, test)
    - Explain development workflow
    - _Requirements: 6.7_
  
  - [ ] 23.6 Git commit README.md updates
    - Commit with message "Update README.md with comprehensive documentation"
    - _Requirements: 6.1-6.7_

- [ ] 24. Create CONTRIBUTING.md
  - Document code organization guidelines
  - Explain where to place new files (which role directory)
  - Document naming conventions
  - Explain git workflow and commit message format
  - Document testing requirements
  - Git commit CONTRIBUTING.md
  - _Requirements: 6.8_

- [ ] 25. Create _archive/README.md
  - Explain purpose of _archive/ directory
  - Document structure (dev_notes/, sql_fixes/, test_scripts/)
  - Document archival date
  - Provide guidance on when to reference archived files
  - Git commit _archive/README.md
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 26. Final validation and testing
  - [ ] 26.1 Run full validation suite
    - Run npx tsc --noEmit - must pass
    - Run npm run lint - must pass
    - Run npm run build - must succeed
    - Run npm run dev - must start without errors
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 26.2 Test all user flows end-to-end
    - Test customer flow: QR scan → Menu → Checkout → Payment → Order Status
    - Test kitchen flow: Login → View orders → Update status
    - Test cashier flow: Login → Monitor orders → Send notifications
    - Test admin flow: Login → Products → Waiters → Reports
    - Test waiter flow: Login → Place order → View dashboard
    - Verify no regressions in functionality
    - _Requirements: 7.4, 7.5_
  
  - [ ] 26.3 Verify success criteria
    - Root directory contains ≤20 files/directories (excluding _archive/)
    - All 28 pages successfully migrated to role-based directories
    - Zero broken imports
    - TypeScript compiles without errors
    - Initial bundle size reduced by ≥30%
    - Lazy loading implemented for all routes
    - All tests pass (if tests exist)
    - _Requirements: All requirements_
  
  - [ ] 26.4 Create final git commit and tag
    - Commit with message "Complete repository organization refactor"
    - Create git tag "refactor-complete-v1.0"
    - _Requirements: 7.1_

- [ ] 27. Document completion
  - Create summary document with before/after metrics
  - Document bundle size improvements
  - Document file count reduction
  - List all git commits and tags created
  - Note any issues encountered and how they were resolved
  - _Requirements: All requirements_
