// WhatsApp notification recovery service
import { supabase } from "@/integrations/supabase/client";
import { whatsappService } from "./service";
import { toast } from "sonner";
import type { OrderData } from "./types";

export interface NotificationRecoveryOptions {
  orderId: string;
  maxRetryAttempts?: number;
  retryDelayMs?: number;
  notificationTypes?: string[];
}

export class WhatsAppRecoveryService {
  private static readonly MAX_RETRY_ATTEMPTS = 5;
  private static readonly RETRY_DELAY_MS = 30000; // 30 seconds
  private static readonly recoveryAttempts = new Map<string, number>();
  private static readonly activeRecoveries = new Set<string>();

  /**
   * Recover all failed notifications for an order
   */
  static async recoverFailedNotifications(options: NotificationRecoveryOptions): Promise<boolean> {
    const { 
      orderId, 
      maxRetryAttempts = this.MAX_RETRY_ATTEMPTS,
      retryDelayMs = this.RETRY_DELAY_MS,
      notificationTypes = ['confirmation', 'ready', 'status_update', 'custom']
    } = options;

    // Prevent concurrent recovery for the same order
    if (this.activeRecoveries.has(orderId)) {
      console.log('Recovery already in progress for order:', orderId);
      return false;
    }

    try {
      this.activeRecoveries.add(orderId);

      // Check current recovery attempts
      const currentAttempts = this.recoveryAttempts.get(orderId) || 0;
      if (currentAttempts >= maxRetryAttempts) {
        console.error(`Max recovery attempts reached for order ${orderId}`);
        toast.error('Máximo de tentativas de reenvio atingido. Entre em contato com o suporte.');
        return false;
      }

      // Increment recovery attempts
      this.recoveryAttempts.set(orderId, currentAttempts + 1);

      // Get failed notifications
      const { data: failedNotifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'failed')
        .in('message_type', notificationTypes)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching failed notifications:', error);
        return false;
      }

      if (!failedNotifications || failedNotifications.length === 0) {
        console.log('No failed notifications to recover for order:', orderId);
        return true;
      }

      console.log(`Starting recovery for ${failedNotifications.length} failed notifications`);

      // Wait before starting recovery
      await this.sleep(retryDelayMs);

      // Retry notifications using the service's retry mechanism
      await whatsappService.retryFailedNotifications(orderId);

      // Check if recovery was successful
      const recoverySuccess = await this.verifyRecoverySuccess(orderId, failedNotifications.length);
      
      if (recoverySuccess) {
        this.recoveryAttempts.delete(orderId);
        toast.success('Notificações reenviadas com sucesso!');
        return true;
      } else {
        // Schedule another recovery attempt if within limits
        if (currentAttempts < maxRetryAttempts - 1) {
          setTimeout(() => {
            this.recoverFailedNotifications(options);
          }, retryDelayMs * 2); // Double the delay for next attempt
        }
        return false;
      }

    } catch (error) {
      console.error('Error during notification recovery:', error);
      toast.error('Erro durante recuperação de notificações.');
      return false;
    } finally {
      this.activeRecoveries.delete(orderId);
    }
  }

  /**
   * Verify if recovery was successful
   */
  private static async verifyRecoverySuccess(orderId: string, originalFailedCount: number): Promise<boolean> {
    try {
      const { data: currentFailedNotifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('id')
        .eq('order_id', orderId)
        .eq('status', 'failed');

      if (error) {
        console.error('Error verifying recovery success:', error);
        return false;
      }

      const currentFailedCount = currentFailedNotifications?.length || 0;
      const recoveredCount = originalFailedCount - currentFailedCount;
      
      console.log(`Recovery verification: ${recoveredCount}/${originalFailedCount} notifications recovered`);
      
      return recoveredCount > 0; // Success if at least one notification was recovered
    } catch (error) {
      console.error('Error in recovery verification:', error);
      return false;
    }
  }

  /**
   * Schedule automatic recovery for failed notifications
   */
  static scheduleAutomaticRecovery(orderId: string, delayMs: number = 60000): void {
    setTimeout(async () => {
      try {
        await this.recoverFailedNotifications({ orderId });
      } catch (error) {
        console.error('Error in scheduled recovery:', error);
      }
    }, delayMs);
  }

  /**
   * Bulk recovery for multiple orders
   */
  static async bulkRecovery(orderIds: string[]): Promise<{ successful: string[]; failed: string[] }> {
    const results = { successful: [] as string[], failed: [] as string[] };

    for (const orderId of orderIds) {
      try {
        const success = await this.recoverFailedNotifications({ orderId });
        if (success) {
          results.successful.push(orderId);
        } else {
          results.failed.push(orderId);
        }
        
        // Add delay between bulk recoveries to avoid rate limiting
        await this.sleep(5000);
      } catch (error) {
        console.error(`Bulk recovery failed for order ${orderId}:`, error);
        results.failed.push(orderId);
      }
    }

    return results;
  }

  /**
   * Get recovery statistics
   */
  static async getRecoveryStats(): Promise<{
    totalFailedNotifications: number;
    ordersWithFailedNotifications: number;
    averageFailuresPerOrder: number;
  }> {
    try {
      const { data: failedNotifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('order_id')
        .eq('status', 'failed');

      if (error) {
        console.error('Error fetching recovery stats:', error);
        return { totalFailedNotifications: 0, ordersWithFailedNotifications: 0, averageFailuresPerOrder: 0 };
      }

      const totalFailedNotifications = failedNotifications?.length || 0;
      const uniqueOrders = new Set(failedNotifications?.map(n => n.order_id) || []);
      const ordersWithFailedNotifications = uniqueOrders.size;
      const averageFailuresPerOrder = ordersWithFailedNotifications > 0 
        ? totalFailedNotifications / ordersWithFailedNotifications 
        : 0;

      return {
        totalFailedNotifications,
        ordersWithFailedNotifications,
        averageFailuresPerOrder: Math.round(averageFailuresPerOrder * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating recovery stats:', error);
      return { totalFailedNotifications: 0, ordersWithFailedNotifications: 0, averageFailuresPerOrder: 0 };
    }
  }

  /**
   * Clean up old recovery attempts
   */
  static cleanupRecoveryAttempts(): void {
    this.recoveryAttempts.clear();
    this.activeRecoveries.clear();
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
   * Check if recovery is active for an order
   */
  static isRecoveryActive(orderId: string): boolean {
    return this.activeRecoveries.has(orderId);
  }

  /**
   * Sleep utility for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle critical notification failures that require immediate attention
   */
  static async handleCriticalFailure(orderId: string, notificationType: string): Promise<void> {
    try {
      console.error(`Critical notification failure: ${notificationType} for order ${orderId}`);
      
      // Log critical failure
      toast.error(
        `Falha crítica na notificação ${notificationType}. Verifique manualmente o pedido ${orderId}.`,
        { duration: 15000 }
      );

      // Could implement additional alerting here (email to admin, etc.)
      
    } catch (error) {
      console.error('Error handling critical failure:', error);
    }
  }
}

export const whatsappRecoveryService = WhatsAppRecoveryService;