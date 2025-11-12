# Design Document

## Overview

This design document outlines the technical approach for reorganizing the Coco Loko Açaiteria repository to improve maintainability, navigation, and performance. The refactoring will transform a cluttered repository with 271 root-level files and a flat 28-page structure into a clean, role-based organization with archived historical files, lazy-loaded routes, and comprehensive documentation.

## Architecture

### Current State Analysis

**Root Directory Issues:**
- 271 files in root directory (mostly .md, .sql, .sh files)
- Historical development notes mixed with configuration files
- One-off SQL fixes and test scripts scattered throughout
- Difficult to locate essential configuration files

**Pages Directory Issues:**
- 28 page components in flat structure at src/pages/
- No logical grouping by user role or functionality
- Difficult to distinguish customer flow from admin/staff flows
- All pages imported directly in App.tsx without code splitting

**Performance Issues:**
- All page components bundled in initial load
- No lazy loading or code splitting
- Large initial bundle size impacts load time

### Target State Architecture

**Clean Root Directory:**
```
praia-pix-order/
├── _archive/              # Historical files (archived)
│   ├── dev_notes/        # Development markdown files
│   ├── sql_fixes/        # One-off SQL scripts
│   ├── test_scripts/     # Test shell scripts
│   └── README.md         # Archive documentation
├── src/                  # Source code
├── supabase/             # Database and functions
├── public/               # Static assets
├── functions/            # Cloudflare functions
├── package.json          # Dependencies
├── vite.config.ts        # Build configuration
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Styling config
├── README.md             # Project documentation
├── CONTRIBUTING.md       # Contribution guidelines
└── .env                  # Environment variables
```

**Role-Based Pages Structure:**
```
src/pages/
├── customer/             # Customer-facing pages
│   ├── Menu.tsx
│   ├── Checkout.tsx
│   ├── Payment.tsx
│   ├── OrderStatus.tsx
│   ├── Welcome.tsx
│   └── QRLanding.tsx
├── admin/                # Admin panel pages
│   ├── Admin.tsx
│   ├── AdminProducts.tsx
│   ├── AdminWaiters.tsx
│   ├── AdminWaiterReportsPage.tsx
│   ├── Reports.tsx
│   └── WhatsAppAdmin.tsx
├── staff/                # Kitchen/Cashier pages
│   ├── Kitchen.tsx
│   ├── Cashier.tsx
│   └── UnifiedCashier.tsx
├── waiter/               # Waiter-specific pages
│   ├── Waiter.tsx
│   ├── WaiterDashboard.tsx
│   ├── WaiterManagement.tsx
│   └── WaiterDiagnostic.tsx
├── public/               # Public/auth pages
│   ├── Index.tsx
│   ├── Auth.tsx
│   └── NotFound.tsx
├── debug/                # Debug/diagnostic pages
│   ├── MenuDebug.tsx
│   ├── PaymentDebug.tsx
│   ├── PaymentTest.tsx
│   ├── SystemDiagnostic.tsx
│   ├── Monitoring.tsx
│   ├── OrderLookup.tsx
│   └── QRRedirect.tsx
└── __tests__/            # Test files (unchanged)
```

## Components and Interfaces

### File Organization System

**Archive Manager:**
- Identifies files to archive based on patterns
- Creates organized subdirectories in _archive/
- Generates README files documenting archived content
- Preserves file history and context

**Page Migrator:**
- Maps current pages to new role-based directories
- Updates import paths in all files
- Maintains file relationships and dependencies
- Validates successful migration

**Import Path Updater:**
- Scans all TypeScript/React files for page imports
- Updates relative and absolute import paths
- Handles both default and named imports
- Verifies no broken imports remain

### Code Splitting Implementation

**Lazy Loading Pattern:**
```typescript
// Before: Direct imports
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";

// After: Lazy imports with Suspense
import { lazy, Suspense } from 'react';

const Menu = lazy(() => import('./pages/customer/Menu'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));

// In Routes:
<Route 
  path="/menu" 
  element={
    <Suspense fallback={<LoadingFallback />}>
      <Menu />
    </Suspense>
  } 
/>
```

**Loading Fallback Component:**
```typescript
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white px-8 py-6 rounded-3xl shadow-2xl border border-purple-200">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-purple-900 font-bold text-lg">Carregando...</p>
          <p className="text-purple-600 text-sm mt-1">Preparando para você! 🥥</p>
        </div>
      </div>
    </div>
  </div>
);
```

