import { useState, useEffect, useCallback, useRef } from 'react';
import { useKitchenOrders } from './useRealtimeOrders';
import type { Order } from '@/integrations/supabase/realtime';

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
 * Requirements: 1.1, 1.3
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

  // Persist auto-print state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(AUTO_PRINT_STORAGE_KEY, String(isAutoPrintEnabled));
      console.log('Auto-print state saved:', isAutoPrintEnabled);
    } catch (error) {
      console.error('Error saving auto-print state to localStorage:', error);
      onError?.(error as Error);
    }
  }, [isAutoPrintEnabled, onError]);

  // Handle order status changes
  const handleOrderStatusChange = useCallback((order: Order) => {
    if (!isAutoPrintEnabled || !enabled) {
      return;
    }

    const previousStatus = previousOrderStatusesRef.current.get(order.id);
    const currentStatus = order.status;

    // Update tracked status
    previousOrderStatusesRef.current.set(order.id, currentStatus);

    // Check if order just transitioned to 'in_preparation'
    if (currentStatus === 'in_preparation' && previousStatus !== 'in_preparation') {
      console.log(`Auto-printing order ${order.order_number} (${order.id}) - status changed to in_preparation`);
      
      try {
        onPrint?.(order.id);
      } catch (error) {
        console.error('Error triggering auto-print:', error);
        onError?.(error as Error);
      }
    }
  }, [isAutoPrintEnabled, enabled, onPrint, onError]);

  // Handle new orders (initialize status tracking)
  const handleOrderInsert = useCallback((order: Order) => {
    // Track initial status
    previousOrderStatusesRef.current.set(order.id, order.status);

    // If order is already in preparation when inserted, print it
    if (isAutoPrintEnabled && enabled && order.status === 'in_preparation') {
      console.log(`Auto-printing new order ${order.order_number} (${order.id}) - already in in_preparation status`);
      
      try {
        onPrint?.(order.id);
      } catch (error) {
        console.error('Error triggering auto-print for new order:', error);
        onError?.(error as Error);
      }
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
      console.log('Auto-print toggled:', newValue);
      return newValue;
    });
  }, []);

  // Setter for programmatic control
  const setAutoPrintEnabledCallback = useCallback((enabled: boolean) => {
    setIsAutoPrintEnabled(enabled);
    console.log('Auto-print set to:', enabled);
  }, []);

  return {
    isAutoPrintEnabled,
    toggleAutoPrint,
    setAutoPrintEnabled: setAutoPrintEnabledCallback,
  };
}
