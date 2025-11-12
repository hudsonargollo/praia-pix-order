/**
 * Test script to verify waiter orders appear in admin panel
 * Run with: npx tsx test-waiter-orders-admin-panel.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWaiterOrdersTracking() {
  console.log('🔍 Testing Waiter Orders Tracking in Admin Panel\n');
  console.log('='.repeat(60));

  // Step 1: Check if required columns exist
  console.log('\n📋 Step 1: Checking database schema...');
  const { data: columns, error: columnsError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (columnsError) {
    console.error('❌ Error querying orders:', columnsError);
    return;
  }

  const sampleOrder = columns?.[0];
  const hasWaiterId = sampleOrder && 'waiter_id' in sampleOrder;
  const hasCommission = sampleOrder && 'commission_amount' in sampleOrder;
  const hasCreatedByWaiter = sampleOrder && 'created_by_waiter' in sampleOrder;
  const hasOrderNotes = sampleOrder && 'order_notes' in sampleOrder;

  console.log(`  ${hasWaiterId ? '✅' : '❌'} waiter_id column`);
  console.log(`  ${hasCommission ? '✅' : '❌'} commission_amount column`);
  console.log(`  ${hasCreatedByWaiter ? '✅' : '❌'} created_by_waiter column`);
  console.log(`  ${hasOrderNotes ? '✅' : '❌'} order_notes column`);

  // Step 2: Check for waiters in the system
  console.log('\n👥 Step 2: Checking for waiters...');
  const { data: waiters, error: waitersError } = await supabase
    .from('auth.users')
    .select('id, email, raw_user_meta_data')
    .eq('raw_user_meta_data->>role', 'waiter');

  if (waitersError) {
    console.log('  ⚠️  Cannot query auth.users directly, trying edge function...');
    
    // Try using the list-waiters edge function
    const { data: waitersData, error: edgeFunctionError } = await supabase.functions.invoke('list-waiters');
    
    if (edgeFunctionError) {
      console.error('  ❌ Error fetching waiters:', edgeFunctionError);
    } else {
      const waitersList = waitersData?.waiters || [];
      console.log(`  ✅ Found ${waitersList.length} waiter(s)`);
      waitersList.forEach((w: any) => {
        console.log(`     - ${w.full_name} (${w.email})`);
      });
    }
  } else {
    console.log(`  ✅ Found ${waiters?.length || 0} waiter(s)`);
    waiters?.forEach(w => {
      const fullName = w.raw_user_meta_data?.full_name || 'Unknown';
      console.log(`     - ${fullName} (${w.email})`);
    });
  }

  // Step 3: Check for orders with waiter_id
  console.log('\n📦 Step 3: Checking for waiter orders...');
  const { data: waiterOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, waiter_id, total_amount, commission_amount, status, created_at')
    .not('waiter_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (ordersError) {
    console.error('  ❌ Error querying waiter orders:', ordersError);
  } else {
    console.log(`  ✅ Found ${waiterOrders?.length || 0} order(s) with waiter_id`);
    
    if (waiterOrders && waiterOrders.length > 0) {
      console.log('\n  Recent waiter orders:');
      waiterOrders.forEach(order => {
        const commission = order.commission_amount || 0;
        const commissionStatus = commission > 0 ? '✅' : '⚠️';
        console.log(`     ${commissionStatus} Order #${order.order_number}: ${order.customer_name}`);
        console.log(`        Total: R$ ${Number(order.total_amount).toFixed(2)} | Commission: R$ ${Number(commission).toFixed(2)}`);
        console.log(`        Status: ${order.status} | Waiter ID: ${order.waiter_id?.substring(0, 8)}...`);
      });
    }
  }

  // Step 4: Check order statistics by waiter
  console.log('\n📊 Step 4: Calculating waiter statistics...');
  const { data: allOrders, error: allOrdersError } = await supabase
    .from('orders')
    .select('waiter_id, total_amount, commission_amount, status')
    .not('waiter_id', 'is', null);

  if (allOrdersError) {
    console.error('  ❌ Error querying all orders:', allOrdersError);
  } else {
    const waiterStats = new Map();
    
    allOrders?.forEach(order => {
      if (!order.waiter_id) return;
      
      const stats = waiterStats.get(order.waiter_id) || {
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
        completedOrders: 0
      };
      
      stats.totalOrders++;
      stats.totalSales += Number(order.total_amount);
      stats.totalCommission += Number(order.commission_amount || 0);
      if (order.status === 'completed') stats.completedOrders++;
      
      waiterStats.set(order.waiter_id, stats);
    });

    console.log(`  ✅ Statistics for ${waiterStats.size} waiter(s):\n`);
    waiterStats.forEach((stats, waiterId) => {
      console.log(`     Waiter ID: ${waiterId.substring(0, 8)}...`);
      console.log(`       - Total Orders: ${stats.totalOrders}`);
      console.log(`       - Completed Orders: ${stats.completedOrders}`);
      console.log(`       - Total Sales: R$ ${stats.totalSales.toFixed(2)}`);
      console.log(`       - Total Commission: R$ ${stats.totalCommission.toFixed(2)}`);
      console.log(`       - Avg Order Value: R$ ${(stats.totalSales / stats.totalOrders).toFixed(2)}`);
      console.log('');
    });
  }

  // Step 5: Check for orders without commission
  console.log('\n⚠️  Step 5: Checking for orders missing commission...');
  const { data: ordersWithoutCommission, error: noCommissionError } = await supabase
    .from('orders')
    .select('id, order_number, waiter_id, total_amount, commission_amount')
    .not('waiter_id', 'is', null)
    .or('commission_amount.is.null,commission_amount.eq.0');

  if (noCommissionError) {
    console.error('  ❌ Error querying orders:', noCommissionError);
  } else {
    if (ordersWithoutCommission && ordersWithoutCommission.length > 0) {
      console.log(`  ⚠️  Found ${ordersWithoutCommission.length} waiter order(s) without commission`);
      console.log('     These orders need to be updated. Run fix-waiter-orders-tracking.sql');
    } else {
      console.log('  ✅ All waiter orders have commission calculated');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📝 SUMMARY\n');
  
  const issues = [];
  if (!hasWaiterId) issues.push('Missing waiter_id column');
  if (!hasCommission) issues.push('Missing commission_amount column');
  if (!hasCreatedByWaiter) issues.push('Missing created_by_waiter column');
  if (!waiterOrders || waiterOrders.length === 0) issues.push('No waiter orders found');
  if (ordersWithoutCommission && ordersWithoutCommission.length > 0) {
    issues.push(`${ordersWithoutCommission.length} orders missing commission`);
  }

  if (issues.length === 0) {
    console.log('✅ All checks passed! Waiter orders should appear in admin panel.');
    console.log('\nNext steps:');
    console.log('1. Log in to admin panel');
    console.log('2. Navigate to Garçons > Relatórios tab');
    console.log('3. Select a waiter from the dropdown');
    console.log('4. Verify orders and commission amounts are displayed');
  } else {
    console.log('❌ Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('\nRecommended actions:');
    console.log('1. Run: fix-waiter-orders-tracking.sql in Supabase SQL Editor');
    console.log('2. Verify database migrations are applied');
    console.log('3. Re-run this test script');
  }
  
  console.log('\n' + '='.repeat(60));
}

testWaiterOrdersTracking().catch(console.error);