## Data Models

### Archive Metadata

**Archive Directory Structure:**
```typescript
interface ArchiveStructure {
  dev_notes: {
    files: string[];
    description: string;
    categories: {
      planning: string[];
      fixes: string[];
      deployment: string[];
      testing: string[];
    };
  };
  sql_fixes: {
    files: string[];
    description: string;
    essential: string[];  // Files that should be migrated
    historical: string[]; // Files that are obsolete
  };
  test_scripts: {
    files: string[];
    description: string;
  };
}
```

### Page Migration Map

**Role-Based Page Mapping:**
```typescript
interface PageMigrationMap {
  customer: string[];  // ['Menu.tsx', 'Checkout.tsx', ...]
  admin: string[];     // ['Admin.tsx', 'AdminProducts.tsx', ...]
  staff: string[];     // ['Kitchen.tsx', 'Cashier.tsx', ...]
  waiter: string[];    // ['Waiter.tsx', 'WaiterDashboard.tsx', ...]
  public: string[];    // ['Index.tsx', 'Auth.tsx', ...]
  debug: string[];     // ['MenuDebug.tsx', 'PaymentDebug.tsx', ...]
}

const pageMigrationMap: PageMigrationMap = {
  customer: [
    'Menu.tsx',
    'Checkout.tsx',
    'Payment.tsx',
    'OrderStatus.tsx',
    'Welcome.tsx',
    'QRLanding.tsx'
  ],
  admin: [
    'Admin.tsx',
    'AdminProducts.tsx',
    'AdminWaiters.tsx',
    'AdminWaiterReportsPage.tsx',
    'Reports.tsx',
    'WhatsAppAdmin.tsx'
  ],
  staff: [
    'Kitchen.tsx',
    'Cashier.tsx',
    'UnifiedCashier.tsx'
  ],
  waiter: [
    'Waiter.tsx',
    'WaiterDashboard.tsx',
    'WaiterManagement.tsx',
    'WaiterDiagnostic.tsx'
  ],
  public: [
    'Index.tsx',
    'Auth.tsx',
    'NotFound.tsx'
  ],
  debug: [
    'MenuDebug.tsx',
    'PaymentDebug.tsx',
    'PaymentTest.tsx',
    'SystemDiagnostic.tsx',
    'Monitoring.tsx',
    'OrderLookup.tsx',
    'QRRedirect.tsx'
  ]
};
```

### Import Path Patterns

**Path Transformation Rules:**
```typescript
interface ImportPathTransformation {
  pattern: RegExp;
  replacement: string;
  fileTypes: string[];
}

const importTransformations: ImportPathTransformation[] = [
  {
    pattern: /from ["']\.\/pages\/Menu["']/g,
    replacement: "from './pages/customer/Menu'",
    fileTypes: ['App.tsx']
  },
  {
    pattern: /from ["']\.\/pages\/Admin["']/g,
    replacement: "from './pages/admin/Admin'",
    fileTypes: ['App.tsx']
  },
  // ... additional patterns for each page
];
```

## Error Handling

### Safety-First Approach

**Core Principle: Zero Functionality Breakage**

Every change must be validated before proceeding to the next step. If any validation fails, the entire operation is rolled back.

### Archive Process Error Handling

**File Operation Errors:**
- Validate file exists before moving
- Check write permissions on _archive/ directory
- Handle duplicate filenames with timestamp suffixes
- Log all file operations for rollback capability
- **Create full git commit before archiving** (safety checkpoint)
- Verify application compiles and runs after archiving
- **Only archive files that are NOT imported by any source code**

**Pre-Archive Validation:**
```typescript
interface FileUsageCheck {
  file: string;
  isImported: boolean;
  importedBy: string[];
  isReferenced: boolean;
  referencedBy: string[];
  safeToArchive: boolean;
}

// Before archiving ANY file, verify it's not used
async function validateSafeToArchive(file: string): Promise<FileUsageCheck> {
  const usage = await checkFileUsage(file);
  
  if (usage.isImported || usage.isReferenced) {
    console.error(`❌ Cannot archive ${file} - still in use!`);
    return { ...usage, safeToArchive: false };
  }
  
  return { ...usage, safeToArchive: true };
}
```

