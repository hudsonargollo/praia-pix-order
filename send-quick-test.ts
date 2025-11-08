/**
 * Quick test message send
 */

import { EvolutionAPIClient } from './src/integrations/whatsapp/evolution-client';

async function sendQuickTest() {
  console.log('📱 Sending test message...\n');

  const client = new EvolutionAPIClient({
    apiUrl: 'http://wppapi.clubemkt.digital',
    apiKey: 'DD451E404240-4C45-AF35-BFCA6A976927',
    instanceName: 'cocooo',
  });

  const phoneNumber = '73999548537';
  const message = 'O PROGRAMA FUNCIONA';

  // Format the phone number
  const formattedNumber = client.formatPhoneNumber(phoneNumber);
  console.log(`📞 Phone: ${phoneNumber} → ${formattedNumber}`);
  console.log(`💬 Message: "${message}"\n`);

  // Check connection
  const isConnected = await client.isConnected();
  if (!isConnected) {
    console.error('❌ Instance not connected');
    process.exit(1);
  }
  console.log('✅ Instance connected\n');

  // Send message
  try {
    const response = await client.sendTextMessage({
      number: formattedNumber,
      text: message,
      delay: 0,
    });

    console.log('✅ MESSAGE SENT SUCCESSFULLY!\n');
    console.log('Details:');
    console.log(`  Message ID: ${response.key?.id}`);
    console.log(`  Remote JID: ${response.key?.remoteJid}`);
    console.log(`  Status: ${response.status || 'sent'}`);
    console.log('\n📱 Check WhatsApp now!');
  } catch (error) {
    console.error('❌ FAILED TO SEND');
    console.error('Error:', error);
    process.exit(1);
  }
}

sendQuickTest().catch(console.error);
