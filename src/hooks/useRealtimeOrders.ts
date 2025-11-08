import { useEffect, useCallback, useRef } from 'react';
import { realtimeService, type Order, type OrderInsertCallback, type OrderUpdateCallback, type OrderDeleteCallback } from '@/integrations/supabase/realtime';

export interface UseRealtimeOrdersOptions {
  onOrderInsert?: OrderInsertCallback;
  onOrderUpdate?: OrderUpdateCallback;
  onOrderDelete?: OrderDeleteCallback;
  enabled?: boolean;
}

export interface UseKitchenOrdersOptions extends UseRealtimeOrdersOptions {
  onNewPaidOrder?: (order: Order) => void;
  onOrderStatusChange?: (order: Order) => void;
}

export interface UseCashierOrdersOptions extends UseRealtimeOrdersOptions {
  onPaymentConfirmed?: (order: Order) => void;
  onOrderCreated?: (order: Order) => void;
}

/**
 * Hook for kitchen panel real-time order subscriptions
 */
export function useKitchenOrders(options: UseKitchenOrdersOptions = {}) {
  const {
    onOrderInsert,
    onOrderUpdate,
    onOrderDelete,
    onNewPaidOrder,
    onOrderStatusChange,
    enabled = true
  } = options;

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleInsert = useCallback((order: Order) => {
    onOrderInsert?.(order);
    if (order.status === 'paid') {
      onNewPaidOrder?.(order);
    }
  }, [onOrderInsert, onNewPaidOrder]);

  const handleUpdate = useCallback((order: Order) => {
    onOrderUpdate?.(order);
    onOrderStatusChange?.(order);
  }, [onOrderUpdate, onOrderStatusChange]);

  const handleDelete = useCallback((orderId: string) => {
    onOrderDelete?.(orderId);
  }, [onOrderDelete]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log('Setting up kitchen orders real-time subscription');
    
    unsubscribeRef.current = realtimeService.subscribeToKitchenOrders(
      handleInsert,
      handleUpdate,
      onOrderDelete ? handleDelete : undefined
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, handleInsert, handleUpdate, handleDelete, onOrderDelete]);

  return {
    connectionStatus: realtimeService.getConnectionStatus(),
    reconnect: realtimeService.reconnect.bind(realtimeService)
  };
}

/**
 * Hook for cashier panel real-time order subscriptions
 */
export function useCashierOrders(options: UseCashierOrdersOptions = {}) {
  const {
    onOrderInsert,
    onOrderUpdate,
    onOrderDelete,
    onPaymentConfirmed,
    onOrderCreated,
    enabled = true
  } = options;

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleInsert = useCallback((order: Order) => {
    onOrderInsert?.(order);
    onOrderCreated?.(order);
  }, [onOrderInsert, onOrderCreated]);

  const handleUpdate = useCallback((order: Order) => {
    onOrderUpdate?.(order);
    if (order.payment_confirmed_at && order.status === 'paid') {
      onPaymentConfirmed?.(order);
    }
  }, [onOrderUpdate, onPaymentConfirmed]);

  const handleDelete = useCallback((orderId: string) => {
    onOrderDelete?.(orderId);
  }, [onOrderDelete]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log('Setting up cashier orders real-time subscription');
    
    unsubscribeRef.current = realtimeService.subscribeToCashierOrders(
      handleInsert,
      handleUpdate,
      onOrderDelete ? handleDelete : undefined
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, handleInsert, handleUpdate, handleDelete, onOrderDelete]);

  return {
    connectionStatus: realtimeService.getConnectionStatus(),
    reconnect: realtimeService.reconnect.bind(realtimeService)
  };
}

/**
 * Hook for payment status real-time updates
 */
export function usePaymentUpdates(options: {
  onPaymentConfirmed?: (order: Order) => void;
  onPaymentExpired?: (order: Order) => void;
  enabled?: boolean;
} = {}) {
  const { onPaymentConfirmed, onPaymentExpired, enabled = true } = options;
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !onPaymentConfirmed) {
      return;
    }

    console.log('Setting up payment updates real-time subscription');
    
    unsubscribeRef.current = realtimeService.subscribeToPaymentUpdates(
      onPaymentConfirmed,
      onPaymentExpired
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, onPaymentConfirmed, onPaymentExpired]);

  return {
    connectionStatus: realtimeService.getConnectionStatus(),
    reconnect: realtimeService.reconnect.bind(realtimeService)
  };
}

/**
 * Hook for subscribing to a specific order
 */
export function useOrderSubscription(orderId: string | null, onUpdate: OrderUpdateCallback, enabled = true) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !orderId) {
      return;
    }

    console.log(`Setting up subscription for order: ${orderId}`);
    
    unsubscribeRef.current = realtimeService.subscribeToOrder(orderId, onUpdate);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [orderId, onUpdate, enabled]);

  return {
    connectionStatus: realtimeService.getConnectionStatus(),
    reconnect: realtimeService.reconnect.bind(realtimeService)
  };
}