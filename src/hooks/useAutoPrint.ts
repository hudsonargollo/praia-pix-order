import { useState, useEffect, useCallback, useRef } from 'react';
import { useKitchenOrders } from './useRealtimeOrders';
import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/integrations/supabase/realtime';
import { toast } from 'sonner';

const AUTO_PRINT_STORAGE_KEY = 'kitchen_auto_print';

interface UseAutoPrintOptions {
  enabled?: boolean;
  onPrint?: (orderId: string) => void;
  onError?: (error: Error) => void;
}

interface UseAutoPrintReturn {
  isAutoPrintEnabled: boolean;
  toggleAutoPrint: () => void;
  setAutoPrintEnabled: (enabled: boolean) => void;
}

/**
 * Hook for automatic order printing in kitchen view
 * 
 * Manages auto-print toggle state with localStorage persistence and integrates
 * with useKitchenOrders to automatically trigger printing when orders reach
 * 'in_preparation' status.
 * 
 * Enhanced to handle orders that are already in preparation when the Kitchen page loads.
 * 
 * Requirements: 2.1, 2.2, 4.1, 4.2, 4.3, 4.4, 2.5
 */
export function useAutoPrint(options: UseAutoPrintOptions = {}): UseAutoPrintReturn {
  const { enabled = true, onPrint, onError } = options;

  // Load initial state from localStorage
  const [isAutoPrintEnabled, setIsAutoPrintEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTO_PRINT_STORAGE_KEY);
      return stored === 'true';
    } catch (error) {
      console.error('Error reading auto-print state from localStorage:', error);
      return false;
    }
  });

  // Track previous order statuses to detect transitions
  const previousOrderStatusesRef = useRef<Map<string, string>>(new Map());
  
  // Track if initial order tracking has been completed
  const initializedRef = useRef<boolean>(false);

  // Persist auto-print state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(AUTO_PRINT_STORAGE_KEY, String(isAutoPrintEnabled));
      console.log('[useAutoPrint] Auto-print state saved to localStorage:', {
        enabled: isAutoPrintEnabled,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[useAutoPrint] Error saving auto-print state to localStorage:', {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
      });
      onError?.(error as Error);
    }
  }, [isAutoPrintEnabled, onError]);

  /**
   * Initialize order tracking on mount
   * Fetches current kitchen orders and tracks their statuses to detect transitions
   * Requirements: 2.1, 2.2, 4.1, 4.2
   */
  const initializeOrderTracking = useCallback(async () => {
    if (initializedRef.current || !enabled || !isAutoPrintEnabled) {
      return;
    }

    try {
      console.log('[useAutoPrint] Initializing order tracking...', {
        enabled,
        isAutoPrintEnabled,
        timestamp: new Date().toISOString(),
      });
      
      // Fetch current kitchen orders (in_preparation, ready, completed)
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, status, order_number, created_at')
        .in('status', ['in_preparation', 'ready', 'completed'])
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (orders && orders.length > 0) {
        console.log(`[useAutoPrint] Tracking ${orders.length} existing orders:`, {
          orders: orders.map(o => ({
            id: o.id,
            orderNumber: o.order_number,
            status: o.status,
            createdAt: o.created_at,
          })),
        });
        
        // Initialize status tracking for all current orders
        orders.forEach(order => {
          previousOrderStatusesRef.current.set(order.id, order.status);
        });
      } else {
        console.log('[useAutoPrint] No existing orders to track');
      }

      initializedRef.current = true;
      console.log('[useAutoPrint] Order tracking initialization complete');
    } catch (error) {
      console.error('[useAutoPrint] Error initializing order tracking:', {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
      });
      onError?.(error as Error);
    }
  }, [enabled, isAutoPrintEnabled, onError]);

  // Initialize order tracking when auto-print is enabled
  useEffect(() => {
    if (enabled && isAutoPrintEnabled && !initializedRef.current) {
      initializeOrderTracking();
    }
  }, [enabled, isAutoPrintEnabled, initializeOrderTracking]);

  /**
   * Handle order status changes
   * Detects transitions to 'in_preparation' status and triggers printing
   * Requirements: 2.1, 2.2, 4.3, 4.4
   */
  const handleOrderStatusChange = useCallback((order: Order) => {
    if (!isAutoPrintEnabled || !enabled) {
      return;
    }

    const previousStatus = previousOrderStatusesRef.current.get(order.id);
    const currentStatus = order.status;

    console.log(`[useAutoPrint] Order status change detected:`, {
      orderId: order.id,
      orderNumber: order.order_number,
      previousStatus: previousStatus || 'unknown',
      currentStatus,
      timestamp: new Date().toISOString(),
    });

    // Update tracked status
    previousOrderStatusesRef.current.set(order.id, currentStatus);

    // Check if order just transitioned to 'in_preparation'
    if (currentStatus === 'in_preparation' && previousStatus !== 'in_preparation') {
      console.log(`[useAutoPrint] Auto-print triggered - status transition:`, {
        orderId: order.id,
        orderNumber: order.order_number,
        transition: `${previousStatus || 'unknown'} → in_preparation`,
        customerName: order.customer_name,
        totalAmount: order.total_amount,
        timestamp: new Date().toISOString(),
      });
      
      try {
        onPrint?.(order.id);
        console.log(`[useAutoPrint] Auto-print completed successfully:`, {
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[useAutoPrint] Auto-print failed:', {
          orderId: order.id,
          orderNumber: order.order_number,
          error: error instanceof Error ? error.message : error,
          timestamp: new Date().toISOString(),
        });
        
        // Show user-friendly error message without blocking workflow
        // Requirement: 2.5
        toast.error('Erro na impressão automática. Tente imprimir manualmente.');
        
        onError?.(error as Error);
      }
    } else {
      console.log(`[useAutoPrint] No print triggered - status not transitioning to in_preparation:`, {
        orderId: order.id,
        orderNumber: order.order_number,
        currentStatus,
        previousStatus: previousStatus || 'unknown',
      });
    }
  }, [isAutoPrintEnabled, enabled, onPrint, onError]);

  /**
   * Handle new order inserts
   * Prints orders that are already in 'in_preparation' status when inserted
   * This handles waiter-created orders that go directly to preparation
   * Requirements: 2.1, 2.2, 4.3, 4.4
   */
  const handleOrderInsert = useCallback((order: Order) => {
    console.log(`[useAutoPrint] New order inserted:`, {
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      customerName: order.customer_name,
      totalAmount: order.total_amount,
      createdAt: order.created_at,
      timestamp: new Date().toISOString(),
    });
    
    // Track initial status
    previousOrderStatusesRef.current.set(order.id, order.status);

    // If order is already in preparation when inserted, print it
    // This handles the case where Kitchen page loads after payment confirmation
    // or when waiter creates an order directly in preparation status
    if (isAutoPrintEnabled && enabled && order.status === 'in_preparation') {
      console.log(`[useAutoPrint] Auto-print triggered - new order in preparation:`, {
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        totalAmount: order.total_amount,
        reason: 'order_inserted_with_in_preparation_status',
        timestamp: new Date().toISOString(),
      });
      
      try {
        onPrint?.(order.id);
        console.log(`[useAutoPrint] Auto-print completed successfully for new order:`, {
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[useAutoPrint] Auto-print failed for new order:', {
          orderId: order.id,
          orderNumber: order.order_number,
          error: error instanceof Error ? error.message : error,
          timestamp: new Date().toISOString(),
        });
        
        // Show user-friendly error message without blocking workflow
        // Requirement: 2.5
        toast.error('Erro na impressão automática. Tente imprimir manualmente.');
        
        onError?.(error as Error);
      }
    } else {
      console.log(`[useAutoPrint] No print triggered for new order:`, {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        autoPrintEnabled: isAutoPrintEnabled,
        hookEnabled: enabled,
        reason: order.status !== 'in_preparation' ? 'status_not_in_preparation' : 'auto_print_disabled',
      });
    }
  }, [isAutoPrintEnabled, enabled, onPrint, onError]);

  // Subscribe to kitchen orders with status change detection
  useKitchenOrders({
    enabled,
    onOrderInsert: handleOrderInsert,
    onOrderStatusChange: handleOrderStatusChange,
  });

  // Toggle auto-print state
  const toggleAutoPrint = useCallback(() => {
    setIsAutoPrintEnabled(prev => {
      const newValue = !prev;
      console.log('[useAutoPrint] Auto-print toggled:', {
        previousValue: prev,
        newValue,
        timestamp: new Date().toISOString(),
      });
      return newValue;
    });
  }, []);

  // Setter for programmatic control
  const setAutoPrintEnabledCallback = useCallback((enabled: boolean) => {
    setIsAutoPrintEnabled(enabled);
    console.log('[useAutoPrint] Auto-print state set programmatically:', {
      enabled,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return {
    isAutoPrintEnabled,
    toggleAutoPrint,
    setAutoPrintEnabled: setAutoPrintEnabledCallback,
  };
}
