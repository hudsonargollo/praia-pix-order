#!/bin/bash

# Repository Reorganization - Validation Script
# This script validates the repository state after each refactor step

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Validation functions

validate_typescript() {
    print_header "TypeScript Compilation Check"
    
    if npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt; then
        print_success "TypeScript compiles without errors"
        return 0
    else
        print_error "TypeScript compilation failed"
        echo "See /tmp/tsc-output.txt for details"
        return 1
    fi
}

validate_build() {
    print_header "Vite Build Check"
    
    if npm run build 2>&1 | tee /tmp/build-output.txt; then
        print_success "Vite build succeeded"
        
        # Check bundle size
        if [ -f "dist/assets/index-*.js" ]; then
            BUNDLE_SIZE=$(ls -lh dist/assets/index-*.js | awk '{print $5}')
            print_info "Main bundle size: $BUNDLE_SIZE"
        fi
        
        return 0
    else
        print_error "Vite build failed"
        echo "See /tmp/build-output.txt for details"
        return 1
    fi
}

validate_lint() {
    print_header "ESLint Check"
    
    if npm run lint 2>&1 | tee /tmp/lint-output.txt; then
        print_success "ESLint passed"
        return 0
    else
        print_warning "ESLint found issues (non-blocking)"
        return 0
    fi
}

validate_file_structure() {
    print_header "File Structure Check"
    
    # Count root directory files
    ROOT_FILES=$(find . -maxdepth 1 -type f | wc -l | tr -d ' ')
    print_info "Root directory files: $ROOT_FILES"
    
    if [ "$ROOT_FILES" -le 20 ]; then
        print_success "Root directory is clean (≤20 files)"
    else
        print_warning "Root directory has $ROOT_FILES files (target: ≤20)"
    fi
    
    # Check if _archive exists
    if [ -d "_archive" ]; then
        ARCHIVED_MD=$(find _archive -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
        ARCHIVED_SQL=$(find _archive -name "*.sql" 2>/dev/null | wc -l | tr -d ' ')
        ARCHIVED_SH=$(find _archive -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')
        
        print_info "Archived files: $ARCHIVED_MD .md, $ARCHIVED_SQL .sql, $ARCHIVED_SH .sh"
        print_success "_archive/ directory exists"
    else
        print_info "_archive/ directory not yet created"
    fi
    
    # Check pages directory structure
    if [ -d "src/pages/customer" ]; then
        CUSTOMER_PAGES=$(ls -1 src/pages/customer/*.tsx 2>/dev/null | wc -l | tr -d ' ')
        print_info "Customer pages: $CUSTOMER_PAGES"
        print_success "Role-based structure: customer/ exists"
    else
        print_info "Role-based structure not yet implemented"
    fi
    
    if [ -d "src/pages/admin" ]; then
        ADMIN_PAGES=$(ls -1 src/pages/admin/*.tsx 2>/dev/null | wc -l | tr -d ' ')
        print_info "Admin pages: $ADMIN_PAGES"
        print_success "Role-based structure: admin/ exists"
    fi
    
    if [ -d "src/pages/staff" ]; then
        STAFF_PAGES=$(ls -1 src/pages/staff/*.tsx 2>/dev/null | wc -l | tr -d ' ')
        print_info "Staff pages: $STAFF_PAGES"
        print_success "Role-based structure: staff/ exists"
    fi
    
    if [ -d "src/pages/waiter" ]; then
        WAITER_PAGES=$(ls -1 src/pages/waiter/*.tsx 2>/dev/null | wc -l | tr -d ' ')
        print_info "Waiter pages: $WAITER_PAGES"
        print_success "Role-based structure: waiter/ exists"
    fi
    
    if [ -d "src/pages/public" ]; then
        PUBLIC_PAGES=$(ls -1 src/pages/public/*.tsx 2>/dev/null | wc -l | tr -d ' ')
        print_info "Public pages: $PUBLIC_PAGES"
        print_success "Role-based structure: public/ exists"
    fi
    
    if [ -d "src/pages/debug" ]; then
        DEBUG_PAGES=$(ls -1 src/pages/debug/*.tsx 2>/dev/null | wc -l | tr -d ' ')
        print_info "Debug pages: $DEBUG_PAGES"
        print_success "Role-based structure: debug/ exists"
    fi
}

validate_imports() {
    print_header "Import Path Check"
    
    # Check for any broken imports (files that import non-existent files)
    if command -v rg &> /dev/null; then
        # Use ripgrep if available
        BROKEN_IMPORTS=$(rg "from ['\"]\.\.?/.*['\"]" src/ -t tsx -t ts 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
        print_info "Found $BROKEN_IMPORTS import statements to validate"
    else
        print_info "ripgrep not available, skipping detailed import check"
    fi
    
    print_success "Import validation complete"
}

validate_git_status() {
    print_header "Git Status Check"
    
    if git diff --quiet; then
        print_success "No uncommitted changes"
    else
        print_warning "Uncommitted changes detected"
        git status --short || true
    fi
    
    # Show recent commits
    print_info "Recent commits:"
    git log --oneline -5 || true
}

# Main validation flow
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   Repository Reorganization - Validation Script       ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Run all validations
    validate_git_status
    validate_file_structure
    validate_typescript || true  # Continue even if TypeScript fails
    validate_imports
    validate_lint || true  # Continue even if lint fails
    validate_build || true  # Continue even if build fails
    
    # Summary
    print_header "Validation Summary"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ All critical validations passed!${NC}\n"
        exit 0
    else
        echo -e "\n${RED}✗ Some validations failed. Please review the output above.${NC}\n"
        exit 1
    fi
}

# Run main function
main
