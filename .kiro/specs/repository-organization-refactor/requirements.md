# Requirements Document

## Introduction

This specification addresses the repository organization and maintainability issues in the Coco Loko Açaiteria codebase. Currently, the repository suffers from poor organization with 271 files cluttering the root directory (historical .md, .sql, and .sh files) and a flat src/pages structure containing 28+ page components for all user roles. This makes navigation difficult, obscures important configuration files, and hinders long-term maintainability. The goal is to establish a clean, professional repository structure with role-based page organization, archived historical files, and improved documentation.

## Glossary

- **Root_Directory**: The top-level directory of the repository containing configuration files and source code
- **Pages_Directory**: The src/pages folder containing all React page components
- **Archive_Directory**: A new _archive/ folder for storing historical development files
- **Role_Based_Structure**: Organization pattern grouping pages by user role (customer, admin, staff, waiter, public)
- **Code_Splitting**: React lazy loading technique to improve initial load performance
- **Migration_Files**: SQL files in supabase/migrations/ that define database schema changes
- **Historical_Files**: Development notes, test scripts, and one-off SQL fixes accumulated during development
- **Configuration_Files**: Essential project files like package.json, vite.config.ts, tsconfig.json
- **Project_Documentation**: README.md and related files explaining project setup and structure

## Requirements

### Requirement 1: Archive Historical Development Files

**User Story:** As a developer, I want the root directory to contain only essential project files, so that I can quickly locate configuration files and understand the project structure.

#### Acceptance Criteria

1. THE System SHALL create a new _archive/ directory at the repository root
2. THE System SHALL move all non-essential .md files from the root directory to _archive/dev_notes/
3. THE System SHALL move all non-essential .sql files from the root directory to _archive/sql_fixes/
4. THE System SHALL move all .sh script files from the root directory to _archive/test_scripts/
5. THE System SHALL preserve essential files in the root directory (README.md, package.json, vite.config.ts, tsconfig.json, tailwind.config.ts, .env files, .gitignore)
6. WHEN archiving is complete, THE Root_Directory SHALL contain fewer than 20 files and directories (excluding _archive/)

### Requirement 2: Organize Pages by User Role

**User Story:** As a developer, I want page components organized by user role, so that I can easily navigate to the relevant code for each user flow.

#### Acceptance Criteria

1. THE System SHALL create a src/pages/customer/ directory for customer-facing pages
2. THE System SHALL create a src/pages/admin/ directory for admin panel pages
3. THE System SHALL create a src/pages/staff/ directory for kitchen and cashier pages
4. THE System SHALL create a src/pages/waiter/ directory for waiter-specific pages
5. THE System SHALL create a src/pages/public/ directory for authentication and error pages
6. THE System SHALL move Menu.tsx, Checkout.tsx, Payment.tsx, OrderStatus.tsx, Welcome.tsx, and QRLanding.tsx to src/pages/customer/
7. THE System SHALL move Admin.tsx, AdminProducts.tsx, AdminWaiters.tsx, AdminWaiterReportsPage.tsx, Reports.tsx, and WhatsAppAdmin.tsx to src/pages/admin/
8. THE System SHALL move Kitchen.tsx, Cashier.tsx, and UnifiedCashier.tsx to src/pages/staff/
9. THE System SHALL move Waiter.tsx, WaiterDashboard.tsx, WaiterManagement.tsx, and WaiterDiagnostic.tsx to src/pages/waiter/
10. THE System SHALL move Auth.tsx, NotFound.tsx, and Index.tsx to src/pages/public/
11. THE System SHALL move debug and diagnostic pages (MenuDebug.tsx, PaymentDebug.tsx, PaymentTest.tsx, SystemDiagnostic.tsx, Monitoring.tsx, OrderLookup.tsx, QRRedirect.tsx) to src/pages/debug/

### Requirement 3: Update Import Paths

**User Story:** As a developer, I want all import statements to reflect the new file structure, so that the application continues to function correctly after reorganization.

#### Acceptance Criteria

1. THE System SHALL update all import statements in App.tsx to reference the new page locations
2. THE System SHALL update all relative imports between page components to use the new paths
3. THE System SHALL update any test files that import page components
4. WHEN all imports are updated, THE System SHALL compile without errors
5. THE System SHALL verify that all routes continue to function correctly

### Requirement 4: Implement Code Splitting

**User Story:** As a user, I want the application to load faster, so that I can start using it more quickly.

#### Acceptance Criteria

1. THE System SHALL implement React.lazy() for all page components in App.tsx
2. THE System SHALL wrap lazy-loaded routes with React Suspense
3. THE System SHALL provide a loading fallback component with Portuguese text ("Carregando...")
4. WHEN code splitting is implemented, THE System SHALL reduce the initial bundle size by at least 30%
5. THE System SHALL ensure all routes continue to function with lazy loading

### Requirement 5: Consolidate SQL Migrations

**User Story:** As a developer setting up the project, I want all essential database schema changes in the migrations folder, so that I can initialize the database correctly.

#### Acceptance Criteria

1. THE System SHALL review all .sql files moved to _archive/sql_fixes/
2. THE System SHALL identify any schema changes not present in supabase/migrations/
3. WHERE essential schema changes are found, THE System SHALL create new timestamped migration files
4. THE System SHALL ensure migration files follow the naming convention YYYYMMDDHHMMSS_description.sql
5. THE System SHALL document any manual SQL fixes that should not be migrated in _archive/sql_fixes/README.md

### Requirement 6: Update Project Documentation

**User Story:** As a new developer joining the project, I want clear documentation explaining the project structure and setup process, so that I can start contributing quickly.

#### Acceptance Criteria

1. THE System SHALL update README.md with a comprehensive project overview
2. THE System SHALL include a "Project Structure" section in README.md explaining the role-based page organization
3. THE System SHALL include a "Getting Started" section with step-by-step setup instructions
4. THE System SHALL document the npm install, npx supabase start, and npm run dev commands
5. THE System SHALL include information about environment variables required
6. THE System SHALL document the technology stack (React, Vite, TypeScript, Supabase, Tailwind CSS)
7. THE System SHALL include a "Development" section explaining common commands and workflows
8. THE System SHALL create a CONTRIBUTING.md file with guidelines for code organization and file placement

### Requirement 7: Maintain Backward Compatibility

**User Story:** As a developer, I want the reorganization to not break any existing functionality, so that the application continues to work correctly.

#### Acceptance Criteria

1. THE System SHALL ensure all routes continue to render the correct pages after reorganization
2. THE System SHALL verify that authentication and protected routes function correctly
3. THE System SHALL confirm that all user flows (customer ordering, kitchen management, cashier operations, admin functions) work as before
4. THE System SHALL run the application and manually test critical paths
5. WHERE tests exist, THE System SHALL ensure all tests pass after reorganization

### Requirement 8: Create Archive Documentation

**User Story:** As a developer, I want to understand what files were archived and why, so that I can find historical information if needed.

#### Acceptance Criteria

1. THE System SHALL create _archive/README.md explaining the archive structure
2. THE System SHALL document the date of archival and reason for each subdirectory
3. THE System SHALL provide guidance on when to reference archived files versus current code
4. THE System SHALL create _archive/sql_fixes/README.md listing all archived SQL files with brief descriptions
5. THE System SHALL create _archive/dev_notes/README.md categorizing archived markdown files by topic