**Rollback Strategy:**
```typescript
interface ArchiveOperation {
  timestamp: string;
  gitCommitBefore: string;  // Git SHA before operation
  operations: {
    source: string;
    destination: string;
    status: 'pending' | 'completed' | 'failed';
  }[];
}

// If any operation fails, rollback all completed operations
function rollbackArchive(operation: ArchiveOperation): void {
  console.log('⚠️ Rolling back archive operation...');
  
  // Option 1: Git reset (safest)
  execSync(`git reset --hard ${operation.gitCommitBefore}`);
  
  // Option 2: Manual rollback (if git not available)
  operation.operations
    .filter(op => op.status === 'completed')
    .reverse()
    .forEach(op => {
      moveFile(op.destination, op.source);
    });
    
  console.log('✅ Rollback complete - repository restored');
}
```

### Migration Error Handling

**Page Migration Errors:**
- **Git commit before each role migration** (safety checkpoint)
- Verify source file exists before moving
- Check for naming conflicts in destination
- Validate file is valid TypeScript/React component
- **Run TypeScript compiler after moving files**
- **Test affected routes before proceeding**
- Create git commit after each successful role migration
- **If any step fails, git reset to previous commit**

**Import Update Errors:**
- **Create backup of file before modifying**
- Parse files to validate syntax before updating
- Use AST parsing to ensure accurate import detection
- **Run TypeScript compiler after each file update**
- Validate updated imports with TypeScript compiler
- Maintain original file as .backup until validation passes
- **Only delete .backup after successful compilation**
- Report all files with unresolved imports
- **Automatic rollback if compilation fails**

**Atomic Operations:**
```typescript
interface MigrationStep {
  name: string;
  execute: () => Promise<void>;
  validate: () => Promise<boolean>;
  rollback: () => Promise<void>;
}

async function executeMigrationStep(step: MigrationStep): Promise<boolean> {
  const gitCommit = getCurrentGitCommit();
  
  try {
    console.log(`🔄 Executing: ${step.name}`);
    await step.execute();
    
    console.log(`✓ Validating: ${step.name}`);
    const isValid = await step.validate();
    
    if (!isValid) {
      throw new Error(`Validation failed for ${step.name}`);
    }
    
    console.log(`✅ Success: ${step.name}`);
    await gitCommit(`Complete: ${step.name}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed: ${step.name}`, error);
    console.log(`⚠️ Rolling back: ${step.name}`);
    
    await step.rollback();
    await gitReset(gitCommit);
    
    return false;
  }
}
```

### Validation Checks

**Continuous Validation (After Every Change):**

```typescript
interface ValidationResult {
  success: boolean;
  errors: {
    type: 'missing_file' | 'broken_import' | 'compile_error' | 'route_error' | 'test_failure';
    file: string;
    message: string;
    severity: 'critical' | 'high' | 'medium';
  }[];
  warnings: {
    type: 'unused_import' | 'deprecated_path';
    file: string;
    message: string;
  }[];
}

// Run after EVERY file operation
async function validateMigration(): Promise<ValidationResult> {
  console.log('🔍 Running validation checks...');
  
  const checks = [
    // Critical checks - must pass
    validateAllFilesExist(),
    validateNoOrphanedImports(),
    validateTypeScriptCompiles(),
    validateViteBuildSucceeds(),
    validateDevServerStarts(),
    
    // High priority checks
    validateRoutesWork(),
    validateProtectedRoutesWork(),
    validateImportsResolve(),
    
    // Medium priority checks
    validateTestsPass(),
    validateNoConsoleErrors(),
  ];
  
  const results = await Promise.all(checks);
  const aggregated = aggregateResults(results);
  
  // If ANY critical error, fail immediately
  const criticalErrors = aggregated.errors.filter(e => e.severity === 'critical');
  if (criticalErrors.length > 0) {
    console.error('❌ CRITICAL ERRORS DETECTED - STOPPING');
    aggregated.success = false;
  }
  
  return aggregated;
}

// Specific validation functions
async function validateTypeScriptCompiles(): Promise<ValidationResult> {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    return { success: true, errors: [], warnings: [] };
  } catch (error) {
    return {
      success: false,
      errors: [{
        type: 'compile_error',
        file: 'TypeScript',
        message: error.stdout.toString(),
        severity: 'critical'
      }],
      warnings: []
    };
  }
}

async function validateViteBuildSucceeds(): Promise<ValidationResult> {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    return { success: true, errors: [], warnings: [] };
  } catch (error) {
    return {
      success: false,
      errors: [{
        type: 'compile_error',
        file: 'Vite Build',
        message: 'Build failed',
        severity: 'critical'
      }],
      warnings: []
    };
  }
}

async function validateDevServerStarts(): Promise<ValidationResult> {
  try {
    // Start dev server and check it responds
    const server = spawn('npm', ['run', 'dev']);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject('Server timeout'), 30000);
      
      server.stdout.on('data', (data) => {
        if (data.toString().includes('Local:')) {
          clearTimeout(timeout);
          server.kill();
          resolve(true);
        }
      });
    });
    
    return { success: true, errors: [], warnings: [] };
  } catch (error) {
    return {
      success: false,
      errors: [{
        type: 'route_error',
        file: 'Dev Server',
        message: 'Failed to start development server',
        severity: 'critical'
      }],
      warnings: []
    };
  }
}
```

