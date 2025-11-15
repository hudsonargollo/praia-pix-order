import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  table_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  notified_at: string | null;
  payment_confirmed_at: string | null;
  mercadopago_payment_id: string | null;
  payment_expires_at: string | null;
  pix_generated_at: string | null;
  pix_qr_code: string | null;
  pix_expires_at: string | null;
  ready_at: string | null;
  kitchen_notified_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
  qr_code_data: string | null;
  pix_copy_paste: string | null;
  completed_at: string | null;
  order_notes: string | null;
  created_by_waiter: boolean | null;
  waiter_id: string | null;
  commission_amount: number | null;
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
  private updateDebounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 100; // ms
  private connectionHealthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  /**
   * Debounce update callbacks to prevent rapid successive updates
   */
  private debounceUpdate(key: string, callback: () => void): void {
    // Clear existing timer
    const existingTimer = this.updateDebounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback();
      this.updateDebounceTimers.delete(key);
    }, this.DEBOUNCE_DELAY);

    this.updateDebounceTimers.set(key, timer);
  }

  /**
   * Subscribe to all order changes for kitchen panel
   * Filters for paid, in_preparation, and ready orders
   * Optimized with debouncing for rapid updates
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
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'and(status=eq.pending,created_by_waiter=eq.true)',
        },
        (payload) => {
          console.log('Kitchen: New waiter order received:', payload);
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
          // Include pending waiter orders and standard kitchen statuses
          if (['paid', 'in_preparation', 'ready'].includes(order.status) || 
              (order.status === 'pending' && order.created_by_waiter)) {
            // Debounce updates to prevent rapid successive calls
            this.debounceUpdate(`kitchen-${order.id}`, () => {
              console.log('Kitchen: Order status updated:', payload);
              onUpdate(order);
            });
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
   * Optimized with debouncing for rapid updates
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
          const order = payload.new as Order;
          // Debounce updates to prevent rapid successive calls
          this.debounceUpdate(`cashier-${order.id}`, () => {
            console.log('Cashier: Order updated:', payload);
            onUpdate(order);
          });
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
   * Optimized with debouncing for rapid updates
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
          const order = payload.new as Order;
          // Debounce updates to prevent rapid successive calls
          this.debounceUpdate(`order-${orderId}`, () => {
            console.log(`Order ${orderId} updated:`, payload);
            onUpdate(order);
          });
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
      
      // Clear any pending debounce timers for this channel
      const prefix = channelName.split('-')[0];
      this.updateDebounceTimers.forEach((timer, key) => {
        if (key.startsWith(prefix)) {
          clearTimeout(timer);
          this.updateDebounceTimers.delete(key);
        }
      });
      
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
    // Check if any channels are subscribed and active
    const hasActiveChannels = this.channels.size > 0;
    return hasActiveChannels ? 'connected' : 'disconnected';
  }

  /**
   * Get detailed connection metrics
   */
  getConnectionMetrics(): {
    status: string;
    activeChannels: number;
    reconnectAttempts: number;
  } {
    return {
      status: this.getConnectionStatus(),
      activeChannels: this.channels.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Manually trigger a reconnection with exponential backoff
   */
  reconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
    
    setTimeout(() => {
      supabase.realtime.disconnect();
      supabase.realtime.connect();
      
      // Reset counter on successful connection
      setTimeout(() => {
        if (this.getConnectionStatus() === 'connected') {
          this.reconnectAttempts = 0;
        }
      }, 2000);
    }, backoffDelay);
  }

  /**
   * Start connection health monitoring
   * Automatically reconnects if connection is lost
   */
  startHealthMonitoring(intervalMs: number = 30000): void {
    if (this.connectionHealthCheckInterval) {
      return; // Already monitoring
    }

    this.connectionHealthCheckInterval = setInterval(() => {
      const status = this.getConnectionStatus();
      
      if (status === 'disconnected') {
        console.warn('Real-time connection lost. Attempting to reconnect...');
        this.reconnect();
      } else {
        // Reset reconnect attempts on healthy connection
        this.reconnectAttempts = 0;
      }
    }, intervalMs);

    console.log('Real-time connection health monitoring started');
  }

  /**
   * Stop connection health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.connectionHealthCheckInterval) {
      clearInterval(this.connectionHealthCheckInterval);
      this.connectionHealthCheckInterval = null;
      console.log('Real-time connection health monitoring stopped');
    }
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    // Clear all debounce timers
    this.updateDebounceTimers.forEach((timer) => clearTimeout(timer));
    this.updateDebounceTimers.clear();

    // Stop health monitoring
    this.stopHealthMonitoring();

    // Unsubscribe from all channels
    this.unsubscribeAll();

    // Reset reconnect attempts
    this.reconnectAttempts = 0;

    console.log('Real-time service cleaned up');
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();