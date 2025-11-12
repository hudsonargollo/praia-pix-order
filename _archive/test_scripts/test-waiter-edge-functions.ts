/**
 * Automated Test Script for Waiter Management Edge Functions
 * 
 * This script tests the three Edge Functions:
 * - list-waiters
 * - create-waiter
 * - delete-waiter
 * 
 * Run with: npx tsx test-waiter-edge-functions.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, message: 'Passed', duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    results.push({ name, passed: false, message: error.message, duration });
    console.error(`❌ ${name} (${duration}ms): ${error.message}`);
  }
}

async function loginAsAdmin(): Promise<string> {
  console.log('\n🔐 Logging in as admin...');
  
  // Try to get existing session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    console.log('✅ Using existing session');
    return session.access_token;
  }
  
  // Need to login - you'll need to provide admin credentials
  console.log('⚠️  No active session found');
  console.log('Please login manually first or set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
  throw new Error('No active admin session');
}

async function testListWaiters(token: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('list-waiters', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }
  
  if (!data || !Array.isArray(data.waiters)) {
    throw new Error('Invalid response format');
  }
  
  console.log(`   Found ${data.waiters.length} waiters`);
}

async function testCreateWaiter(token: string): Promise<string> {
  const testEmail = `test.waiter.${Date.now()}@example.com`;
  const testData = {
    email: testEmail,
    password: 'test123456',
    full_name: 'Test Waiter Automated'
  };
  
  const { data, error } = await supabase.functions.invoke('create-waiter', {
    body: testData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }
  
  if (!data || !data.userId) {
    throw new Error('No userId returned');
  }
  
  console.log(`   Created waiter with ID: ${data.userId}`);
  return data.userId;
}

async function testCreateDuplicateEmail(token: string, existingEmail: string): Promise<void> {
  const testData = {
    email: existingEmail,
    password: 'test123456',
    full_name: 'Duplicate Test'
  };
  
  const { data, error } = await supabase.functions.invoke('create-waiter', {
    body: testData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // We expect this to fail
  if (!error) {
    throw new Error('Expected duplicate email error but got success');
  }
  
  if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
    throw new Error(`Expected duplicate error but got: ${error.message}`);
  }
  
  console.log(`   Correctly rejected duplicate email`);
}

async function testCreateInvalidEmail(token: string): Promise<void> {
  const testData = {
    email: 'invalid-email',
    password: 'test123456',
    full_name: 'Invalid Email Test'
  };
  
  const { data, error } = await supabase.functions.invoke('create-waiter', {
    body: testData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // We expect this to fail
  if (!error) {
    throw new Error('Expected invalid email error but got success');
  }
  
  console.log(`   Correctly rejected invalid email`);
}

async function testCreateMissingFields(token: string): Promise<void> {
  const testData = {
    email: 'test@example.com',
    // Missing password and full_name
  };
  
  const { data, error } = await supabase.functions.invoke('create-waiter', {
    body: testData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // We expect this to fail
  if (!error) {
    throw new Error('Expected missing fields error but got success');
  }
  
  console.log(`   Correctly rejected missing fields`);
}

async function testDeleteWaiter(token: string, waiterId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-waiter', {
    body: { waiterId },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }
  
  console.log(`   Deleted waiter with ID: ${waiterId}`);
}

async function testDeleteInvalidId(token: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-waiter', {
    body: { waiterId: 'invalid-uuid-12345' },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // We expect this to fail
  if (!error) {
    throw new Error('Expected invalid ID error but got success');
  }
  
  console.log(`   Correctly rejected invalid waiter ID`);
}

async function main() {
  console.log('🧪 Starting Waiter Management Edge Functions Tests\n');
  console.log('=' .repeat(60));
  
  try {
    // Login as admin
    const token = await loginAsAdmin();
    
    // Test 1: List waiters
    await runTest('Test 1: List Waiters', async () => {
      await testListWaiters(token);
    });
    
    // Test 2: Create waiter with valid data
    let createdWaiterId: string = '';
    let createdEmail: string = '';
    await runTest('Test 2: Create Waiter (Valid Data)', async () => {
      createdEmail = `test.waiter.${Date.now()}@example.com`;
      createdWaiterId = await testCreateWaiter(token);
    });
    
    // Test 3: Create waiter with duplicate email
    if (createdEmail) {
      await runTest('Test 3: Create Waiter (Duplicate Email)', async () => {
        await testCreateDuplicateEmail(token, createdEmail);
      });
    }
    
    // Test 4: Create waiter with invalid email
    await runTest('Test 4: Create Waiter (Invalid Email)', async () => {
      await testCreateInvalidEmail(token);
    });
    
    // Test 5: Create waiter with missing fields
    await runTest('Test 5: Create Waiter (Missing Fields)', async () => {
      await testCreateMissingFields(token);
    });
    
    // Test 6: Delete waiter
    if (createdWaiterId) {
      await runTest('Test 6: Delete Waiter', async () => {
        await testDeleteWaiter(token, createdWaiterId);
      });
    }
    
    // Test 7: Delete with invalid ID
    await runTest('Test 7: Delete Waiter (Invalid ID)', async () => {
      await testDeleteInvalidId(token);
    });
    
    // Test 8: List waiters again to verify deletion
    await runTest('Test 8: List Waiters (After Deletion)', async () => {
      await testListWaiters(token);
    });
    
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);
  
  console.log('\n' + '='.repeat(60));
  
  if (failed > 0) {
    process.exit(1);
  }
  
  console.log('\n✅ All tests passed!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
