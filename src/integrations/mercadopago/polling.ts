// Payment status polling service for MercadoPago
// Used as fallback when webhooks are not available or fail

import { supabase } from "@/integrations/supabase/client";
import { mercadoPagoService } from "./client";
import { notificationTriggers } from "@/integrations/whatsapp";
import { toast } from "sonner";

export interface PollingConfig {
  paymentId: string;
  orderId: string;
  maxAttempts?: number;
  intervalMs?: number;
  timeoutMs?: number;
  onStatusChange?: (status: string) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

export class PaymentPollingService {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private pollingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start polling for payment status
   */
  startPolling(config: PollingConfig): void {
    const {
      paymentId,
      orderId,
      maxAttempts = 90, // Poll for ~15 minutes at 10s intervals
      intervalMs = 10000, // 10 seconds - more spaced out
      timeoutMs = 15 * 60 * 1000, // 15 minutes total timeout
      onStatusChange,
      onSuccess,
      onError,
      onTimeout
    } = config;

    // Clear any existing polling for this payment
    this.stopPolling(paymentId);

    let attempts = 0;
    let lastStatus = 'pending';

    // Set overall timeout
    const timeoutId = setTimeout(() => {
      this.stopPolling(paymentId);
      this.handlePaymentTimeout(orderId);
      onTimeout?.();
    }, timeoutMs);

    this.pollingTimeouts.set(paymentId, timeoutId);

    // Progressive polling: start frequent, then space out
    const getPollingInterval = (attempt: number): number => {
      if (attempt <= 10) return 5000;  // First 50 seconds: every 5s
      if (attempt <= 30) return 10000; // Next 3.5 minutes: every 10s
      return 15000; // Remaining time: every 15s
    };

    const scheduleNextPoll = () => {
      const nextInterval = getPollingInterval(attempts);
      const timeoutId = setTimeout(pollOnce, nextInterval);
      this.pollingIntervals.set(paymentId, timeoutId);
    };

    const pollOnce = async () => {
      attempts++;

      try {
        const paymentStatus = await mercadoPagoService.checkPaymentStatus(paymentId);
        
        console.log('Payment polling check:', { 
          paymentId, 
          attempt: attempts, 
          status: paymentStatus.status, 
          lastStatus 
        });
        
        // Check if status changed
        if (paymentStatus.status !== lastStatus) {
          lastStatus = paymentStatus.status;
          console.log('Payment status changed:', { from: lastStatus, to: paymentStatus.status });
          onStatusChange?.(paymentStatus.status);
        }

        // Handle final statuses
        if (paymentStatus.status === 'approved') {
          console.log('Payment approved! Updating order status...', { orderId, paymentId });
          await this.handlePaymentApproved(orderId, paymentId);
          this.stopPolling(paymentId);
          onSuccess?.();
          return;
        }

        if (paymentStatus.status === 'rejected' || paymentStatus.status === 'cancelled') {
          await this.handlePaymentRejected(orderId, paymentStatus.status);
          this.stopPolling(paymentId);
          onError?.(new Error(`Payment ${paymentStatus.status}: ${paymentStatus.statusDetail}`));
          return;
        }

        // Continue polling if not finished
        if (attempts < maxAttempts) {
          scheduleNextPoll();
        } else {
          this.stopPolling(paymentId);
          onTimeout?.();
        }

      } catch (error) {
        console.error('Error polling payment status:', error);
        
        // Stop polling on repeated errors
        if (attempts >= 5) {
          this.stopPolling(paymentId);
          onError?.(error as Error);
        } else {
          // Continue polling even after errors, but with longer interval
          setTimeout(() => scheduleNextPoll(), 20000); // Wait 20s after error
        }
      }
    };

    // Start the first poll immediately
    setTimeout(pollOnce, 2000); // Wait 2s before first poll
  }

  /**
   * Stop polling for a specific payment
   */
  stopPolling(paymentId: string): void {
    const intervalId = this.pollingIntervals.get(paymentId);
    const timeoutId = this.pollingTimeouts.get(paymentId);

    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(paymentId);
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      this.pollingTimeouts.delete(paymentId);
    }
  }

  /**
   * Stop all active polling
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.pollingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.pollingIntervals.clear();
    this.pollingTimeouts.clear();
  }

  /**
   * Handle approved payment
   */
  private async handlePaymentApproved(orderId: string, paymentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'in_preparation',
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status to in_preparation:', error);
        throw error;
      }

      console.log('Payment approved via polling, sent to kitchen:', { orderId, paymentId });
      toast.success('Pagamento aprovado! Pedido enviado para a cozinha.');

      // Trigger WhatsApp payment confirmation notification
      await notificationTriggers.onPaymentConfirmed(orderId);

    } catch (error) {
      console.error('Error handling approved payment:', error);
      throw error;
    }
  }

  /**
   * Handle rejected or cancelled payment
   */
  private async handlePaymentRejected(orderId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled'
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status to cancelled:', error);
        throw error;
      }

      console.log('Payment rejected via polling:', { orderId, status });
      toast.error('Pagamento rejeitado. Tente novamente.');

    } catch (error) {
      console.error('Error handling rejected payment:', error);
      throw error;
    }
  }

  /**
   * Handle payment timeout
   */
  private async handlePaymentTimeout(orderId: string): Promise<void> {
    try {
      // First check if payment was already processed to avoid race conditions
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status, payment_confirmed_at')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('Error fetching order for timeout handling:', fetchError);
        throw fetchError;
      }

      // Don't expire if payment was already confirmed
      if (currentOrder?.status === 'paid' || currentOrder?.payment_confirmed_at) {
        console.log('Payment was already confirmed, skipping timeout:', { orderId });
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'expired'
        })
        .eq('id', orderId)
        .eq('status', 'pending_payment'); // Only update if still pending

      if (error) {
        console.error('Error updating order status to expired:', error);
        throw error;
      }

      console.log('Payment expired via polling timeout:', { orderId });
      toast.error('Pagamento expirado. Gere um novo pagamento.');

    } catch (error) {
      console.error('Error handling payment timeout:', error);
      throw error;
    }
  }

  /**
   * Get active polling status
   */
  isPolling(paymentId: string): boolean {
    return this.pollingIntervals.has(paymentId);
  }

  /**
   * Get all active polling payment IDs
   */
  getActivePolling(): string[] {
    return Array.from(this.pollingIntervals.keys());
  }
}

// Export singleton instance
export const paymentPollingService = new PaymentPollingService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    paymentPollingService.stopAllPolling();
  });
}