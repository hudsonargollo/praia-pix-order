#!/usr/bin/env node

/**
 * Production Testing Script
 * 
 * Automated tests to verify WhatsApp notification system in production
 */

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'http://localhost:8080';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
function logTest(name, passed, message = '') {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} ${name}: ${status}`);
  if (message) {
    console.log(`   ${message}`);
  }
  
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n📋 Test 1: Health Check');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/health`);
    const data = await response.json();
    
    logTest(
      'Health endpoint responds',
      response.ok,
      response.ok ? 'Health endpoint is accessible' : `Status: ${response.status}`
    );
    
    logTest(
      'System status is healthy',
      data.status === 'healthy' || data.status === 'degraded',
      `Status: ${data.status}`
    );
    
    logTest(
      'Functions are operational',
      data.services?.functions?.status === 'operational',
      'Cloudflare Functions are running'
    );
    
    logTest(
      'Environment variables configured',
      data.environment?.hasSupabaseUrl && 
      data.environment?.hasSupabaseKey &&
      data.environment?.hasWhatsAppKey,
      'All required environment variables are set'
    );
    
    return data;
  } catch (error) {
    logTest('Health endpoint responds', false, error.message);
    return null;
  }
}

// Test 2: WhatsApp Connection Status
async function testWhatsAppConnection() {
  console.log('\n📱 Test 2: WhatsApp Connection Status');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/whatsapp/connection?action=status`);
    const data = await response.json();
    
    logTest(
      'WhatsApp endpoint responds',
      response.ok,
      response.ok ? 'Connection endpoint is accessible' : `Status: ${response.status}`
    );
    
    logTest(
      'Connection state is valid',
      ['connected', 'disconnected', 'connecting', 'qr_required'].includes(data.connectionState),
      `State: ${data.connectionState}`
    );
    
    if (data.isConnected) {
      logTest(
        'WhatsApp is connected',
        true,
        `Phone: ${data.phoneNumber || 'Unknown'}`
      );
    } else {
      logTest(
        'WhatsApp connection',
        false,
        `Not connected. State: ${data.connectionState}`
      );
    }
    
    return data;
  } catch (error) {
    logTest('WhatsApp endpoint responds', false, error.message);
    return null;
  }
}

// Test 3: Database Tables
async function testDatabaseTables() {
  console.log('\n🗄️  Test 3: Database Tables');
  
  const tables = [
    'whatsapp_sessions',
    'whatsapp_notifications',
    'notification_templates',
    'whatsapp_error_logs',
    'whatsapp_opt_out'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      logTest(
        `Table ${table} exists`,
        !error,
        error ? error.message : 'Table is accessible'
      );
    } catch (error) {
      logTest(`Table ${table} exists`, false, error.message);
    }
  }
}

// Test 4: Notification Templates
async function testNotificationTemplates() {
  console.log('\n📝 Test 4: Notification Templates');
  
  const requiredTemplates = [
    'payment_confirmed',
    'order_preparing',
    'order_ready'
  ];
  
  try {
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('template_type, is_active')
      .in('template_type', requiredTemplates);
    
    if (error) throw error;
    
    for (const templateType of requiredTemplates) {
      const template = templates?.find(t => t.template_type === templateType);
      logTest(
        `Template ${templateType} exists`,
        !!template,
        template?.is_active ? 'Active' : 'Inactive'
      );
    }
  } catch (error) {
    logTest('Load notification templates', false, error.message);
  }
}

// Test 5: Recent Notifications
async function testRecentNotifications() {
  console.log('\n📊 Test 5: Recent Notifications (24h)');
  
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: notifications, error } = await supabase
      .from('whatsapp_notifications')
      .select('status, created_at, sent_at')
      .gte('created_at', oneDayAgo);
    
    if (error) throw error;
    
    const total = notifications?.length || 0;
    const successful = notifications?.filter(n => n.status === 'sent').length || 0;
    const failed = notifications?.filter(n => n.status === 'failed').length || 0;
    const deliveryRate = total > 0 ? (successful / total) * 100 : 0;
    
    console.log(`   Total notifications: ${total}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Delivery rate: ${deliveryRate.toFixed(1)}%`);
    
    logTest(
      'Delivery rate acceptable',
      deliveryRate >= 90 || total < 10,
      total < 10 ? 'Not enough data' : `${deliveryRate.toFixed(1)}%`
    );
    
    // Calculate average delivery time
    const deliveryTimes = notifications
      ?.filter(n => n.sent_at && n.created_at)
      .map(n => {
        const created = new Date(n.created_at).getTime();
        const sent = new Date(n.sent_at).getTime();
        return (sent - created) / 1000;
      }) || [];
    
    if (deliveryTimes.length > 0) {
      const avgTime = deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length;
      console.log(`   Average delivery time: ${avgTime.toFixed(2)}s`);
      
      logTest(
        'Delivery time acceptable',
        avgTime < 30,
        `${avgTime.toFixed(2)}s average`
      );
    }
  } catch (error) {
    logTest('Load recent notifications', false, error.message);
  }
}

// Test 6: Error Logs
async function testErrorLogs() {
  console.log('\n⚠️  Test 6: Error Logs (24h)');
  
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: errors, error } = await supabase
      .from('whatsapp_error_logs')
      .select('error_type, created_at')
      .gte('created_at', oneDayAgo);
    
    if (error) throw error;
    
    const errorCount = errors?.length || 0;
    console.log(`   Total errors: ${errorCount}`);
    
    if (errorCount > 0) {
      // Group by error type
      const errorTypes = {};
      errors.forEach(e => {
        errorTypes[e.error_type] = (errorTypes[e.error_type] || 0) + 1;
      });
      
      console.log('   Error breakdown:');
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`     - ${type}: ${count}`);
      });
    }
    
    logTest(
      'Error rate acceptable',
      errorCount < 50,
      errorCount < 50 ? 'Low error rate' : 'High error rate detected'
    );
  } catch (error) {
    logTest('Load error logs', false, error.message);
  }
}

// Test 7: Session Health
async function testSessionHealth() {
  console.log('\n🔐 Test 7: Session Health');
  
  try {
    const { data: sessions, error } = await supabase
      .from('whatsapp_sessions')
      .select('session_id, phone_number, is_active, updated_at')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const activeCount = sessions?.length || 0;
    console.log(`   Active sessions: ${activeCount}`);
    
    logTest(
      'Active session exists',
      activeCount > 0,
      activeCount > 0 ? `${activeCount} active session(s)` : 'No active sessions'
    );
    
    if (sessions && sessions.length > 0) {
      const session = sessions[0];
      const lastUpdate = new Date(session.updated_at);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      console.log(`   Last updated: ${hoursSinceUpdate.toFixed(1)} hours ago`);
      console.log(`   Phone: ${session.phone_number || 'Not set'}`);
      
      logTest(
        'Session is recent',
        hoursSinceUpdate < 24,
        `Updated ${hoursSinceUpdate.toFixed(1)} hours ago`
      );
    }
  } catch (error) {
    logTest('Load session data', false, error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Production Tests');
  console.log(`   Target: ${PRODUCTION_URL}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log('');
  
  await testHealthCheck();
  await sleep(1000);
  
  await testWhatsAppConnection();
  await sleep(1000);
  
  await testDatabaseTables();
  await sleep(1000);
  
  await testNotificationTemplates();
  await sleep(1000);
  
  await testRecentNotifications();
  await sleep(1000);
  
  await testErrorLogs();
  await sleep(1000);
  
  await testSessionHealth();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`Total tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('');
  
  if (results.failed > 0) {
    console.log('Failed tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.message}`);
      });
    console.log('');
  }
  
  const successRate = (results.passed / (results.passed + results.failed)) * 100;
  console.log(`Success rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 90) {
    console.log('\n🎉 Production tests passed! System is ready.');
    process.exit(0);
  } else if (successRate >= 70) {
    console.log('\n⚠️  Some tests failed. Review issues before proceeding.');
    process.exit(1);
  } else {
    console.log('\n❌ Critical failures detected. Do not proceed to production.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test runner failed:', error);
  process.exit(1);
});
