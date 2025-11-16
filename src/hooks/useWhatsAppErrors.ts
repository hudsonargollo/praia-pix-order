import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppError {
  id: string;
  category: string;
  severity: string;
  error_message: string;
  error_stack?: string;
  context: Record<string, any>;
  order_id?: string;
  customer_phone?: string;
  notification_id?: string;
  is_retryable: boolean;
  created_at: string;
}

/**
 * Hook to fetch WhatsApp errors for specific orders
 */
export function useWhatsAppErrors(orderIds: string[]) {
  const [errors, setErrors] = useState<Map<string, WhatsAppError[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderIds.length === 0) {
      setErrors(new Map());
      setLoading(false);
      return;
    }

    loadErrors();
  }, [orderIds.join(',')]);

  const loadErrors = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_error_logs')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading WhatsApp errors:', error);
        return;
      }

      // Group errors by order_id
      const errorMap = new Map<string, WhatsAppError[]>();
      data?.forEach((err) => {
        if (err.order_id) {
          const orderErrors = errorMap.get(err.order_id) || [];
          orderErrors.push(err as WhatsAppError);
          errorMap.set(err.order_id, orderErrors);
        }
      });

      setErrors(errorMap);
    } catch (error) {
      console.error('Error loading WhatsApp errors:', error);
    } finally {
      setLoading(false);
    }
  };

  return { errors, loading, refresh: loadErrors };
}

/**
 * Hook to fetch all WhatsApp errors with optional filters
 */
export function useAllWhatsAppErrors(filters?: {
  category?: string;
  severity?: string;
  since?: Date;
  limit?: number;
}) {
  const [errors, setErrors] = useState<WhatsAppError[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadErrors();
  }, [filters?.category, filters?.severity, filters?.since?.toISOString(), filters?.limit]);

  const loadErrors = async () => {
    try {
      let query = supabase
        .from('whatsapp_error_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.since) {
        query = query.gte('created_at', filters.since.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading WhatsApp errors:', error);
        return;
      }

      setErrors((data || []) as WhatsAppError[]);
    } catch (error) {
      console.error('Error loading WhatsApp errors:', error);
    } finally {
      setLoading(false);
    }
  };

  return { errors, loading, refresh: loadErrors };
}
