// Cloudflare Pages Function to add items to existing waiter orders
// This allows waiters to add items to orders that are already in preparation

// Type definitions for Cloudflare Pages Functions
type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, unknown>;
}) => Response | Promise<Response>;

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface AddItemsRequest {
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
  waiterId: string;
}

interface OrderItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
}

interface Order {
  id: string;
  waiter_id: string | null;
  status: string;
  payment_status: string;
  total_amount: number;
  commission_amount: number | null;
  pix_qr_code: string | null;
  pix_generated_at: string | null;
  pix_expires_at: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

const COMMISSION_RATE = 0.1;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { orderId, items, waiterId }: AddItemsRequest = await context.request.json();

    // Validate request
    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Order ID and items array are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!waiterId) {
      return new Response(JSON.stringify({ 
        error: 'Waiter ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = context.env.VITE_SUPABASE_URL;
    const serviceRoleKey = context.env.SUPABASE_SERVICE_KEY;

    // Fetch order from database
    const orderResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*`, 
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch order');
    }

    const orders: Order[] = await orderResponse.json();
    const order = orders[0];

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate order has waiter_id and waiter owns it
    if (!order.waiter_id) {
      return new Response(JSON.stringify({ 
        error: 'Order must be created by a waiter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (order.waiter_id !== waiterId) {
      return new Response(JSON.stringify({ 
        error: 'You can only add items to your own orders' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate order status is in_preparation
    if (order.status !== 'in_preparation') {
      return new Response(JSON.stringify({ 
        error: 'Can only add items to orders in preparation',
        currentStatus: order.status 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch menu items to get prices and validate availability
    const productIds = items.map(item => item.productId);
    const menuItemsResponse = await fetch(
      `${supabaseUrl}/rest/v1/menu_items?id=in.(${productIds.join(',')})&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!menuItemsResponse.ok) {
      throw new Error('Failed to fetch menu items');
    }

    const menuItems: MenuItem[] = await menuItemsResponse.json();

    // Validate all products exist and are available
    for (const item of items) {
      const menuItem = menuItems.find(mi => mi.id === item.productId);
      if (!menuItem) {
        return new Response(JSON.stringify({ 
          error: `Product ${item.productId} not found` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (!menuItem.available) {
        return new Response(JSON.stringify({ 
          error: `Product ${menuItem.name} is not available` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if PIX exists and is not expired
    let pixInvalidated = false;
    if (order.pix_qr_code && order.pix_expires_at) {
      const expiresAt = new Date(order.pix_expires_at);
      if (expiresAt > new Date()) {
        // PIX exists and not expired, need to invalidate it
        pixInvalidated = true;
      }
    }

    // Insert new items into order_items table
    const orderItemsToInsert = items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.productId)!;
      return {
        order_id: orderId,
        menu_item_id: item.productId,
        item_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: item.quantity
      };
    });

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/order_items`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(orderItemsToInsert)
      }
    );

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      console.error('Failed to insert order items:', error);
      throw new Error(`Failed to insert order items: ${error}`);
    }

    const insertedItems: OrderItem[] = await insertResponse.json();

    // Calculate new total amount
    const addedAmount = insertedItems.reduce(
      (sum, item) => sum + (item.unit_price * item.quantity), 
      0
    );
    const newTotalAmount = order.total_amount + addedAmount;
    const newCommissionAmount = newTotalAmount * COMMISSION_RATE;

    // Prepare update payload
    const updatePayload: any = {
      total_amount: newTotalAmount,
      commission_amount: newCommissionAmount
    };

    // If PIX was invalidated, clear PIX fields
    if (pixInvalidated) {
      updatePayload.pix_qr_code = null;
      updatePayload.pix_generated_at = null;
      updatePayload.pix_expires_at = null;
    }

    // Update order with new total and commission
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updatePayload)
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Failed to update order:', error);
      throw new Error(`Failed to update order: ${error}`);
    }

    const updatedOrders: Order[] = await updateResponse.json();
    const updatedOrder = updatedOrders[0];

    // Log audit information
    console.log(`[AUDIT] Items added to order ${orderId}`, {
      timestamp: new Date().toISOString(),
      waiter_id: waiterId,
      order_id: orderId,
      items_added: insertedItems.map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      old_total: order.total_amount,
      new_total: newTotalAmount,
      added_amount: addedAmount,
      pix_invalidated: pixInvalidated
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      order: updatedOrder,
      addedItems: insertedItems,
      newTotal: newTotalAmount,
      addedAmount: addedAmount,
      pixInvalidated: pixInvalidated,
      message: pixInvalidated 
        ? 'Items added successfully. PIX was invalidated and needs to be regenerated with the new amount.'
        : 'Items added successfully.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Add items error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
