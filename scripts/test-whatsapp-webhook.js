#!/usr/bin/env node

/**
 * WhatsApp Webhook Test Script
 * Tests the webhook endpoint with various scenarios
 * 
 * Usage:
 *   node scripts/test-whatsapp-webhook.js
 *   WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook node scripts/test-whatsapp-webhook.js
 */

import https from 'https';
import http from 'http';

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://coco-loko-acaiteria.pages.dev/api/whatsapp/webhook';
const TEST_PHONE = process.env.TEST_PHONE || '5573999988888';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

function makeGetRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  log('blue', '========================================');
  log('blue', 'WhatsApp Webhook Test Suite');
  log('blue', '========================================');
  console.log('');
  log('yellow', `Webhook URL: ${WEBHOOK_URL}`);
  log('yellow', `Test Phone: ${TEST_PHONE}`);
  console.log('');

  let passedTests = 0;
  let totalTests = 6;

  // Test 1: Valid inbound message
  try {
    log('blue', 'Test 1: Valid Inbound Message');
    console.log('Sending valid inbound message...');
    
    const payload = JSON.stringify({
      event: 'messages.upsert',
      instance: 'cocooo',
      data: {
        key: {
          id: `test_${Date.now()}`,
          remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
          fromMe: false,
        },
        message: {
          conversation: 'Test message: Valid inbound message',
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    });

    const response = await makeRequest(WEBHOOK_URL, payload);
    
    if (response.statusCode === 200) {
      log('green', `✓ Test 1 Passed - HTTP ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
      passedTests++;
    } else {
      log('red', `✗ Test 1 Failed - HTTP ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
    }
  } catch (error) {
    log('red', `✗ Test 1 Failed - ${error.message}`);
  }
  console.log('');

  // Test 2: Outbound message (should be ignored)
  try {
    log('blue', 'Test 2: Outbound Message (Should Ignore)');
    console.log('Sending outbound message (fromMe: true)...');
    
    const payload = JSON.stringify({
      event: 'messages.upsert',
      instance: 'cocooo',
      data: {
        key: {
          id: `test_${Date.now()}`,
          remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
          fromMe: true,
        },
        message: {
          conversation: 'Test message: Outbound (should ignore)',
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    });

    const response = await makeRequest(WEBHOOK_URL, payload);
    
    if (response.statusCode === 200) {
      log('green', `✓ Test 2 Passed - HTTP ${response.statusCode} (Ignored as expected)`);
      console.log(`  Response: ${response.body}`);
      passedTests++;
    } else {
      log('red', `✗ Test 2 Failed - HTTP ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
    }
  } catch (error) {
    log('red', `✗ Test 2 Failed - ${error.message}`);
  }
  console.log('');

  // Test 3: Extended text message format
  try {
    log('blue', 'Test 3: Extended Text Message Format');
    console.log('Sending message with extendedTextMessage...');
    
    const payload = JSON.stringify({
      event: 'messages.upsert',
      instance: 'cocooo',
      data: {
        key: {
          id: `test_${Date.now()}`,
          remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
          fromMe: false,
        },
        message: {
          extendedTextMessage: {
            text: 'Test message: Extended text format',
          },
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    });

    const response = await makeRequest(WEBHOOK_URL, payload);
    
    if (response.statusCode === 200) {
      log('green', `✓ Test 3 Passed - HTTP ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
      passedTests++;
    } else {
      log('red', `✗ Test 3 Failed - HTTP ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
    }
  } catch (error) {
    log('red', `✗ Test 3 Failed - ${error.message}`);
  }
  console.log('');

  // Test 4: Invalid payload (missing required fields)
  try {
    log('blue', 'Test 4: Invalid Payload (Should Return 400)');
    console.log('Sending invalid payload...');
    
    const payload = JSON.stringify({
      event: 'messages.upsert',
      data: {},
    });

    const response = await makeRequest(WEBHOOK_URL, payload);
    
    if (response.statusCode === 400) {
      log('green', `✓ Test 4 Passed - HTTP ${response.statusCode} (Rejected as expected)`);
      console.log(`  Response: ${response.body}`);
      passedTests++;
    } else {
      log('yellow', `⚠ Test 4 Warning - Expected 400, got HTTP ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
    }
  } catch (error) {
    log('red', `✗ Test 4 Failed - ${error.message}`);
  }
  console.log('');

  // Test 5: Non-message event (should be ignored)
  try {
    log('blue', 'Test 5: Non-Message Event (Should Ignore)');
    console.log('Sending non-message event...');
    
    const payload = JSON.stringify({
      event: 'connection.update',
      instance: 'cocooo',
      data: {
        state: 'open',
      },
    });

    const response = await makeRequest(WEBHOOK_URL, payload);
    
    if (response.statusCode === 200) {
      log('green', `✓ Test 5 Passed - HTTP ${response.statusCode} (Ignored as expected)`);
      console.log(`  Response: ${response.body}`);
      passedTests++;
    } else {
      log('red', `✗ Test 5 Failed - HTTP ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
    }
  } catch (error) {
    log('red', `✗ Test 5 Failed - ${error.message}`);
  }
  console.log('');

  // Test 6: GET request (should return 405)
  try {
    log('blue', 'Test 6: GET Request (Should Return 405)');
    console.log('Sending GET request...');
    
    const response = await makeGetRequest(WEBHOOK_URL);
    
    if (response.statusCode === 405) {
      log('green', `✓ Test 6 Passed - HTTP ${response.statusCode} (Method not allowed)`);
      console.log(`  Response: ${response.body}`);
      passedTests++;
    } else {
      log('yellow', `⚠ Test 6 Warning - Expected 405, got HTTP ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
    }
  } catch (error) {
    log('red', `✗ Test 6 Failed - ${error.message}`);
  }
  console.log('');

  // Summary
  log('blue', '========================================');
  log('blue', 'Test Suite Complete');
  log('blue', '========================================');
  console.log('');
  log('yellow', `Results: ${passedTests}/${totalTests} tests passed`);
  console.log('');
  log('yellow', 'Next Steps:');
  console.log('1. Check Cloudflare Functions logs for detailed webhook activity');
  console.log('2. Verify messages appear in Supabase whatsapp_chat_messages table');
  console.log('3. Test with real WhatsApp messages from customer phone');
  console.log('4. Verify messages appear in admin UI with audio notification');
  console.log('');
  log('yellow', 'Monitoring Commands:');
  console.log('  wrangler tail --format pretty | grep webhook');
  console.log('  # Or check Cloudflare Dashboard > Workers & Pages > Logs');
  console.log('');

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  log('red', `Fatal error: ${error.message}`);
  process.exit(1);
});
