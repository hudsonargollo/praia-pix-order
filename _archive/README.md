# Archive Directory

**Archive Date:** November 12, 2025  
**Reason:** Repository organization refactor to improve maintainability and establish clean project structure

## Purpose

This directory contains historical development files that were moved from the repository root during a comprehensive reorganization effort. The goal was to:

- Reduce root directory clutter (from 271 files to <20 essential files)
- Improve repository navigation and maintainability
- Preserve development history and context
- Establish a professional, clean project structure

These files are preserved for historical reference, troubleshooting, and understanding the project's evolution, but are no longer needed in the active development workspace.

## Archive Structure

```
_archive/
├── README.md              # This file - archive overview
├── ARCHIVE_PHASE_SUMMARY.md  # Detailed archival process summary
├── dev_notes/            # Development documentation (161 files)
│   └── README.md         # Categorized list of all dev notes
├── sql_fixes/            # SQL scripts and fixes (85 files)
│   └── README.md         # SQL file documentation and migration status
└── test_scripts/         # Test and deployment scripts (26 files)
    └── README.md         # Script documentation and usage
```

## Directory Contents

### 📝 dev_notes/ (161 files)

Historical development documentation including:
- Planning documents and action plans
- Bug fixes and solutions (45 files)
- Deployment guides and summaries (50 files)
- Testing procedures and results (20 files)
- Feature implementation notes (31 files)
- Status updates and completion reports

**When to reference:** Understanding feature evolution, investigating historical bugs, onboarding new developers

**See:** [dev_notes/README.md](dev_notes/README.md) for complete categorized list

### 🗄️ sql_fixes/ (85 files)

SQL scripts created during development for:
- Admin account management (multiple iterations)
- Waiter management setup and fixes
- RLS (Row Level Security) policy fixes
- Order management fixes
- Payment system debugging
- WhatsApp integration setup
- Diagnostic and debugging queries

**Important:** All essential schema changes have been migrated to `supabase/migrations/`. These files are historical iterations and one-off fixes.

**When to reference:** Understanding schema evolution, debugging similar database issues, learning from past solutions

**See:** [sql_fixes/README.md](sql_fixes/README.md) for migration status and file categorization

### 🧪 test_scripts/ (26 files)

Test scripts and deployment utilities including:
- Deployment scripts (3 shell scripts)
- WhatsApp/Evolution API tests (6 TypeScript files)
- Admin feature tests (3 TypeScript files)
- Database/RLS tests (2 TypeScript files)
- Edge Functions tests (4 TypeScript files)
- Authentication tests (2 TypeScript files)
- Payment system tests (1 TypeScript file)
- Validation scripts (3 files)
- Production verification (1 TypeScript file)

**When to reference:** Understanding testing approaches, debugging integration issues, manual testing procedures

**See:** [test_scripts/README.md](test_scripts/README.md) for detailed script documentation

## Archival Process

The archival was performed in phases with safety measures:

1. **Phase 1: Archive Historical Files**
   - Created _archive/ directory structure
   - Verified no files were imported by source code
   - Moved files in batches with validation after each batch
   - Git committed each successful batch

2. **Phase 2: SQL Migration Consolidation**
   - Reviewed all archived SQL files
   - Identified essential schema changes
   - Created proper migration files for missing elements
   - Documented migration status

3. **Phase 3: Documentation**
   - Created README files for each subdirectory
   - Categorized files by purpose and functionality
   - Documented when to reference archived files

## When to Reference Archived Files

### ✅ Good Reasons to Reference

- **Historical Context**: Understanding why certain implementation decisions were made
- **Troubleshooting**: Investigating similar issues that occurred in the past
- **Learning**: Understanding the development process and problem-solving approaches
- **Onboarding**: Helping new developers understand project history
- **Documentation**: Creating comprehensive project documentation

### ❌ Avoid These Uses

- **Running Scripts Directly**: Archived scripts may be outdated or conflict with current code
- **Copying Code**: Current implementations may be more refined
- **Schema Changes**: Use proper migrations in `supabase/migrations/` instead
- **Active Development**: Use current documentation and code

