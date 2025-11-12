/**
 * Evolution API Test Script
 * Tests connection to Evolution API instance
 */

const EVOLUTION_API_URL = 'http://wppapi.clubemkt.digital';
const EVOLUTION_API_KEY = 'DD451E404240-4C45-AF35-BFCA6A976927';
const INSTANCE_NAME = 'cocooo'; // Correct instance name from API response

interface EvolutionAPIResponse {
  instance?: {
    instanceName: string;
    status: string;
  };
  error?: string;
  message?: string;
}

async function testEvolutionAPI() {
  console.log('🧪 Testing Evolution API Integration\n');
  console.log('Configuration:');
  console.log(`  URL: ${EVOLUTION_API_URL}`);
  console.log(`  Instance: ${INSTANCE_NAME}`);
  console.log(`  API Key: ${EVOLUTION_API_KEY.substring(0, 10)}...`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 1: Fetch Instance Info
  console.log('Test 1: Fetching instance information...');
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully connected to Evolution API');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to fetch instances');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Check Specific Instance Status
  console.log(`Test 2: Checking instance "${INSTANCE_NAME}" status...`);
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Instance status retrieved');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to get instance status');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Get QR Code (if instance is not connected)
  console.log(`Test 3: Getting QR code for instance "${INSTANCE_NAME}"...`);
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ QR code endpoint accessible');
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.qrcode) {
        console.log('\n📱 QR Code available - scan with WhatsApp to connect');
      } else if (data.state === 'open') {
        console.log('\n✅ Instance already connected!');
      }
    } else {
      console.log('❌ Failed to get QR code');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Test Manager Instance Endpoint
  console.log('Test 4: Testing manager instance endpoint...');
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/managerinstance`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Manager instance endpoint accessible');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to access manager instance');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🏁 Test completed!\n');
}

// Run the tests
testEvolutionAPI().catch(console.error);
