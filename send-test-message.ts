/**
 * Send a real test message via Evolution API
 * 
 * Usage: npx tsx send-test-message.ts <phone_number>
 * Example: npx tsx send-test-message.ts 5511999999999
 */

import { EvolutionAPIClient } from './src/integrations/whatsapp/evolution-client';

async function sendTestMessage() {
  // Get phone number from command line argument
  const phoneNumber = process.argv[2];

  if (!phoneNumber) {
    console.error('❌ Error: Phone number is required');
    console.log('\nUsage: npx tsx send-test-message.ts <phone_number>');
    console.log('Example: npx tsx send-test-message.ts 5511999999999');
    console.log('\nPhone number format:');
    console.log('  - Include country code (e.g., 55 for Brazil)');
    console.log('  - No spaces, dashes, or special characters');
    console.log('  - Example: 5511999999999 (Brazil mobile)');
    process.exit(1);
  }

  console.log('📱 Sending test message via Evolution API\n');

  const client = new EvolutionAPIClient({
    apiUrl: 'http://wppapi.clubemkt.digital',
    apiKey: 'DD451E404240-4C45-AF35-BFCA6A976927',
    instanceName: 'cocooo',
  });

  // Format the phone number
  const formattedNumber = client.formatPhoneNumber(phoneNumber);
  console.log(`Phone number: ${phoneNumber} → ${formattedNumber}`);

  // Check if instance is connected
  console.log('\nChecking connection status...');
  const isConnected = await client.isConnected();
  
  if (!isConnected) {
    console.error('❌ Instance is not connected to WhatsApp');
    console.log('\nTo connect:');
    console.log('1. Get QR code: await client.getQRCode()');
    console.log('2. Scan with WhatsApp');
    process.exit(1);
  }

  console.log('✅ Instance is connected\n');

  // Prepare test message
  const testMessage = `🍇 *Coco Loko Açaiteria - Teste*

Olá! Esta é uma mensagem de teste do sistema de notificações.

✅ Sistema funcionando corretamente!

_Mensagem enviada em ${new Date().toLocaleString('pt-BR')}_`;

  console.log('Message to send:');
  console.log('---');
  console.log(testMessage);
  console.log('---\n');

  // Send the message
  console.log('Sending message...');
  try {
    const response = await client.sendTextMessage({
      number: formattedNumber,
      text: testMessage,
      delay: 0,
    });

    console.log('\n✅ Message sent successfully!');
    console.log('\nResponse details:');
    console.log(`  Message ID: ${response.key?.id || 'N/A'}`);
    console.log(`  Remote JID: ${response.key?.remoteJid || 'N/A'}`);
    console.log(`  From Me: ${response.key?.fromMe || false}`);
    console.log(`  Timestamp: ${response.messageTimestamp || 'N/A'}`);
    console.log(`  Status: ${response.status || 'sent'}`);

    console.log('\n📱 Check WhatsApp to confirm message delivery!');
  } catch (error) {
    console.error('\n❌ Failed to send message');
    console.error('Error:', error);

    const errorMessage = (error as Error).message.toLowerCase();
    
    if (errorMessage.includes('exists') || errorMessage.includes('not found')) {
      console.log('\n💡 This phone number does not have WhatsApp or is invalid');
    } else if (errorMessage.includes('400')) {
      console.log('\n💡 Bad request - check phone number format');
    } else if (errorMessage.includes('401')) {
      console.log('\n💡 Authentication failed - check API key');
    } else if (errorMessage.includes('network')) {
      console.log('\n💡 Network error - check API URL and internet connection');
    }

    process.exit(1);
  }
}

sendTestMessage().catch(console.error);
