#!/bin/bash

# Payment Page Responsive Design Validation Script
# This script validates the implementation against requirements

echo "🧪 Payment Page Cross-Device Testing Validation"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if a pattern exists in a file
check_pattern() {
    local file=$1
    local pattern=$2
    local description=$3
    local requirement=$4
    
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅ PASS${NC}: $description (Req: $requirement)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $description (Req: $requirement)"
        ((FAILED++))
        return 1
    fi
}

# Function to check CSS media query
check_media_query() {
    local file=$1
    local query=$2
    local description=$3
    local requirement=$4
    
    if grep -q "$query" "$file"; then
        echo -e "${GREEN}✅ PASS${NC}: $description (Req: $requirement)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $description (Req: $requirement)"
        ((FAILED++))
        return 1
    fi
}

echo "📋 Testing CSS Implementation"
echo "------------------------------"

# Check header compact styling
check_pattern "src/pages/customer/Payment.tsx" 'p-3.*shadow-medium' \
    "Header uses compact padding (p-3)" "1.1, 1.2"

# Check header title size
check_pattern "src/pages/customer/Payment.tsx" 'text-xl font-bold.*Pagamento' \
    "Header title uses text-xl" "1.1"

# Check header subtitle size
check_pattern "src/pages/customer/Payment.tsx" 'text-sm text-white/90' \
    "Header subtitle uses text-sm" "1.2"

# Check prominent copy button
check_pattern "src/pages/customer/Payment.tsx" 'py-6 text-lg' \
    "Prominent copy button uses py-6 and text-lg" "2.2, 2.3"

# Check responsive media queries
check_media_query "src/index.css" '@media (max-height: 700px)' \
    "Media query for compact mode (max-height: 700px)" "1.5, 3.1"

check_media_query "src/index.css" '@media (max-height: 600px)' \
    "Media query for ultra-compact mode (max-height: 600px)" "3.2"

echo ""
echo "📱 Testing Component Structure"
echo "-------------------------------"

# Check header flex layout
check_pattern "src/pages/customer/Payment.tsx" 'flex items-center justify-between' \
    "Header uses horizontal flex layout" "1.3"

# Check conditional rendering
check_pattern "src/pages/customer/Payment.tsx" "paymentStatus === 'pending' && paymentData" \
    "Copy button conditional on payment status" "2.6"

# Check copy button placement
check_pattern "src/pages/customer/Payment.tsx" 'Copiar Código Pix' \
    "Prominent copy button exists" "2.4"

# Check back button functionality
check_pattern "src/pages/customer/Payment.tsx" 'ArrowLeft' \
    "Back button present in header" "1.4"

echo ""
echo "♿ Testing Accessibility"
echo "------------------------"

# Check touch targets
check_pattern "src/pages/customer/Payment.tsx" 'min-h-\[44px\]' \
    "Minimum touch target size (44px)" "3.3"

# Check aria labels
check_pattern "src/pages/customer/Payment.tsx" 'aria-label' \
    "ARIA labels present for accessibility" "3.3"

# Check role attributes
check_pattern "src/pages/customer/Payment.tsx" 'role="banner"' \
    "Semantic HTML roles used" "3.3"

echo ""
echo "🎨 Testing Responsive Spacing"
echo "------------------------------"

# Check container padding adjustments
check_media_query "src/index.css" 'padding: 0.75rem' \
    "Compact mode reduces padding" "3.1"

check_media_query "src/index.css" 'padding: 0.5rem' \
    "Ultra-compact mode further reduces padding" "3.2"

# Check QR code size adjustment
check_media_query "src/index.css" 'width: 12rem' \
    "QR code size reduced in ultra-compact mode" "3.4"

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Success Rate: $PERCENTAGE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All automated tests passed!${NC}"
    echo ""
    echo "⚠️  Manual Testing Required:"
    echo "   1. Test on iPhone SE (375×667) - verify no scrolling needed"
    echo "   2. Test on iPhone 12/13 (390×844) - verify layout optimization"
    echo "   3. Test on Samsung Galaxy S21 (360×800) - verify Android compatibility"
    echo "   4. Test on small tablet (768×1024) - verify responsive behavior"
    echo "   5. Test copy functionality on iOS Safari"
    echo "   6. Test copy functionality on Chrome Android"
    echo "   7. Verify smooth scrolling without layout shifts"
    echo ""
    echo "📖 See src/test/PAYMENT_TESTING_GUIDE.md for detailed testing procedures"
    echo "🌐 Open src/test/payment-responsive-test.html for interactive testing"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the implementation.${NC}"
    exit 1
fi