## Current Project Documentation

For active development, refer to:

- **README.md** (root) - Project overview, setup instructions, and getting started
- **CONTRIBUTING.md** (root) - Contribution guidelines and code organization
- **.kiro/specs/** - Active feature specifications and implementation plans
- **supabase/migrations/** - Database schema changes and migrations
- **src/components/__tests__/** - Current component tests
- **src/pages/__tests__/** - Current page tests

## Statistics

### Files Archived
- **Total Files Archived:** 272 files
- **Markdown Files:** 161 files
- **SQL Files:** 85 files
- **Shell Scripts:** 5 files
- **TypeScript Test Files:** 20 files
- **HTML Test Files:** 1 file

### Root Directory Improvement
- **Before:** 271 files in root directory
- **After:** <20 essential files (excluding _archive/)
- **Reduction:** ~95% reduction in root directory clutter

### Repository Organization
- **Before:** Flat structure with mixed historical and current files
- **After:** Clean, organized structure with archived history
- **Benefit:** Improved navigation, maintainability, and professional appearance

## Migration Status

All essential database schema elements from archived SQL files have been incorporated into proper migration files:

- ✅ All table schemas migrated
- ✅ All RLS policies migrated
- ✅ All database functions migrated
- ✅ All storage buckets migrated
- ✅ WhatsApp integration tables migrated
- ✅ Payment webhooks migrated
- ✅ Waiter management functions migrated

**Latest Migrations Added (November 12, 2025):**
- `20251112000001_create_get_user_role_function.sql` - User role function
- `20251112000002_create_product_images_bucket.sql` - Product images storage

See [sql_fixes/README.md](sql_fixes/README.md) for complete migration details.

## Safety and Preservation

### Why These Files Are Preserved

1. **Historical Record**: Documents the project's development journey
2. **Troubleshooting Reference**: Helps debug similar issues in the future
3. **Learning Resource**: Shows problem-solving approaches and iterations
4. **Context Preservation**: Maintains understanding of why certain decisions were made
5. **Audit Trail**: Provides complete history of changes and fixes

### Git History

All archival operations were performed with proper git commits:
- Each batch of files archived was committed separately
- Validation performed after each commit
- Full rollback capability maintained throughout process
- Git tags created at major milestones

## Related Documentation

- [Repository Organization Refactor Spec](.kiro/specs/repository-organization-refactor/) - Complete refactoring specification
- [Performance Report](.kiro/specs/repository-organization-refactor/PERFORMANCE_REPORT.md) - Performance improvements achieved
- [Archive Phase Summary](ARCHIVE_PHASE_SUMMARY.md) - Detailed archival process documentation

## Notes for Developers

### If You Need to Reference Archived Files

1. **Check Current Documentation First**: Most information is in current docs
2. **Use Archive READMEs**: Each subdirectory has a categorized README
3. **Understand Context**: These files represent historical iterations
4. **Don't Run Directly**: Scripts and SQL may be outdated
5. **Learn from Patterns**: Use as reference for problem-solving approaches

### If You Need to Add to Archive

If you have historical files that should be archived:

1. Verify files are not imported by any source code
2. Place in appropriate subdirectory (dev_notes/, sql_fixes/, test_scripts/)
3. Update the relevant README.md with file description
4. Git commit with clear message
5. Update this README if adding new categories

## Conclusion

This archive represents the development history of the Coco Loko Açaiteria project from its inception through November 2025. It preserves valuable context while maintaining a clean, professional repository structure for ongoing development.

The archival process was performed with careful attention to:
- ✅ Zero functionality breakage
- ✅ Complete validation at each step
- ✅ Proper git history preservation
- ✅ Comprehensive documentation
- ✅ Migration of essential schema elements

For questions about archived files or the archival process, refer to the [Repository Organization Refactor Spec](.kiro/specs/repository-organization-refactor/).

---

*Archive created as part of the repository organization refactor initiative to improve maintainability and establish professional project structure.*
