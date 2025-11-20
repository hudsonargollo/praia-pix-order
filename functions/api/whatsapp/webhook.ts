/**
 * Cloudflare Function: WhatsApp Webhook Handler
 * Receives incoming WhatsApp messages from Evolution API and associates them with orders
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp?: number;
  };
}

interface Order {
  id: string;
  customer_phone: string;
  status: string;
  created_at: string;
}

/**
 * Normalize phone number by removing all non-digit characters
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Extract phone number from WhatsApp JID format
 * Example: "5573999988888@s.whatsapp.net" -> "5573999988888"
 */
function extractPhoneFromJid(jid: string): string {
  const phone = jid.split('@')[0];
  return normalizePhoneNumber(phone);
}

/**
 * Extract message content from Evolution API payload
 */
function extractMessageContent(payload: EvolutionWebhookPayload): string | null {
  const message = payload.data.message;
  
  if (!message) {
    return null;
  }

  // Try conversation field first (simple text messages)
  if (message.conversation) {
    return message.conversation;
  }

  // Try extendedTextMessage (replies, quoted messages)
  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }

  return null;
}

/**
 * Check if order is active (not completed or cancelled)
 */
function isActiveOrder(status: string): boolean {
  const inactiveStatuses = ['completed', 'cancelled'];
  return !inactiveStatuses.includes(status.toLowerCase());
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse webhook payload
    const payload: EvolutionWebhookPayload = await request.json();

    console.log('Received webhook:', {
      event: payload.event,
      instance: payload.instance,
      fromMe: payload.data?.key?.fromMe,
      remoteJid: payload.data?.key?.remoteJid,
    });

    // Ignore if not a message event
    if (payload.event !== 'messages.upsert') {
      console.log('Ignoring non-message event:', payload.event);
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ignore outbound messages (sent by us)
    if (payload.data?.key?.fromMe) {
      console.log('Ignoring outbound message');
      return new Response(JSON.stringify({ message: 'Outbound message ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract phone number
    const remoteJid = payload.data?.key?.remoteJid;
    if (!remoteJid) {
      console.error('Missing remoteJid in payload');
      return new Response(JSON.stringify({ error: 'Invalid payload: missing remoteJid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const phoneNumber = extractPhoneFromJid(remoteJid);
    console.log('Extracted phone number:', phoneNumber);

    // Extract message content
    const messageContent = extractMessageContent(payload);
    if (!messageContent) {
      console.log('No text content in message, ignoring');
      return new Response(JSON.stringify({ message: 'No text content' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Message content:', messageContent.substring(0, 50) + '...');

    // Get Supabase credentials
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query for active orders with matching phone number
    const ordersResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?customer_phone=eq.${phoneNumber}&select=id,customer_phone,status,created_at&order=created_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!ordersResponse.ok) {
      console.error('Failed to query orders:', ordersResponse.status);
      return new Response(JSON.stringify({ error: 'Database query failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const orders: Order[] = await ordersResponse.json();
    console.log(`Found ${orders.length} orders for phone ${phoneNumber}`);

    // Filter to active orders only
    const activeOrders = orders.filter(order => isActiveOrder(order.status));
    console.log(`Found ${activeOrders.length} active orders`);

    // If no active orders, ignore the message
    if (activeOrders.length === 0) {
      console.log('No active orders found, ignoring message');
      return new Response(JSON.stringify({ message: 'No active orders, message ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Select the most recently created active order
    const targetOrder = activeOrders[0]; // Already sorted by created_at desc
    console.log('Associating message with order:', targetOrder.id);

    // Insert message into database
    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_chat_messages`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          order_id: targetOrder.id,
          phone_number: phoneNumber,
          direction: 'inbound',
          content: messageContent,
          status: 'sent',
          evolution_id: payload.data.key.id,
        }),
      }
    );

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Failed to insert message:', insertResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to store message' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const insertedMessage = await insertResponse.json();
    console.log('Message stored successfully:', insertedMessage[0]?.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Message processed and stored',
      orderId: targetOrder.id,
      messageId: insertedMessage[0]?.id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
