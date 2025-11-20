#!/usr/bin/env node

/**
 * Automated E2E Test Script for WhatsApp Conversational UI
 * 
 * This script tests the webhook endpoint and database integration
 * without requiring actual WhatsApp messages.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8788/api/whatsapp/webhook';

// Test configuration
const TEST_PHONE = '5573999988888';
const TEST_PHONE_FORMATTED = '(55) 73 99998-8888';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`Testing: ${testName}`, 'blue');
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

/**
 * Create a test order
 */
async function createTestOrder(phone, status = 'pending') {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_phone: phone,
      status: status,
      total_amount: 1000,
      payment_method: 'pix',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test order: ${error.message}`);
  }

  return data;
}

/**
 * Delete test data
 */
async function cleanupTestData(phone) {
  // Delete messages
  await supabase
    .from('whatsapp_chat_messages')
    .delete()
    .eq('phone_number', phone.replace(/\D/g, ''));

  // Delete orders
  await supabase
    .from('orders')
    .delete()
    .eq('customer_phone', phone.replace(/\D/g, ''));
}

/**
 * Send webhook request
 */
async function sendWebhookRequest(payload) {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { status: response.status, data };
}

/**
 * Create webhook payload
 */
function createWebhookPayload(phone, message, fromMe = false) {
  return {
    event: 'messages.upsert',
    instance: 'test-instance',
    data: {
      key: {
        id: `msg-${Date.now()}`,
        remoteJid: `${phone}@s.whatsapp.net`,
        fromMe: fromMe,
      },
      message: {
        conversation: message,
      },
      messageTimestamp: Date.now(),
    },
  };
}

/**
 * Test 1: Inbound message with active order
 */
async function testInboundMessageWithActiveOrder() {
  logTest('Inbound Message with Active Order');

  try {
    // Create active order
    const order = await createTestOrder(TEST_PHONE, 'pending');
    logSuccess(`Created test order: ${order.id}`);

    // Send webhook
    const payload = createWebhookPayload(TEST_PHONE, 'Test message from customer');
    const { status, data } = await sendWebhookRequest(payload);

    // Verify response
    if (status === 200 && data.success) {
      logSuccess('Webhook returned success');
    } else {
      logError(`Webhook failed: ${JSON.stringify(data)}`);
      results.failed++;
      return;
    }

    // Verify message in database
    const { data: messages, error } = await supabase
      .from('whatsapp_chat_messages')
      .select('*')
      .eq('order_id', order.id)
      .eq('direction', 'inbound');

    if (error) {
      logError(`Database query failed: ${error.message}`);
      results.failed++;
      return;
    }

    if (messages && messages.length > 0) {
      logSuccess(`Message stored in database: ${messages[0].id}`);
      logSuccess(`Message content: "${messages[0].content}"`);
      results.passed++;
    } else {
      logError('Message not found in database');
      results.failed++;
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    results.failed++;
  }
}

/**
 * Test 2: No active orders scenario
 */
async function testNoActiveOrders() {
  logTest('No Active Orders Scenario');

  try {
    const testPhone = '5573999999999';
    
    // Ensure no active orders exist
    await cleanupTestData(testPhone);

    // Send webhook
    const payload = createWebhookPayload(testPhone, 'Message without order');
    const { status, data } = await sendWebhookRequest(payload);

    // Verify response
    if (status === 200 && data.message && data.message.includes('No active orders')) {
      logSuccess('Webhook correctly ignored message (no active orders)');
    } else {
      logError(`Unexpected response: ${JSON.stringify(data)}`);
      results.failed++;
      return;
    }

    // Verify message NOT in database
    const { data: messages } = await supabase
      .from('whatsapp_chat_messages')
      .select('*')
      .eq('phone_number', testPhone.replace(/\D/g, ''))
      .eq('content', 'Message without order');

    if (!messages || messages.length === 0) {
      logSuccess('Message correctly not stored in database');
      results.passed++;
    } else {
      logError('Message was incorrectly stored in database');
      results.failed++;
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    results.failed++;
  }
}

/**
 * Test 3: Completed order scenario
 */
async function testCompletedOrder() {
  logTest('Completed Order Scenario');

  try {
    // Create completed order
    const order = await createTestOrder(TEST_PHONE, 'completed');
    logSuccess(`Created completed order: ${order.id}`);

    // Send webhook
    const payload = createWebhookPayload(TEST_PHONE, 'Message to completed order');
    const { status, data } = await sendWebhookRequest(payload);

    // Verify response
    if (status === 200 && data.message && data.message.includes('No active orders')) {
      logSuccess('Webhook correctly ignored message (order completed)');
    } else {
      logError(`Unexpected response: ${JSON.stringify(data)}`);
      results.failed++;
      return;
    }

    // Verify message NOT in database
    const { data: messages } = await supabase
      .from('whatsapp_chat_messages')
      .select('*')
      .eq('order_id', order.id)
      .eq('content', 'Message to completed order');

    if (!messages || messages.length === 0) {
      logSuccess('Message correctly not stored for completed order');
      results.passed++;
    } else {
      logError('Message was incorrectly stored for completed order');
      results.failed++;
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    results.failed++;
  }
}

/**
 * Test 4: Multiple active orders (most recent selected)
 */
async function testMultipleActiveOrders() {
  logTest('Multiple Active Orders - Most Recent Selected');

  try {
    // Create two active orders with delay
    const olderOrder = await createTestOrder(TEST_PHONE, 'pending');
    logSuccess(`Created older order: ${olderOrder.id}`);

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newerOrder = await createTestOrder(TEST_PHONE, 'pending');
    logSuccess(`Created newer order: ${newerOrder.id}`);

    // Send webhook
    const payload = createWebhookPayload(TEST_PHONE, 'Which order?');
    const { status, data } = await sendWebhookRequest(payload);

    // Verify response
    if (status === 200 && data.success) {
      logSuccess('Webhook processed message');
    } else {
      logError(`Webhook failed: ${JSON.stringify(data)}`);
      results.failed++;
      return;
    }

    // Verify message associated with newer order
    const { data: messages } = await supabase
      .from('whatsapp_chat_messages')
      .select('*')
      .eq('content', 'Which order?')
      .eq('phone_number', TEST_PHONE.replace(/\D/g, ''));

    if (messages && messages.length > 0) {
      const message = messages[0];
      if (message.order_id === newerOrder.id) {
        logSuccess(`Message correctly associated with newer order: ${newerOrder.id}`);
        results.passed++;
      } else {
        logError(`Message associated with wrong order: ${message.order_id}`);
        logError(`Expected: ${newerOrder.id}, Got: ${message.order_id}`);
        results.failed++;
      }
    } else {
      logError('Message not found in database');
      results.failed++;
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    results.failed++;
  }
}

/**
 * Test 5: Phone number normalization
 */
async function testPhoneNormalization() {
  logTest('Phone Number Normalization');

  try {
    // Create order with normalized phone
    const order = await createTestOrder(TEST_PHONE, 'pending');
    logSuccess(`Created order with phone: ${TEST_PHONE}`);

    // Test various phone formats
    const formats = [
      TEST_PHONE,
      TEST_PHONE_FORMATTED,
      `+${TEST_PHONE}`,
      TEST_PHONE.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '$1 $2 $3-$4'),
    ];

    let allPassed = true;

    for (const format of formats) {
      const payload = createWebhookPayload(format, `Test format: ${format}`);
      const { status, data } = await sendWebhookRequest(payload);

      if (status === 200 && data.success) {
        logSuccess(`Format "${format}" normalized correctly`);
      } else {
        logError(`Format "${format}" failed: ${JSON.stringify(data)}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    results.failed++;
  }
}