## Testing Strategy

### Pre-Migration Testing

**Baseline Establishment:**
1. Run full test suite and record results
2. Manually test all critical user flows:
   - Customer: QR scan → Menu → Checkout → Payment
   - Kitchen: View orders → Update status
   - Cashier: Monitor orders → Send notifications
   - Admin: Manage products → View reports
   - Waiter: Place orders → View dashboard
3. Document current bundle size and load times
4. Take screenshots of all pages for visual regression

### Migration Testing

**Incremental Validation:**
1. After archiving files:
   - Verify application still runs
   - Check no broken references to archived files
   - Confirm essential configs remain in root

2. After each role migration (customer, admin, etc.):
   - Run TypeScript compiler
   - Test routes for that role
   - Verify imports resolve correctly
   - Commit changes to git

3. After implementing code splitting:
   - Measure new bundle sizes
   - Test lazy loading in browser
   - Verify loading states appear correctly
   - Check network tab for chunk loading

### Post-Migration Testing

**Comprehensive Validation:**
1. Run full test suite - must match baseline
2. Manually test all user flows - must work identically
3. Verify bundle size reduction (target: 30%+ decrease)
4. Test in multiple browsers (Chrome, Firefox, Safari)
5. Test on mobile devices
6. Verify all routes load correctly
7. Check for console errors or warnings
8. Validate documentation accuracy

### Performance Testing

**Metrics to Measure:**
```typescript
interface PerformanceMetrics {
  before: {
    initialBundleSize: number;      // KB
    timeToInteractive: number;      // ms
    firstContentfulPaint: number;   // ms
    totalBundleSize: number;        // KB
  };
  after: {
    initialBundleSize: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    totalBundleSize: number;
    lazyChunks: {
      name: string;
      size: number;
    }[];
  };
  improvement: {
    bundleSizeReduction: number;    // %
    loadTimeImprovement: number;    // ms
  };
}
```

**Performance Targets:**
- Initial bundle size reduction: ≥30%
- Time to interactive improvement: ≥20%
- First contentful paint: <1.5s
- Lazy chunk sizes: <100KB each

## Implementation Phases

### Phase 1: Archive Historical Files (Low Risk)

**Safety Measures:**
- Git commit before starting
- Verify no file is imported before archiving
- Test application after each batch of 50 files
- Automatic rollback on any error

**Steps:**
1. **Git commit current state** (safety checkpoint)
2. Create _archive/ directory structure
3. Identify files to archive using patterns:
   - .md files (exclude README.md, CONTRIBUTING.md)
   - .sql files (exclude those in supabase/migrations/)
   - .sh files
   - .ts test files in root
4. **For each file, verify it's not imported by any source code**
5. Move files to appropriate subdirectories in batches of 50
6. **After each batch:**
   - Run `npm run build` - must succeed
   - Run `npm run dev` - must start
   - Git commit batch
7. Create README files in each archive subdirectory
8. **Final validation:**
   - TypeScript compiles
   - Vite builds successfully
   - Dev server starts
   - All routes accessible
9. Git commit final state

**Rollback:** Git reset to checkpoint commit

### Phase 2: Reorganize Pages by Role (Medium Risk)

**Safety Measures:**
- Git commit before each role migration
- Validate TypeScript compilation after each file move
- Test routes after each role migration
- Automatic rollback if any validation fails

