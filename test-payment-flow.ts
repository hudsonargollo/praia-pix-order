/**
 * Test Script for Payment Confirmation Flow
 * 
 * This script helps test the payment confirmation and notification flow
 * Run with: npx tsx test-payment-flow.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Check database infrastructure
 */
async function testDatabaseInfrastructure(): Promise<TestResult> {
  console.log('\n🔍 Test 1: Checking database infrastructure...');
  
  try {
    // Check if payment_confirmation_log table exists
    const { data: logData, error: logError } = await supabase
      .from('payment_confirmation_log')
      .select('id')
      .limit(1);
    
    if (logError && logError.code !== 'PGRST116') {
      throw new Error(`payment_confirmation_log table error: ${logError.message}`);
    }
    
    // Check if whatsapp_notifications has dedupe_key column
    const { data: notifData, error: notifError } = await supabase
      .from('whatsapp_notifications')
      .select('id, dedupe_key')
      .limit(1);
    
    if (notifError && notifError.code !== 'PGRST116') {
      throw new Error(`whatsapp_notifications table error: ${notifError.message}`);
    }
    
    return {
      test: 'Database Infrastructure',
      passed: true,
      message: '✅ All required tables and columns exist',
      details: {
        payment_confirmation_log: 'exists',
        whatsapp_notifications_dedupe_key: 'exists',
      },
    };
  } catch (error) {
    return {
      test: 'Database Infrastructure',
      passed: false,
      message: `❌ Database infrastructure check failed: ${error}`,
    };
  }
}

/**
 * Test 2: Check for duplicate notifications
 */
async function testDuplicateNotifications(): Promise<TestResult> {
  console.log('\n🔍 Test 2: Checking for duplicate notifications...');
  
  try {
    // Query for orders with multiple notifications in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .select('order_id, notification_type, status, created_at')
      .in('notification_type', ['payment_confirmed', 'order_created'])
      .eq('status', 'sent')
      .gte('created_at', oneHourAgo);
    
    if (error) {
      throw error;
    }
    
    // Group by order_id and count
    const orderCounts = new Map<string, number>();
    data?.forEach(notif => {
      const count = orderCounts.get(notif.order_id) || 0;
      orderCounts.set(notif.order_id, count + 1);
    });
    
    const duplicates = Array.from(orderCounts.entries()).filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      return {
        test: 'Duplicate Notifications',
        passed: false,
        message: `❌ Found ${duplicates.length} orders with duplicate notifications`,
        details: {
          duplicates: duplicates.map(([orderId, count]) => ({ orderId, count })),
        },
      };
    }
    
    return {
      test: 'Duplicate Notifications',
      passed: true,
      message: `✅ No duplicate notifications found (checked ${data?.length || 0} notifications)`,
    };
  } catch (error) {
    return {
      test: 'Duplicate Notifications',
      passed: false,
      message: `❌ Duplicate notification check failed: ${error}`,
    };
  }
}

/**
 * Test 3: Check payment confirmation logs
 */
async function testPaymentConfirmationLogs(): Promise<TestResult> {
  console.log('\n🔍 Test 3: Checking payment confirmation logs...');
  
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('payment_confirmation_log')
      .select('id, order_id, source, notification_sent, created_at')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    const totalConfirmations = data?.length || 0;
    const successfulNotifications = data?.filter(log => log.notification_sent).length || 0;
    const sources = new Set(data?.map(log => log.source) || []);
    
    return {
      test: 'Payment Confirmation Logs',
      passed: true,
      message: `✅ Found ${totalConfirmations} payment confirmations in the last hour`,
      details: {
        total: totalConfirmations,
        successful_notifications: successfulNotifications,
        sources: Array.from(sources),
      },
    };
  } catch (error) {
    return {
      test: 'Payment Confirmation Logs',
      passed: false,
      message: `❌ Payment confirmation log check failed: ${error}`,
    };
  }
}

/**
 * Test 4: Check orders in preparation
 */
async function testOrdersInPreparation(): Promise<TestResult> {
  console.log('\n🔍 Test 4: Checking orders in preparation...');
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, payment_confirmed_at')
      .eq('status', 'in_preparation')
      .not('payment_confirmed_at', 'is', null)
      .order('payment_confirmed_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    const ordersCount = data?.length || 0;
    
    return {
      test: 'Orders in Preparation',
      passed: true,
      message: `✅ Found ${ordersCount} orders in preparation with confirmed payment`,
      details: {
        count: ordersCount,
        orders: data?.map(o => ({
          order_number: o.order_number,
          payment_confirmed_at: o.payment_confirmed_at,
        })),
      },
    };
  } catch (error) {
    return {
      test: 'Orders in Preparation',
      passed: false,
      message: `❌ Orders in preparation check failed: ${error}`,
    };
  }
}

/**
 * Test 5: Check recent errors
 */
async function testRecentErrors(): Promise<TestResult> {
  console.log('\n🔍 Test 5: Checking recent errors...');
  
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('whatsapp_error_logs')
      .select('id, error_type, error_message, operation, created_at')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    const errorCount = data?.length || 0;
    
    if (errorCount > 0) {
      return {
        test: 'Recent Errors',
        passed: false,
        message: `⚠️ Found ${errorCount} errors in the last hour`,
        details: {
          count: errorCount,
          errors: data?.slice(0, 5).map(e => ({
            type: e.error_type,
            message: e.error_message,
            operation: e.operation,
            created_at: e.created_at,
          })),
        },
      };
    }
    
    return {
      test: 'Recent Errors',
      passed: true,
      message: '✅ No errors found in the last hour',
    };
  } catch (error) {
    return {
      test: 'Recent Errors',
      passed: false,
      message: `❌ Error check failed: ${error}`,
    };
  }
}

/**
 * Test 6: Check notification success rate
 */
async function testNotificationSuccessRate(): Promise<TestResult> {
  console.log('\n🔍 Test 6: Checking notification success rate...');
  
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('whatsapp_notifications')
      .select('id, status, notification_type')
      .in('notification_type', ['payment_confirmed', 'order_created'])
      .gte('created_at', oneHourAgo);
    
    if (error) {
      throw error;
    }
    
    const total = data?.length || 0;
    const sent = data?.filter(n => n.status === 'sent').length || 0;
    const pending = data?.filter(n => n.status === 'pending').length || 0;
    const failed = data?.filter(n => n.status === 'failed').length || 0;
    
    const successRate = total > 0 ? ((sent / total) * 100).toFixed(2) : '0';
    
    return {
      test: 'Notification Success Rate',
      passed: parseFloat(successRate) >= 90, // 90% success rate threshold
      message: `${parseFloat(successRate) >= 90 ? '✅' : '⚠️'} Notification success rate: ${successRate}%`,
      details: {
        total,
        sent,
        pending,
        failed,
        success_rate: `${successRate}%`,
      },
    };
  } catch (error) {
    return {
      test: 'Notification Success Rate',
      passed: false,
      message: `❌ Notification success rate check failed: ${error}`,
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Payment Flow Tests...\n');
  console.log('=' .repeat(60));
  
  // Run all tests
  results.push(await testDatabaseInfrastructure());
  results.push(await testDuplicateNotifications());
  results.push(await testPaymentConfirmationLogs());
  results.push(await testOrdersInPreparation());
  results.push(await testRecentErrors());
  results.push(await testNotificationSuccessRate());
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
  });
  
  console.log('='.repeat(60));
  console.log(`\n📈 Results: ${passed} passed, ${failed} failed out of ${results.length} tests\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review the results above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
});
