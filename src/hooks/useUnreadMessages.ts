import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook for tracking unread message counts for multiple orders
 * Optimized for displaying badges on order cards
 * 
 * @param orderIds - Array of order IDs to track
 * @returns Map of order IDs to unread message counts
 */
export function useUnreadMessages(orderIds: string[]): {
  unreadCounts: Map<string, number>;
  loading: boolean;
  markAsRead: (orderId: string) => void;
} {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const readTimestampsRef = useRef<Map<string, string>>(new Map());

  /**
   * Fetch unread message counts for all orders
   */
  const fetchUnreadCounts = useCallback(async () => {
    if (orderIds.length === 0) {
      setUnreadCounts(new Map());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Query for inbound messages for all orders
      const { data: messages, error } = await supabase
        .from('whatsapp_chat_messages')
        .select('order_id, created_at')
        .in('order_id', orderIds)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Count unread messages per order
      const counts = new Map<string, number>();
      
      orderIds.forEach(orderId => {
        const lastReadTimestamp = readTimestampsRef.current.get(orderId);
        const orderMessages = messages?.filter(msg => msg.order_id === orderId) || [];
        
        if (lastReadTimestamp) {
          // Count messages after last read timestamp
          const unreadCount = orderMessages.filter(
            msg => new Date(msg.created_at) > new Date(lastReadTimestamp)
          ).length;
          counts.set(orderId, unreadCount);
        } else {
          // All messages are unread
          counts.set(orderId, orderMessages.length);
        }
      });

      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error fetching unread message counts:', err);
    } finally {
      setLoading(false);
    }
  }, [orderIds]);

  /**
   * Mark all messages for an order as read
   */
  const markAsRead = useCallback((orderId: string) => {
    const now = new Date().toISOString();
    readTimestampsRef.current.set(orderId, now);
    
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.set(orderId, 0);
      return newCounts;
    });
  }, []);

  /**
   * Set up real-time subscription for new chat messages
   */
  useEffect(() => {
    if (orderIds.length === 0) {
      return;
    }

    console.log('Setting up real-time subscription for unread messages');

    // Create channel for all chat messages
    const channel = supabase
      .channel('unread-messages-tracker')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            order_id: string | null;
            direction: 'inbound' | 'outbound';
            created_at: string;
          };

          // Only track inbound messages for orders we're monitoring
          if (
            newMessage.direction === 'inbound' &&
            newMessage.order_id &&
            orderIds.includes(newMessage.order_id)
          ) {
            const lastReadTimestamp = readTimestampsRef.current.get(newMessage.order_id);
            
            // Only increment if message is after last read timestamp (or no read timestamp)
            if (!lastReadTimestamp || new Date(newMessage.created_at) > new Date(lastReadTimestamp)) {
              setUnreadCounts(prev => {
                const newCounts = new Map(prev);
                const currentCount = newCounts.get(newMessage.order_id!) || 0;
                newCounts.set(newMessage.order_id!, currentCount + 1);
                return newCounts;
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Unread messages subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up unread messages subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [orderIds]);

  /**
   * Fetch counts on mount and when orderIds change
   */
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  return {
    unreadCounts,
    loading,
    markAsRead,
  };
}