**Steps:**
1. **Git commit current state** (safety checkpoint)
2. Create new role-based directories in src/pages/
3. **For each role (customer → admin → staff → waiter → public → debug):**
   
   a. **Git commit before role migration**
   
   b. Move pages for this role:
      - Copy file to new location (don't delete yet)
      - Update imports in App.tsx
      - **Run TypeScript compiler** - must pass
      - **Run Vite build** - must succeed
      - Delete original file only after validation
   
   c. Update any cross-page imports:
      - Search for imports of moved files
      - Update import paths
      - **Run TypeScript compiler** - must pass
   
   d. **Validate routes work:**
      - Start dev server
      - Navigate to each route for this role
      - Verify page renders correctly
      - Check browser console for errors
   
   e. **Run full validation:**
      - TypeScript compiles
      - Vite builds successfully
      - Dev server starts
      - All routes for this role work
      - No console errors
   
   f. **Git commit role migration** (checkpoint)
   
   g. **If any step fails:**
      - Git reset to checkpoint
      - Report error
      - Stop migration

4. **Final validation after all roles:**
   - All routes work
   - All user flows tested manually
   - No TypeScript errors
   - No console errors
   - Application functions identically to before

**Rollback:** Git reset to role checkpoint commit

### Phase 3: Implement Code Splitting (Medium Risk)

**Safety Measures:**
- Git commit before starting
- Test each lazy-loaded route individually
- Verify loading states appear correctly
- Ensure no functionality breaks
- Automatic rollback if routes fail

**Steps:**
1. **Git commit current state** (safety checkpoint)

2. Create LoadingFallback component:
   - Create src/components/LoadingFallback.tsx
   - **Test component renders correctly**
   - Git commit

3. **For each role (customer → admin → staff → waiter → public → debug):**
   
   a. **Git commit before role lazy loading**
   
   b. Convert imports to lazy loading:
      - Change direct imports to React.lazy()
      - Wrap routes with Suspense
      - **Run TypeScript compiler** - must pass
      - **Run Vite build** - must succeed
   
   c. **Test lazy loading:**
      - Start dev server
      - Navigate to each route
      - Verify loading state appears briefly
      - Verify page loads correctly after
      - Check network tab for chunk loading
      - Verify no console errors
   
   d. **Validate functionality:**
      - Test all interactive features on page
      - Verify data loads correctly
      - Check protected routes still work
      - Ensure no regression in behavior
   
   e. **Git commit role lazy loading** (checkpoint)
   
   f. **If any step fails:**
      - Git reset to checkpoint
      - Report error
      - Stop lazy loading implementation

4. **Measure performance improvements:**
   - Build production bundle
   - Compare bundle sizes (before vs after)
   - Verify ≥30% reduction in initial bundle
   - Document chunk sizes

5. **Final validation:**
   - All routes work with lazy loading
   - Loading states appear correctly
   - No console errors
   - All user flows work identically
   - Performance improved

**Rollback:** Git reset to checkpoint commit

### Phase 4: Consolidate SQL Migrations (Low Risk)

**Steps:**
1. Review all .sql files in _archive/sql_fixes/
2. Identify essential schema changes
3. Create new migration files with proper timestamps
4. Test migrations on local Supabase instance
5. Document migration decisions
6. Commit new migrations

**Rollback:** Delete new migration files

### Phase 5: Update Documentation (Low Risk)

**Steps:**
1. Update README.md with new structure
2. Add Getting Started section
3. Document role-based page organization
4. Create CONTRIBUTING.md
5. Update _archive/ README files
6. Review and refine all documentation
7. Commit documentation changes

**Rollback:** Git revert documentation commits

## Success Criteria

### Quantitative Metrics

1. **Root Directory Cleanup:**
   - Root directory contains ≤20 files/directories (excluding _archive/)
   - All 271 historical files successfully archived
   - Zero broken references to archived files

2. **Code Organization:**
   - All 28 pages successfully migrated to role-based directories
   - Zero broken imports
   - TypeScript compiles without errors
   - All tests pass

3. **Performance Improvements:**
   - Initial bundle size reduced by ≥30%
   - Time to interactive improved by ≥20%
   - Lazy loading implemented for all routes
   - 6+ separate code chunks created

4. **Documentation Quality:**
   - README.md updated with comprehensive information
   - CONTRIBUTING.md created with clear guidelines
   - Archive directories documented
   - All setup steps tested and verified

### Qualitative Metrics

1. **Developer Experience:**
   - New developers can locate relevant code quickly
   - File structure is intuitive and self-documenting
   - Documentation provides clear onboarding path
   - Contributing guidelines are easy to follow

2. **Maintainability:**
   - Clear separation of concerns by user role
   - Easy to add new pages to appropriate directories
   - Historical context preserved in archive
   - Migration decisions documented

3. **User Experience:**
   - Application loads faster
   - No regression in functionality
   - All user flows work identically
   - Loading states provide good feedback

## Functionality Preservation Guarantee

### Zero-Breakage Commitment

**This refactor MUST NOT break any existing functionality.** Every change is validated before proceeding.

### Functionality Test Matrix

**Before Starting (Baseline):**
```typescript
interface FunctionalityBaseline {
  customerFlow: {
    qrScan: boolean;
    menuBrowse: boolean;
    addToCart: boolean;
    checkout: boolean;
    payment: boolean;
    orderStatus: boolean;
  };
  kitchenFlow: {
    login: boolean;
    viewOrders: boolean;
    updateStatus: boolean;
    markReady: boolean;
  };
  cashierFlow: {
    login: boolean;
    monitorOrders: boolean;
    sendNotifications: boolean;
    viewHistory: boolean;
  };
  adminFlow: {
    login: boolean;
    manageProducts: boolean;
    manageWaiters: boolean;
    viewReports: boolean;
    whatsappAdmin: boolean;
  };
  waiterFlow: {
    login: boolean;
    placeOrder: boolean;
    viewDashboard: boolean;
    viewOrders: boolean;
  };
}

// Test all flows and record results
const baseline = await testAllFlows();
```

**After Each Change (Validation):**
```typescript
// Re-test affected flows
const current = await testAffectedFlows(changedFiles);

// Compare with baseline
const hasRegression = compareFlows(baseline, current);

if (hasRegression) {
  console.error('❌ REGRESSION DETECTED - Rolling back');
  await rollback();
  throw new Error('Functionality broken - migration stopped');
}
```

### Manual Testing Checklist

**Customer Flow (Critical):**
- [ ] Can scan QR code and land on welcome page
- [ ] Can view menu with all categories
- [ ] Can add items to cart
- [ ] Can remove items from cart
- [ ] Can see cart total
- [ ] Can proceed to checkout
- [ ] Can enter name and WhatsApp
- [ ] Can generate payment QR code
- [ ] Can view order status
- [ ] Receives WhatsApp notifications (if configured)

**Kitchen Flow (Critical):**
- [ ] Can login with kitchen credentials
- [ ] Can see list of paid orders
- [ ] Can mark order as "preparing"
- [ ] Can mark order as "ready"
- [ ] Real-time updates work
- [ ] Order details display correctly

**Cashier Flow (Critical):**
- [ ] Can login with cashier credentials
- [ ] Can see all orders with status
- [ ] Can send WhatsApp notifications
- [ ] Can view order history
- [ ] Real-time updates work

**Admin Flow (Critical):**
- [ ] Can login with admin credentials
- [ ] Can view admin dashboard
- [ ] Can add/edit/delete products
- [ ] Can upload product images
- [ ] Can manage waiters
- [ ] Can view reports
- [ ] Can access WhatsApp admin

**Waiter Flow (Critical):**
- [ ] Can login with waiter credentials
- [ ] Can place orders for customers
- [ ] Can view waiter dashboard
- [ ] Can see order history

### Automated Validation

**Route Validation:**
```typescript
const routes = [
  '/',
  '/menu',
  '/checkout',
  '/auth',
  '/kitchen',
  '/cashier',
  '/admin',
  '/admin/products',
  '/admin/waiters',
  '/reports',
  '/waiter',
  '/waiter-dashboard',
];

async function validateAllRoutes(): Promise<boolean> {
  for (const route of routes) {
    const response = await fetch(`http://localhost:8080${route}`);
    if (!response.ok) {
      console.error(`❌ Route ${route} failed`);
      return false;
    }
  }
  return true;
}
```

## Risk Mitigation

### High-Risk Areas

1. **Import Path Updates:**
   - Risk: Breaking imports across many files
   - Mitigation: 
     - Copy files before moving (don't delete originals)
     - Update imports incrementally
     - Run TypeScript compiler after each change
     - Test routes after each role migration
     - Git commit after each successful role
   - Rollback: Git reset to previous checkpoint
   - **Validation:** TypeScript must compile, routes must work

2. **Code Splitting:**
   - Risk: Breaking lazy loading or route rendering
   - Mitigation:
     - Implement lazy loading one role at a time
     - Test each route individually
     - Monitor console for errors
     - Verify loading states appear
     - Check network tab for chunk loading
   - Rollback: Git reset to remove lazy loading
   - **Validation:** All routes must load, no console errors

3. **SQL Migration Consolidation:**
   - Risk: Missing essential schema changes
   - Mitigation:
     - Review all archived SQL files
     - Test migrations on local database first
     - Document all migration decisions
     - Keep archived files for reference
   - Rollback: Delete new migrations, restore from backup
   - **Validation:** Database schema matches production

### Safety Net: Git Checkpoints

**Every significant change gets a git commit:**
```bash
# Before starting
git commit -m "Checkpoint: Before repository reorganization"
git tag "pre-refactor-checkpoint"

