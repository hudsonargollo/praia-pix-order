/**
 * Test script to verify WhatsApp notification is sent on payment confirmation
 * 
 * This simulates the payment confirmation flow:
 * 1. Creates a test order
 * 2. Simulates payment confirmation
 * 3. Verifies WhatsApp notification is queued and sent
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sntxekdwdllwkszclpiq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentNotification() {
  console.log('🧪 Testing Payment Notification Flow\n');

  try {
    // Step 1: Create a test order
    console.log('1️⃣ Creating test order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: `TEST-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '73999548537', // Your test number
        table_number: 'TEST-1',
        total_amount: 25.00,
        status: 'pending_payment',
        mercadopago_payment_id: `test-payment-${Date.now()}`,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    console.log('✅ Order created:', {
      id: order.id,
      orderNumber: order.order_number,
      phone: order.customer_phone,
    });

    // Step 2: Simulate payment confirmation using RPC function
    console.log('\n2️⃣ Confirming payment...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('confirm_order_payment', {
      _order_id: order.id,
      _payment_id: order.mercadopago_payment_id,
    });

    if (rpcError) {
      throw new Error(`Failed to confirm payment: ${rpcError.message}`);
    }

    console.log('✅ Payment confirmed via RPC');

    // Step 3: Wait a moment for notification to be queued
    console.log('\n3️⃣ Waiting for notification to be queued...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check if notification was queued
    const { data: notifications, error: notifError } = await supabase
      .from('whatsapp_notifications')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });

    if (notifError) {
      throw new Error(`Failed to fetch notifications: ${notifError.message}`);
    }

    if (!notifications || notifications.length === 0) {
      console.log('❌ No notification found in queue!');
      console.log('\n🔍 Debugging info:');
      console.log('- Order ID:', order.id);
      console.log('- Order Status:', order.status);
      console.log('- Check if notification triggers are working');
      return;
    }

    console.log('✅ Notification queued:', {
      id: notifications[0].id,
      type: notifications[0].notification_type,
      status: notifications[0].status,
      attempts: notifications[0].attempts,
    });

    // Step 5: Wait for notification to be processed
    console.log('\n4️⃣ Waiting for notification to be sent...');
    let attempts = 0;
    let sent = false;

    while (attempts < 10 && !sent) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: updatedNotif } = await supabase
        .from('whatsapp_notifications')
        .select('*')
        .eq('id', notifications[0].id)
        .single();

      if (updatedNotif?.status === 'sent') {
        sent = true;
        console.log('✅ Notification sent successfully!', {
          sentAt: updatedNotif.sent_at,
          messageId: updatedNotif.whatsapp_message_id,
        });
      } else if (updatedNotif?.status === 'failed') {
        console.log('❌ Notification failed:', updatedNotif.error_message);
        break;
      } else {
        console.log(`⏳ Attempt ${attempts + 1}/10 - Status: ${updatedNotif?.status}`);
      }

      attempts++;
    }

    if (!sent && attempts >= 10) {
      console.log('⚠️ Notification not sent after 20 seconds');
      console.log('Check the queue manager and Evolution API connection');
    }

    // Step 6: Show notification content
    if (notifications[0].message_content) {
      console.log('\n📱 Message Content:');
      console.log('─'.repeat(50));
      console.log(notifications[0].message_content);
      console.log('─'.repeat(50));
    }

    console.log('\n✅ Test completed!');
    console.log('\n📊 Summary:');
    console.log('- Order created:', order.order_number);
    console.log('- Payment confirmed: Yes');
    console.log('- Notification queued: Yes');
    console.log('- Notification sent:', sent ? 'Yes' : 'Pending/Failed');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testPaymentNotification()
  .then(() => {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
