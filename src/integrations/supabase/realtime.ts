import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  notified_at: string | null;
  payment_confirmed_at: string | null;
  mercadopago_payment_id: string | null;
  payment_expires_at: string | null;
  ready_at: string | null;
  kitchen_notified_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
  qr_code_data: string | null;
  pix_copy_paste: string | null;
  completed_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

export type OrderStatusType = 'pending_payment' | 'paid' | 'in_preparation' | 'ready' | 'completed';

export interface OrderUpdateCallback {
  (order: Order): void;
}

export interface OrderInsertCallback {
  (order: Order): void;
}

export interface OrderDeleteCallback {
  (orderId: string): void;
}

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to all order changes for kitchen panel
   * Filters for paid, in_preparation, and ready orders
   */
  subscribeToKitchenOrders(
    onInsert: OrderInsertCallback,
    onUpdate: OrderUpdateCallback,
    onDelete?: OrderDeleteCallback
  ): () => void {
    const channelName = 'kitchen-orders';
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.paid',
        },
        (payload) => {
          console.log('Kitchen: New paid order received:', payload);
          onInsert(payload.new as Order);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const order = payload.new as Order;
          // Only process orders relevant to kitchen
          if (['paid', 'in_preparation', 'ready'].includes(order.status)) {
            console.log('Kitchen: Order status updated:', payload);
            onUpdate(order);
          }
        }
      );

    if (onDelete) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Kitchen: Order deleted:', payload);
          onDelete(payload.old.id);
        }
      );
    }

    channel.subscribe((status) => {
      console.log(`Kitchen orders subscription status: ${status}`);
    });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to all order changes for cashier panel
   * Includes all order statuses
   */
  subscribeToCashierOrders(
    onInsert: OrderInsertCallback,
    onUpdate: OrderUpdateCallback,
    onDelete?: OrderDeleteCallback
  ): () => void {
    const channelName = 'cashier-orders';
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Cashier: New order received:', payload);
          onInsert(payload.new as Order);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Cashier: Order updated:', payload);
          onUpdate(payload.new as Order);
        }
      );

    if (onDelete) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Cashier: Order deleted:', payload);
          onDelete(payload.old.id);
        }
      );
    }

    channel.subscribe((status) => {
      console.log(`Cashier orders subscription status: ${status}`);
    });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to specific order changes
   */
  subscribeToOrder(
    orderId: string,
    onUpdate: OrderUpdateCallback
  ): () => void {
    const channelName = `order-${orderId}`;
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log(`Order ${orderId} updated:`, payload);
          onUpdate(payload.new as Order);
        }
      )
      .subscribe((status) => {
        console.log(`Order ${orderId} subscription status: ${status}`);
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to payment status changes
   * Useful for payment polling components
   */
  subscribeToPaymentUpdates(
    onPaymentConfirmed: (order: Order) => void,
    onPaymentExpired?: (order: Order) => void
  ): () => void {
    const channelName = 'payment-updates';
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'payment_confirmed_at=not.is.null',
        },
        (payload) => {
          const order = payload.new as Order;
          console.log('Payment confirmed for order:', order.id);
          onPaymentConfirmed(order);
        }
      );

    if (onPaymentExpired) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.expired',
        },
        (payload) => {
          const order = payload.new as Order;
          console.log('Payment expired for order:', order.id);
          onPaymentExpired(order);
        }
      );
    }

    channel.subscribe((status) => {
      console.log(`Payment updates subscription status: ${status}`);
    });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from channel: ${channelName}`);
    });
    this.channels.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return supabase.realtime.connection?.readyState === 1 ? 'connected' : 'disconnected';
  }

  /**
   * Manually trigger a reconnection
   */
  reconnect(): void {
    supabase.realtime.disconnect();
    supabase.realtime.connect();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();