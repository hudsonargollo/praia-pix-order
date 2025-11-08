// Payment recovery utilities for handling failed payments
import { supabase } from "@/integrations/supabase/client";
import { mercadoPagoService } from "./client";
import { paymentPollingService } from "./polling";
import { toast } from "sonner";

export interface PaymentRecoveryOptions {
  orderId: string;
  maxRecoveryAttempts?: number;
  recoveryDelayMs?: number;
}

export class PaymentRecoveryService {
  private static readonly MAX_RECOVERY_ATTEMPTS = 3;
  private static readonly RECOVERY_DELAY_MS = 5000; // 5 seconds
  private static readonly recoveryAttempts = new Map<string, number>();

  /**
   * Attempt to recover a failed payment by recreating it
   */
  static async recoverPayment(options: PaymentRecoveryOptions): Promise<boolean> {
    const { orderId, maxRecoveryAttempts = this.MAX_RECOVERY_ATTEMPTS } = options;
    
    try {
      // Check current recovery attempts
      const currentAttempts = this.recoveryAttempts.get(orderId) || 0;
      if (currentAttempts >= maxRecoveryAttempts) {
        console.error(`Max recovery attempts reached for order ${orderId}`);
        toast.error('Não foi possível processar o pagamento. Entre em contato com o suporte.');
        return false;
      }

      // Increment recovery attempts
      this.recoveryAttempts.set(orderId, currentAttempts + 1);

      // Get order data
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order for recovery:', orderError);
        return false;
      }

      // Only recover if order is in a recoverable state
      if (!['pending_payment', 'expired', 'cancelled'].includes(order.status)) {
        console.log('Order not in recoverable state:', order.status);
        return false;
      }

      // Wait before recovery attempt
      await this.sleep(options.recoveryDelayMs || this.RECOVERY_DELAY_MS);

      // Create new payment
      const paymentResponse = await mercadoPagoService.createPayment({
        orderId: order.id,
        amount: order.total_amount,
        description: `Pedido #${order.order_number} - ${order.customer_name}`,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        tableNumber: order.table_number
      });

      // Update order with new payment data
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'pending_payment',
          mercadopago_payment_id: paymentResponse.id,
          qr_code_data: paymentResponse.qrCodeBase64,
          pix_copy_paste: paymentResponse.pixCopyPaste,
          payment_expires_at: paymentResponse.expirationDate
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order with recovery payment:', updateError);
        return false;
      }

      // Start polling for the new payment
      paymentPollingService.startPolling({
        paymentId: paymentResponse.id,
        orderId: orderId,
        onSuccess: () => {
          this.recoveryAttempts.delete(orderId);
          toast.success('Pagamento processado com sucesso!');
        },
        onError: (error) => {
          console.error('Recovery payment failed:', error);
          // Attempt another recovery if within limits
          setTimeout(() => {
            this.recoverPayment(options);
          }, this.RECOVERY_DELAY_MS);
        },
        onTimeout: () => {
          console.error('Recovery payment timed out');
          // Attempt another recovery if within limits
          setTimeout(() => {
            this.recoverPayment(options);
          }, this.RECOVERY_DELAY_MS);
        }
      });

      console.log('Payment recovery initiated:', { orderId, paymentId: paymentResponse.id });
      toast.info('Tentando processar o pagamento novamente...');
      
      return true;

    } catch (error) {
      console.error('Error during payment recovery:', error);
      
      // Attempt another recovery if within limits
      const currentAttempts = this.recoveryAttempts.get(orderId) || 0;
      if (currentAttempts < maxRecoveryAttempts) {
        setTimeout(() => {
          this.recoverPayment(options);
        }, this.RECOVERY_DELAY_MS);
      } else {
        toast.error('Não foi possível processar o pagamento. Entre em contato com o suporte.');
      }
      
      return false;
    }
  }

  /**
   * Check if an order can be recovered
   */
  static canRecoverOrder(orderStatus: string): boolean {
    return ['pending_payment', 'expired', 'cancelled'].includes(orderStatus);
  }

  /**
   * Get recovery attempt count for an order
   */
  static getRecoveryAttempts(orderId: string): number {
    return this.recoveryAttempts.get(orderId) || 0;
  }

  /**
   * Reset recovery attempts for an order
   */
  static resetRecoveryAttempts(orderId: string): void {
    this.recoveryAttempts.delete(orderId);
  }

  /**
   * Clean up old recovery attempts
   */
  static cleanupRecoveryAttempts(): void {
    this.recoveryAttempts.clear();
  }

  /**
   * Sleep utility for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle expired payments by offering recovery options
   */
  static async handleExpiredPayment(orderId: string): Promise<void> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('status, customer_name')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        console.error('Error fetching expired order:', error);
        return;
      }

      if (order.status === 'expired') {
        toast.error(
          `Pagamento expirado para ${order.customer_name}. Clique aqui para gerar um novo pagamento.`,
          {
            duration: 10000,
            action: {
              label: 'Novo Pagamento',
              onClick: () => this.recoverPayment({ orderId })
            }
          }
        );
      }
    } catch (error) {
      console.error('Error handling expired payment:', error);
    }
  }
}

export const paymentRecoveryService = PaymentRecoveryService;