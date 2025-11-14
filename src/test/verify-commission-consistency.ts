/**
 * Cross-Component Commission Consistency Verification
 * 
 * This script verifies that commission calculations and displays are consistent
 * across WaiterDashboard and AdminWaiterReports components.
 */

import { 
  calculateConfirmedCommissions, 
  calculateEstimatedCommissions,
  getCommissionStatus,
  getOrdersByCategory,
  ORDER_STATUS_CATEGORIES,
  COMMISSION_RATE
} from '../lib/commissionUtils';
import type { Order } from '../types/commission';

// Test data with various order statuses
const testOrders: Order[] = [
  {
    id: '1',
    order_number: 1001,
    customer_name: 'João Silva',
    customer_phone: '11999999999',
    total_amount: 100.00,
    status: 'paid',
    created_at: new Date().toISOString(),
    waiter_id: 'waiter-1'
  },
  {
    id: '2',
    order_number: 1002,
    customer_name: 'Maria Santos',
    customer_phone: '11988888888',
    total_amount: 50.00,
    status: 'completed',
    created_at: new Date().toISOString(),
    waiter_id: 'waiter-1'
  },
  {
    id: '3',
    order_number: 1003,
    customer_name: 'Pedro Costa',
    customer_phone: '11977777777',
    total_amount: 75.00,
    status: 'pending',
    created_at: new Date().toISOString(),
    waiter_id: 'waiter-1'
  },
  {
    id: '4',
    order_number: 1004,
    customer_name: 'Ana Lima',
    customer_phone: '11966666666',
    total_amount: 120.00,
    status: 'in_preparation',
    created_at: new Date().toISOString(),
    waiter_id: 'waiter-1'
  },
  {
    id: '5',
    order_number: 1005,
    customer_name: 'Carlos Souza',
    customer_phone: '11955555555',
    total_amount: 80.00,
    status: 'cancelled',
    created_at: new Date().toISOString(),
    waiter_id: 'waiter-1'
  },
  {
    id: '6',
    order_number: 1006,
    customer_name: 'Lucia Oliveira',
    customer_phone: '11944444444',
    total_amount: 90.00,
    status: 'ready',
    created_at: new Date().toISOString(),
    waiter_id: 'waiter-1'
  }
];

interface VerificationResult {
  test: string;
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
}

const results: VerificationResult[] = [];

function addResult(test: string, passed: boolean, expected: any, actual: any, message: string) {
  results.push({ test, passed, expected, actual, message });
}

console.log('🔍 Starting Commission Consistency Verification\n');
console.log('=' .repeat(80));

// Test 1: Verify ORDER_STATUS_CATEGORIES consistency
console.log('\n📋 Test 1: ORDER_STATUS_CATEGORIES Consistency');
console.log('-'.repeat(80));

const paidStatuses = ORDER_STATUS_CATEGORIES.PAID;
const pendingStatuses = ORDER_STATUS_CATEGORIES.PENDING;
const excludedStatuses = ORDER_STATUS_CATEGORIES.EXCLUDED;

console.log('PAID statuses:', paidStatuses);
console.log('PENDING statuses:', pendingStatuses);
console.log('EXCLUDED statuses:', excludedStatuses);

const hasOverlap = [...paidStatuses].some(s => pendingStatuses.includes(s) || excludedStatuses.includes(s)) ||
                   [...pendingStatuses].some(s => excludedStatuses.includes(s));

addResult(
  'No status overlap between categories',
  !hasOverlap,
  false,
  hasOverlap,
  hasOverlap ? 'Categories have overlapping statuses' : 'All categories are mutually exclusive'
);

// Test 2: Calculate confirmed commissions
console.log('\n💰 Test 2: Confirmed Commission Calculation');
console.log('-'.repeat(80));

const confirmedCommission = calculateConfirmedCommissions(testOrders);
const expectedConfirmed = (100 + 50) * COMMISSION_RATE; // paid + completed orders

console.log(`Calculated: R$ ${confirmedCommission.toFixed(2)}`);
console.log(`Expected: R$ ${expectedConfirmed.toFixed(2)}`);

addResult(
  'Confirmed commission calculation',
  confirmedCommission === expectedConfirmed,
  expectedConfirmed,
  confirmedCommission,
  confirmedCommission === expectedConfirmed ? 'Calculation matches expected value' : 'Calculation mismatch'
);

// Test 3: Calculate estimated commissions
console.log('\n⏳ Test 3: Estimated Commission Calculation');
console.log('-'.repeat(80));

const estimatedCommission = calculateEstimatedCommissions(testOrders);
const expectedEstimated = (75 + 120 + 90) * COMMISSION_RATE; // pending + in_preparation + ready orders

console.log(`Calculated: R$ ${estimatedCommission.toFixed(2)}`);
console.log(`Expected: R$ ${expectedEstimated.toFixed(2)}`);

addResult(
  'Estimated commission calculation',
  estimatedCommission === expectedEstimated,
  expectedEstimated,
  estimatedCommission,
  estimatedCommission === expectedEstimated ? 'Calculation matches expected value' : 'Calculation mismatch'
);

// Test 4: Verify getOrdersByCategory
console.log('\n📊 Test 4: Order Categorization');
console.log('-'.repeat(80));

const paidOrders = getOrdersByCategory(testOrders, 'PAID');
const pendingOrders = getOrdersByCategory(testOrders, 'PENDING');
const excludedOrders = getOrdersByCategory(testOrders, 'EXCLUDED');

console.log(`PAID orders: ${paidOrders.length} (expected: 2)`);
console.log(`PENDING orders: ${pendingOrders.length} (expected: 3)`);
console.log(`EXCLUDED orders: ${excludedOrders.length} (expected: 1)`);

