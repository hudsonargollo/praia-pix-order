import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type WhatsAppNotification = Tables<'whatsapp_notifications'>;

export interface NotificationHistory {
  orderId: string;
  notifications: WhatsAppNotification[];
  lastNotification?: WhatsAppNotification;
  hasFailedNotifications: boolean;
  totalAttempts: number;
}

export function useNotificationHistory(orderIds: string[]) {
  const [history, setHistory] = useState<Map<string, NotificationHistory>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderIds.length === 0) {
      setHistory(new Map());
      setLoading(false);
      return;
    }

    loadNotificationHistory();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('notification-history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_notifications',
          filter: `order_id=in.(${orderIds.join(',')})`,
        },
        () => {
          loadNotificationHistory();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderIds.join(',')]);

  const loadNotificationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_notifications')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const historyMap = new Map<string, NotificationHistory>();

      orderIds.forEach(orderId => {
        const orderNotifications = (data || []).filter(n => n.order_id === orderId);
        const lastNotification = orderNotifications[0];
        const hasFailedNotifications = orderNotifications.some(n => n.status === 'failed');
        const totalAttempts = orderNotifications.reduce((sum, n) => sum + n.attempts, 0);

        historyMap.set(orderId, {
          orderId,
          notifications: orderNotifications,
          lastNotification,
          hasFailedNotifications,
          totalAttempts,
        });
      });

      setHistory(historyMap);
    } catch (error) {
      console.error('Error loading notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, refresh: loadNotificationHistory };
}
