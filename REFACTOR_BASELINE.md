# Repository Reorganization - Baseline Metrics

**Date:** November 12, 2025  
**Git Checkpoint:** `pre-refactor-checkpoint` (commit: 300265b)

## Current State Summary

This document captures the baseline state of the repository before the reorganization refactor begins.

## File Count Metrics

### Root Directory Files
- **Total files in root:** 289 files
- **Markdown files (.md):** 161 files
- **SQL files (.sql):** 85 files
- **Shell scripts (.sh):** 4 files
- **TypeScript files (.ts):** 21 files

### Pages Directory
- **Total page components:** 29 files in `src/pages/`

#### Page List:
1. Admin.tsx
2. AdminProducts.tsx
3. AdminWaiterReportsPage.tsx
4. AdminWaiters.tsx
5. Auth.tsx
6. Cashier.tsx
7. Checkout.tsx
8. Index.tsx
9. Kitchen.tsx
10. Menu.tsx
11. MenuDebug.tsx
12. Monitoring.tsx
13. NotFound.tsx
14. OrderLookup.tsx
15. OrderStatus.tsx
16. Payment.tsx
17. PaymentDebug.tsx
18. PaymentTest.tsx
19. QRLanding.tsx
20. QRRedirect.tsx
21. Reports.tsx
22. SystemDiagnostic.tsx
23. UnifiedCashier.tsx
24. Waiter.tsx
25. WaiterDashboard.tsx
26. WaiterDiagnostic.tsx
27. WaiterManagement.tsx
28. Welcome.tsx
29. WhatsAppAdmin.tsx

## Bundle Size Metrics (Production Build)

### Initial Bundle (Before Code Splitting)
- **Main JavaScript bundle:** 1,000.30 kB (minified) / 276.92 kB (gzip)
- **CSS bundle:** 104.28 kB (minified) / 16.65 kB (gzip)
- **HTML:** 1.31 kB / 0.59 kB (gzip)
- **Assets:** 53.16 kB (logo)

### Build Performance
- **Build time:** 3.11 seconds
- **Modules transformed:** 2,780 modules
- **Code splitting:** None (single bundle)
- **Warning:** Bundle exceeds 500 kB - code splitting recommended

## Target Metrics (Goals)

### File Organization
- **Root directory files:** ≤20 files/directories (excluding _archive/)
- **Pages organization:** Role-based directories (customer/, admin/, staff/, waiter/, public/, debug/)
- **Archived files:** All historical .md, .sql, .sh files moved to _archive/

### Performance Improvements
- **Initial bundle size reduction:** ≥30% (target: ≤700 kB minified)
- **Code splitting:** 6+ separate chunks for different roles
- **Lazy loading:** Implemented for all routes
- **Time to interactive:** ≥20% improvement

## Routes Inventory

Based on the page files, the application has the following routes:

### Customer Routes
- `/` - Index/Landing
- `/menu` - Menu browsing
- `/checkout` - Checkout process
- `/payment/:orderId` - Payment page
- `/order-status/:orderId` - Order status tracking
- `/qr` - QR landing page
- `/:tableId` - QR redirect

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/products` - Product management
- `/admin/waiters` - Waiter management
- `/admin/waiter-reports` - Waiter reports
- `/reports` - Reports page
- `/whatsapp-admin` - WhatsApp administration

### Staff Routes
- `/kitchen` - Kitchen dashboard
- `/cashier` - Cashier panel
- `/unified-cashier` - Unified cashier view (alternative)

### Waiter Routes
- `/waiter` - Waiter interface
- `/waiter-dashboard` - Waiter dashboard
- `/waiter-management` - Waiter management
- `/waiter-diagnostic` - Waiter diagnostic tools

### Public Routes
- `/auth` - Authentication page
- `*` - Not found (404)

### Debug Routes
- `/menu-debug` - Menu debugging
- `/payment-debug` - Payment debugging
- `/payment-test` - Payment testing
- `/diagnostic` - System diagnostic
- `/monitoring` - System monitoring
- `/order-lookup` - Order lookup tool

## Success Criteria Checklist

- [ ] Root directory contains ≤20 files/directories (excluding _archive/)
- [ ] All 29 pages migrated to role-based directories
- [ ] Zero broken imports
- [ ] TypeScript compiles without errors
- [ ] Initial bundle size reduced by ≥30%
- [ ] Lazy loading implemented for all routes
- [ ] 6+ separate code chunks created
- [ ] All user flows tested and working
- [ ] Documentation updated (README.md, CONTRIBUTING.md)
- [ ] Archive directories documented

## Notes

- Current bundle size (1,000.30 kB) significantly exceeds recommended 500 kB limit
- No code splitting currently implemented - all pages loaded in initial bundle
- Root directory is cluttered with 289 files, making navigation difficult
- Flat page structure makes it hard to distinguish between user roles
- Historical development files (161 .md files, 85 .sql files) need archiving