addResult(
  'PAID orders count',
  paidOrders.length === 2,
  2,
  paidOrders.length,
  'Correct number of paid orders'
);

addResult(
  'PENDING orders count',
  pendingOrders.length === 3,
  3,
  pendingOrders.length,
  'Correct number of pending orders'
);

addResult(
  'EXCLUDED orders count',
  excludedOrders.length === 1,
  1,
  excludedOrders.length,
  'Correct number of excluded orders'
);

// Test 5: Verify commission status display configuration
console.log('\n🎨 Test 5: Commission Status Display Configuration');
console.log('-'.repeat(80));

testOrders.forEach(order => {
  const config = getCommissionStatus(order);
  console.log(`\nOrder #${order.order_number} (${order.status}):`);
  console.log(`  Status: ${config.status}`);
  console.log(`  Amount: ${config.displayAmount}`);
  console.log(`  Icon: ${config.icon}`);
  console.log(`  Tooltip: ${config.tooltip}`);
  
  // Verify correct status mapping
  let expectedStatus: 'confirmed' | 'pending' | 'excluded';
  let expectedIcon: string;
  
  if (ORDER_STATUS_CATEGORIES.PAID.includes(order.status.toLowerCase())) {
    expectedStatus = 'confirmed';
    expectedIcon = 'CheckCircle';
  } else if (ORDER_STATUS_CATEGORIES.PENDING.includes(order.status.toLowerCase())) {
    expectedStatus = 'pending';
    expectedIcon = 'Clock';
  } else {
    expectedStatus = 'excluded';
    expectedIcon = 'XCircle';
  }
  
  addResult(
    `Order #${order.order_number} status mapping`,
    config.status === expectedStatus && config.icon === expectedIcon,
    { status: expectedStatus, icon: expectedIcon },
    { status: config.status, icon: config.icon },
    `Status and icon correctly mapped for ${order.status}`
  );
});

// Test 6: Verify precision (2 decimal places)
console.log('\n🔢 Test 6: Decimal Precision');
console.log('-'.repeat(80));

const testOrderWithOddAmount: Order = {
  id: '7',
  order_number: 1007,
  customer_name: 'Test User',
  customer_phone: '11933333333',
  total_amount: 33.33,
  status: 'paid',
  created_at: new Date().toISOString(),
  waiter_id: 'waiter-1'
};

const precisionTest = calculateConfirmedCommissions([testOrderWithOddAmount]);
const expectedPrecision = Number((33.33 * COMMISSION_RATE).toFixed(2));

console.log(`Amount: R$ 33.33`);
console.log(`Commission: R$ ${precisionTest.toFixed(2)}`);
console.log(`Expected: R$ ${expectedPrecision.toFixed(2)}`);

addResult(
  'Decimal precision (2 places)',
  precisionTest === expectedPrecision,
  expectedPrecision,
  precisionTest,
  'Commission rounded to 2 decimal places'
);

// Test 7: Verify case-insensitive status matching
console.log('\n🔤 Test 7: Case-Insensitive Status Matching');
console.log('-'.repeat(80));

const upperCaseOrder: Order = {
  ...testOrders[0],
  id: '8',
  status: 'PAID'
};

const mixedCaseOrder: Order = {
  ...testOrders[0],
  id: '9',
  status: 'PaId'
};

const upperConfig = getCommissionStatus(upperCaseOrder);
const mixedConfig = getCommissionStatus(mixedCaseOrder);

console.log(`Uppercase 'PAID': ${upperConfig.status}`);
console.log(`Mixed case 'PaId': ${mixedConfig.status}`);

addResult(
  'Case-insensitive matching',
  upperConfig.status === 'confirmed' && mixedConfig.status === 'confirmed',
  'confirmed',
  { upper: upperConfig.status, mixed: mixedConfig.status },
  'Status matching is case-insensitive'
);

// Test 8: Verify styling consistency
console.log('\n🎨 Test 8: Styling Consistency');
console.log('-'.repeat(80));

const confirmedConfig = getCommissionStatus(testOrders[0]); // paid
const pendingConfig = getCommissionStatus(testOrders[2]); // pending
const excludedConfig = getCommissionStatus(testOrders[4]); // cancelled

console.log('Confirmed styling:', confirmedConfig.className);
console.log('Pending styling:', pendingConfig.className);
console.log('Excluded styling:', excludedConfig.className);

const hasGreenForConfirmed = confirmedConfig.className.includes('green');
const hasYellowForPending = pendingConfig.className.includes('yellow');
const hasGrayForExcluded = excludedConfig.className.includes('gray');

addResult(
  'Confirmed commission styling (green)',
  hasGreenForConfirmed,
  'contains green',
  confirmedConfig.className,
  'Confirmed commissions use green styling'
);

addResult(
  'Pending commission styling (yellow)',
  hasYellowForPending,
  'contains yellow',
  pendingConfig.className,
  'Pending commissions use yellow styling'
);

addResult(
  'Excluded commission styling (gray)',
  hasGrayForExcluded,
  'contains gray',
  excludedConfig.className,
  'Excluded commissions use gray styling'
);

// Print summary
console.log('\n' + '='.repeat(80));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(80));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`\nTotal Tests: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  console.log('-'.repeat(80));
  results.filter(r => !r.passed).forEach(result => {
    console.log(`\n${result.test}`);
    console.log(`  Expected: ${JSON.stringify(result.expected)}`);
    console.log(`  Actual: ${JSON.stringify(result.actual)}`);
    console.log(`  Message: ${result.message}`);
  });
}

console.log('\n' + '='.repeat(80));

// Exit with appropriate code
if (failed > 0) {
  console.log('❌ Verification FAILED - Inconsistencies detected');
  process.exit(1);
} else {
  console.log('✅ Verification PASSED - All components are consistent');
  process.exit(0);
}