/**
 * Test 6: Outbound message ignored
 */
async function testOutboundMessageIgnored() {
  logTest('Outbound Message Ignored (fromMe: true)');

  try {
    // Create active order
    const order = await createTestOrder(TEST_PHONE, 'pending');

    // Send webhook with fromMe: true
    const payload = createWebhookPayload(TEST_PHONE, 'Staff message', true);
    const { status, data } = await sendWebhookRequest(payload);

    // Verify response
    if (status === 200 && data.message && data.message.includes('Outbound message ignored')) {
      logSuccess('Webhook correctly ignored outbound message');
      results.passed++;
    } else {
      logError(`Unexpected response: ${JSON.stringify(data)}`);
      results.failed++;
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    results.failed++;
  }
}

/**
 * Test 7: Invalid payload handling
 */
async function testInvalidPayload() {
  logTest('Invalid Payload Handling');

  try {
    // Send invalid payload (missing remoteJid)
    const invalidPayload = {
      event: 'messages.upsert',
      data: {
        key: {},
        message: {
          conversation: 'Test',
        },
      },
    };

    const { status, data } = await sendWebhookRequest(invalidPayload);

    if (status === 400 && data.error) {
      logSuccess('Webhook correctly rejected invalid payload');
      results.passed++;
    } else {
      logError(`Expected 400 error, got: ${status}`);
      results.failed++;
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    results.failed++;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║   WhatsApp Conversational UI - E2E Test Suite        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  log(`\nWebhook URL: ${WEBHOOK_URL}`, 'yellow');
  log(`Supabase URL: ${SUPABASE_URL}`, 'yellow');

  // Check prerequisites
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError('Missing Supabase credentials. Please set environment variables.');
    process.exit(1);
  }

  try {
    // Cleanup before tests
    log('\nCleaning up test data...', 'yellow');
    await cleanupTestData(TEST_PHONE);
    await cleanupTestData('5573999999999');

    // Run tests
    await testInboundMessageWithActiveOrder();
    await testNoActiveOrders();
    await testCompletedOrder();
    await testMultipleActiveOrders();
    await testPhoneNormalization();
    await testOutboundMessageIgnored();
    await testInvalidPayload();

    // Cleanup after tests
    log('\nCleaning up test data...', 'yellow');
    await cleanupTestData(TEST_PHONE);
    await cleanupTestData('5573999999999');

    // Print summary
    console.log('\n' + '═'.repeat(60));
    log('Test Summary', 'cyan');
    console.log('═'.repeat(60));
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
      logError(`Failed: ${results.failed}`);
    }
    if (results.warnings > 0) {
      logWarning(`Warnings: ${results.warnings}`);
    }
    console.log('═'.repeat(60) + '\n');

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
