import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { evolutionClient } from '@/integrations/whatsapp/evolution-client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Unified message interface for displaying both system notifications and chat messages
 */
export interface UnifiedMessage {
  id: string;
  type: 'system' | 'chat';
  direction: 'inbound' | 'outbound' | 'system';
  content: string;
  timestamp: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  notificationType?: string;
}

/**
 * WhatsApp notification from database
 */
interface WhatsAppNotification {
  id: string;
  order_id: string;
  customer_phone: string;
  notification_type: string;
  message_content: string;
  status: string;
  created_at: string;
}

/**
 * WhatsApp chat message from database
 */
interface WhatsAppChatMessage {
  id: string;
  order_id: string | null;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  evolution_id: string | null;
  created_at: string;
}

export interface UseOrderChatReturn {
  messages: UnifiedMessage[];
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  hasUnreadMessages: boolean;
  unreadCount: number;
}

/**
 * Hook for managing order chat messages and real-time updates
 * 
 * @param orderId - The order ID to fetch messages for
 * @param customerPhone - The customer's phone number for sending messages
 * @returns Chat state and functions
 */
export function useOrderChat(orderId: string | null, customerPhone: string | null): UseOrderChatReturn {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastReadTimestampRef = useRef<string | null>(null);

  /**
   * Map WhatsApp notification to unified message format
   */
  const mapNotificationToMessage = useCallback((notification: WhatsAppNotification): UnifiedMessage => {
    return {
      id: notification.id,
      type: 'system',
      direction: 'system',
      content: notification.message_content,
      timestamp: notification.created_at,
      notificationType: notification.notification_type,
    };
  }, []);

  /**
   * Map WhatsApp chat message to unified message format
   */
  const mapChatMessageToMessage = useCallback((chatMessage: WhatsAppChatMessage): UnifiedMessage => {
    return {
      id: chatMessage.id,
      type: 'chat',
      direction: chatMessage.direction,
      content: chatMessage.content,
      timestamp: chatMessage.created_at,
      status: chatMessage.status,
    };
  }, []);

  /**
   * Fetch all messages for the order
   */
  const fetchMessages = useCallback(async () => {
    if (!orderId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch system notifications
      const { data: notifications, error: notificationsError } = await supabase
        .from('whatsapp_notifications')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (notificationsError) {
        throw notificationsError;
      }

      // Fetch chat messages
      const { data: chatMessages, error: chatMessagesError } = await supabase
        .from('whatsapp_chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (chatMessagesError) {
        throw chatMessagesError;
      }

      // Map and merge messages
      const systemMessages = (notifications || []).map(mapNotificationToMessage);
      const chatMessagesUnified = (chatMessages || []).map(mapChatMessageToMessage);
      
      // Combine and sort by timestamp
      const allMessages = [...systemMessages, ...chatMessagesUnified].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setMessages(allMessages);

      // Calculate unread count (inbound messages after last read)
      const inboundMessages = chatMessages?.filter(msg => msg.direction === 'inbound') || [];
      if (inboundMessages.length > 0 && !lastReadTimestampRef.current) {
        setUnreadCount(inboundMessages.length);
      }

    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orderId, mapNotificationToMessage, mapChatMessageToMessage]);

  /**
   * Send a message to the customer
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!orderId || !customerPhone) {
      throw new Error('Order ID and customer phone are required to send messages');
    }

    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    console.log('[useOrderChat] Sending message:', {
      orderId,
      customerPhone,
      contentLength: content.trim().length,
    });

    try {
      // Send message via Evolution API first
      const response = await evolutionClient.sendTextMessage({
        number: customerPhone,
        text: content.trim(),
      });

      console.log('[useOrderChat] Evolution API response:', {
        messageId: response.key?.id,
        status: response.status,
      });

      // Insert outbound message into database
      const { data: insertedData, error: insertError } = await supabase
        .from('whatsapp_chat_messages')
        .insert({
          order_id: orderId,
          phone_number: customerPhone.replace(/\D/g, ''), // Normalize phone number
          direction: 'outbound',
          content: content.trim(),
          status: 'sent',
          evolution_id: response.key?.id || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[useOrderChat] Database insert error:', insertError);
        throw insertError;
      }

      console.log('[useOrderChat] Message inserted into database:', {
        messageId: insertedData?.id,
        orderId: insertedData?.order_id,
      });

      // Note: Real-time subscription will handle adding the message to the UI
      // No need for optimistic update as the INSERT event will trigger immediately

    } catch (err) {
      console.error('[useOrderChat] Error sending message:', err);
      
      // If Evolution API fails, we might want to insert with 'failed' status
      if (err instanceof Error && err.message.includes('Evolution API')) {
        try {
          await supabase
            .from('whatsapp_chat_messages')
            .insert({
              order_id: orderId,
              phone_number: customerPhone.replace(/\D/g, ''),
              direction: 'outbound',
              content: content.trim(),
              status: 'failed',
              evolution_id: null,
            });
        } catch (dbErr) {
          console.error('[useOrderChat] Failed to log failed message:', dbErr);
        }
      }
      
      throw err;
    }
  }, [orderId, customerPhone]);

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(() => {
    const now = new Date().toISOString();
    lastReadTimestampRef.current = now;
    setUnreadCount(0);
  }, []);

  /**
   * Set up real-time subscription for new chat messages
   */
  useEffect(() => {
    if (!orderId) {
      return;
    }

    console.log(`[useOrderChat] Setting up real-time subscription for order: ${orderId}`);

    // Create channel for this order's chat messages
    const channel = supabase
      .channel(`order-chat:${orderId}`, {
        config: {
          broadcast: { self: true }, // Receive our own messages
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('[useOrderChat] New chat message received via realtime:', {
            messageId: payload.new.id,
            direction: payload.new.direction,
            orderId: payload.new.order_id,
          });
          
          const newChatMessage = payload.new as WhatsAppChatMessage;
          const newMessage = mapChatMessageToMessage(newChatMessage);
          
          setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            if (prev.some(msg => msg.id === newMessage.id)) {
              console.log('[useOrderChat] Message already exists, skipping:', newMessage.id);
              return prev;
            }
            console.log('[useOrderChat] Adding new message to state:', newMessage.id);
            return [...prev, newMessage];
          });

          // Increment unread count for inbound messages
          if (newChatMessage.direction === 'inbound') {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useOrderChat] Real-time subscription status for order ${orderId}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[useOrderChat] Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useOrderChat] Real-time subscription error');
        } else if (status === 'TIMED_OUT') {
          console.error('[useOrderChat] Real-time subscription timed out');
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log(`[useOrderChat] Cleaning up real-time subscription for order: ${orderId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [orderId, mapChatMessageToMessage]);

  /**
   * Fetch messages on mount and when orderId changes
   */
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /**
   * Mark messages as read when component is visible
   */
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages.length, markAsRead]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    hasUnreadMessages: unreadCount > 0,
    unreadCount,
  };
}
