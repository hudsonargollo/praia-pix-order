/**
 * Test the Evolution API Client
 */

import { EvolutionAPIClient } from './src/integrations/whatsapp/evolution-client';

async function testClient() {
  console.log('🧪 Testing Evolution API Client\n');

  const client = new EvolutionAPIClient({
    apiUrl: 'http://wppapi.clubemkt.digital',
    apiKey: 'DD451E404240-4C45-AF35-BFCA6A976927',
    instanceName: 'cocooo',
  });

  console.log('Configuration check:');
  console.log(`  Is Configured: ${client.isConfigured()}`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 1: Check connection status
  console.log('Test 1: Checking connection status...');
  try {
    const status = await client.getConnectionStatus();
    console.log('✅ Status:', status);
    console.log(`   Instance: ${status.instanceName}`);
    console.log(`   State: ${status.state}`);
    
    const isConnected = await client.isConnected();
    console.log(`   Is Connected: ${isConnected ? '✅ Yes' : '❌ No'}`);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Phone number formatting
  console.log('Test 2: Testing phone number formatting...');
  const testNumbers = [
    '+55 11 99999-9999',
    '(11) 99999-9999',
    '11999999999',
    '5511999999999',
    '011999999999',
  ];

  testNumbers.forEach(number => {
    const formatted = client.formatPhoneNumber(number);
    console.log(`  ${number.padEnd(20)} → ${formatted}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Fetch instances
  console.log('Test 3: Fetching all instances...');
  try {
    const instances = await client.fetchInstances();
    console.log(`✅ Found ${instances.length} instance(s)`);
    instances.forEach((instance: any) => {
      console.log(`   - ${instance.name} (${instance.connectionStatus})`);
      console.log(`     Number: ${instance.number || 'N/A'}`);
    });
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Send test message (with a real number if you want to test)
  console.log('Test 4: Message sending capability...');
  console.log('   Skipping actual send to avoid spam');
  console.log('   To test sending, use:');
  console.log('   await client.sendTextMessage({');
  console.log('     number: "5511999999999",');
  console.log('     text: "Test message"');
  console.log('   });');

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🏁 Client test completed!\n');
}

testClient().catch(console.error);