# After archiving files
git commit -m "Phase 1: Archive historical files"

# After each role migration
git commit -m "Phase 2: Migrate customer pages"
git commit -m "Phase 2: Migrate admin pages"
# ... etc

# After code splitting
git commit -m "Phase 3: Implement code splitting"

# Final
git commit -m "Complete: Repository organization refactor"
git tag "post-refactor-v1.0"
```

**If anything breaks at any point:**
```bash
# Reset to last known good state
git reset --hard <checkpoint-commit>

# Or reset to before refactor started
git reset --hard pre-refactor-checkpoint
```

### Testing Checkpoints

**After EVERY File Operation:**
- Run `npx tsc --noEmit` - must pass (TypeScript compilation)
- Verify no new errors in IDE

**After Each Batch/Role Migration:**
- Run `npm run build` - must succeed
- Run `npm run lint` - must pass
- Run `npm run dev` - must start without errors
- Manually test affected user flows
- Check browser console for errors
- Verify no TypeScript errors in IDE
- **Git commit checkpoint**

**After Each Phase:**
- Full TypeScript compilation
- Full Vite build
- Dev server starts successfully
- All routes accessible
- All user flows tested:
  - Customer: QR scan → Menu → Checkout → Payment → Order Status
  - Kitchen: Login → View orders → Update status
  - Cashier: Login → Monitor orders → Send notifications
  - Admin: Login → Products → Waiters → Reports
  - Waiter: Login → Place order → View dashboard
- No console errors or warnings
- No network errors
- Performance metrics measured
- **Git commit phase completion**

**Before Final Commit:**
- Full test suite passes (if tests exist)
- All user flows tested manually (complete end-to-end)
- Performance metrics measured and documented:
  - Bundle size reduction ≥30%
  - Load time improvement ≥20%
  - All lazy chunks load correctly
- Documentation reviewed and accurate
- Git history is clean and well-documented
- **Create git tag for release**

**Validation Script:**
```bash
#!/bin/bash
# validate-migration.sh - Run after each change

