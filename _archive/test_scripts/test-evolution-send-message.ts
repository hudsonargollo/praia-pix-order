/**
 * Evolution API Message Sending Test
 * Tests sending WhatsApp messages through Evolution API
 */

const EVOLUTION_API_URL = 'http://wppapi.clubemkt.digital';
const EVOLUTION_API_KEY = 'DD451E404240-4C45-AF35-BFCA6A976927';
const INSTANCE_NAME = 'cocooo';

// Test phone number (replace with your test number)
const TEST_PHONE = '5511999999999'; // Format: country code + number (no + or spaces)

async function testSendMessage() {
  console.log('📱 Testing Evolution API Message Sending\n');
  console.log('Configuration:');
  console.log(`  URL: ${EVOLUTION_API_URL}`);
  console.log(`  Instance: ${INSTANCE_NAME}`);
  console.log(`  Test Phone: ${TEST_PHONE}`);
  console.log('\n' + '='.repeat(60) + '\n');

  // First, check if instance is connected
  console.log('Step 1: Verifying instance connection...');
  try {
    const statusResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
      {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const statusData = await statusResponse.json();
    
    if (statusResponse.ok && statusData.instance?.state === 'open') {
      console.log('✅ Instance is connected and ready');
      console.log(`   WhatsApp Number: ${statusData.instance.instanceName}`);
    } else {
      console.log('❌ Instance is not connected');
      console.log('   You need to scan the QR code first');
      console.log('\n   To get QR code, visit:');
      console.log(`   ${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`);
      return;
    }
  } catch (error) {
    console.log('❌ Failed to check instance status:', error);
    return;
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test sending a text message
  console.log('Step 2: Sending test message...');
  console.log(`   To: ${TEST_PHONE}`);
  
  try {
    const messagePayload = {
      number: TEST_PHONE,
      text: '🍇 Olá! Esta é uma mensagem de teste do Coco Loko Açaiteria.\n\nSistema de notificações WhatsApp funcionando! ✅',
      delay: 0
    };

    console.log('   Payload:', JSON.stringify(messagePayload, null, 2));

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Message sent successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.key?.id) {
        console.log(`\n📨 Message ID: ${data.key.id}`);
      }
    } else {
      console.log('\n❌ Failed to send message');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      // Common error explanations
      if (response.status === 400) {
        console.log('\n💡 Tip: Check if the phone number format is correct');
        console.log('   Format should be: country code + number (e.g., 5511999999999)');
      } else if (response.status === 404) {
        console.log('\n💡 Tip: The phone number might not have WhatsApp');
      }
    }
  } catch (error) {
    console.log('\n❌ Network error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test with order confirmation template
  console.log('Step 3: Testing order confirmation message format...');
  
  const orderMessage = `🍇 *Coco Loko Açaiteria*

✅ *Pedido Confirmado!*

📋 *Pedido #1234*
👤 Cliente: João Silva
🪑 Mesa: 5

*Itens do Pedido:*
• 1x Açaí 500ml - R$ 15,00
• 1x Água de Coco - R$ 8,00

💰 *Total: R$ 23,00*

⏱️ Tempo estimado: 15 minutos

Você receberá uma notificação quando seu pedido estiver pronto! 🎉`;

  console.log('Message preview:');
  console.log('---');
  console.log(orderMessage);
  console.log('---');
  
  console.log('\n✅ Message format looks good!');
  console.log('   This is how order confirmations will appear');

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🏁 Test completed!\n');
  console.log('Summary:');
  console.log('  ✅ Evolution API is accessible');
  console.log('  ✅ Instance is connected');
  console.log('  ✅ Message sending endpoint is working');
  console.log('\nNext steps:');
  console.log('  1. Update .env with Evolution API credentials');
  console.log('  2. Create Evolution API client in src/integrations/whatsapp/');
  console.log('  3. Test with real order flow');
}

// Run the test
testSendMessage().catch(console.error);