echo "🔍 Validating migration..."

# TypeScript compilation
echo "📝 Checking TypeScript..."
npx tsc --noEmit || { echo "❌ TypeScript errors"; exit 1; }

# Linting
echo "🔍 Running linter..."
npm run lint || { echo "❌ Lint errors"; exit 1; }

# Build
echo "🏗️ Building application..."
npm run build || { echo "❌ Build failed"; exit 1; }

# Dev server (quick check)
echo "🚀 Testing dev server..."
timeout 30s npm run dev &
DEV_PID=$!
sleep 10
kill $DEV_PID 2>/dev/null || { echo "❌ Dev server failed"; exit 1; }

echo "✅ All validations passed!"
exit 0
```

## Future Enhancements

### Beyond This Refactor

1. **Component Organization:**
   - Consider organizing components by feature/domain
   - Create shared component library
   - Implement component documentation (Storybook)

2. **Further Code Splitting:**
   - Split large components into smaller chunks
   - Implement route-based prefetching
   - Optimize bundle with tree shaking

3. **Testing Infrastructure:**
   - Add integration tests for user flows
   - Implement visual regression testing
   - Add performance monitoring

4. **Development Workflow:**
   - Add pre-commit hooks for linting
   - Implement automated testing in CI/CD
   - Add bundle size monitoring
