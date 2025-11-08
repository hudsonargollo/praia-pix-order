import { supabase } from '../supabase/client';
import { errorLogger, WhatsAppErrorCategory, ErrorSeverity } from './error-logger';

/**
 * Delivery statistics interface
 */
export interface DeliveryStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  deliveryRate: number; // Percentage
  averageDeliveryTime: number; // Milliseconds
  failureRate: number; // Percentage
  recentDeliveries: DeliveryRecord[];
}

/**
 * Delivery record interface
 */
export interface DeliveryRecord {
  id: string;
  orderId: string;
  customerPhone: string;
  notificationType: string;
  status: 'sent' | 'failed' | 'pending';
  attempts: number;
  deliveryTime?: number; // Milliseconds from scheduled to sent
  errorMessage?: string;
  createdAt: Date;
  sentAt?: Date;
}

/**
 * Time period for statistics
 */
export enum TimePeriod {
  LAST_HOUR = 'last_hour',
  LAST_24_HOURS = 'last_24_hours',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
}

/**
 * Alert configuration
 */
interface AlertConfig {
  failureRateThreshold: number; // Percentage
  checkIntervalMs: number;
  minSampleSize: number; // Minimum notifications to trigger alert
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  failureRateThreshold: 10, // Alert if failure rate exceeds 10%
  checkIntervalMs: 60 * 60 * 1000, // Check every hour
  minSampleSize: 10, // Need at least 10 notifications
};

/**
 * WhatsApp Delivery Rate Monitor
 * Tracks message delivery rates and triggers alerts for high failure rates
 */
export class WhatsAppDeliveryMonitor {
  private alertConfig: AlertConfig;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private lastAlertTime: Date | null = null;

  constructor(config: Partial<AlertConfig> = {}) {
    this.alertConfig = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  /**
   * Get delivery statistics for a time period
   */
  async getDeliveryStats(period: TimePeriod = TimePeriod.LAST_24_HOURS): Promise<DeliveryStats> {
    const since = this.getTimePeriodDate(period);

    try {
      const { data: notifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch delivery stats:', error);
        return this.getEmptyStats();
      }

      if (!notifications || notifications.length === 0) {
        return this.getEmptyStats();
      }

      // Calculate statistics
      const totalSent = notifications.filter(n => n.status === 'sent').length;
      const totalFailed = notifications.filter(n => n.status === 'failed').length;
      const totalPending = notifications.filter(n => n.status === 'pending').length;
      const totalProcessed = totalSent + totalFailed;

      const deliveryRate = totalProcessed > 0 ? (totalSent / totalProcessed) * 100 : 0;
      const failureRate = totalProcessed > 0 ? (totalFailed / totalProcessed) * 100 : 0;

      // Calculate average delivery time
      const deliveryTimes = notifications
        .filter(n => n.status === 'sent' && n.sent_at && n.scheduled_at)
        .map(n => {
          const scheduled = new Date(n.scheduled_at).getTime();
          const sent = new Date(n.sent_at).getTime();
          return sent - scheduled;
        });

      const averageDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
        : 0;

      // Get recent deliveries
      const recentDeliveries = notifications.slice(0, 20).map(n => ({
        id: n.id,
        orderId: n.order_id,
        customerPhone: n.customer_phone,
        notificationType: n.notification_type,
        status: n.status,
        attempts: n.attempts,
        deliveryTime: n.sent_at && n.scheduled_at
          ? new Date(n.sent_at).getTime() - new Date(n.scheduled_at).getTime()
          : undefined,
        errorMessage: n.error_message,
        createdAt: new Date(n.created_at),
        sentAt: n.sent_at ? new Date(n.sent_at) : undefined,
      }));

      return {
        totalSent,
        totalFailed,
        totalPending,
        deliveryRate,
        averageDeliveryTime,
        failureRate,
        recentDeliveries,
      };
    } catch (error) {
      console.error('Error calculating delivery stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get delivery statistics by notification type
   */
  async getStatsByType(period: TimePeriod = TimePeriod.LAST_24_HOURS): Promise<Record<string, DeliveryStats>> {
    const since = this.getTimePeriodDate(period);

    try {
      const { data: notifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('*')
        .gte('created_at', since.toISOString());

      if (error || !notifications) {
        console.error('Failed to fetch stats by type:', error);
        return {};
      }

      // Group by notification type
      const byType = notifications.reduce((acc, n) => {
        if (!acc[n.notification_type]) {
          acc[n.notification_type] = [];
        }
        acc[n.notification_type].push(n);
        return acc;
      }, {} as Record<string, any[]>);

      // Calculate stats for each type
      const statsByType: Record<string, DeliveryStats> = {};

      for (const [type, typeNotifications] of Object.entries(byType)) {
        const totalSent = typeNotifications.filter(n => n.status === 'sent').length;
        const totalFailed = typeNotifications.filter(n => n.status === 'failed').length;
        const totalPending = typeNotifications.filter(n => n.status === 'pending').length;
        const totalProcessed = totalSent + totalFailed;

        const deliveryRate = totalProcessed > 0 ? (totalSent / totalProcessed) * 100 : 0;
        const failureRate = totalProcessed > 0 ? (totalFailed / totalProcessed) * 100 : 0;

        const deliveryTimes = typeNotifications
          .filter(n => n.status === 'sent' && n.sent_at && n.scheduled_at)
          .map(n => new Date(n.sent_at).getTime() - new Date(n.scheduled_at).getTime());

        const averageDeliveryTime = deliveryTimes.length > 0
          ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
          : 0;

        statsByType[type] = {
          totalSent,
          totalFailed,
          totalPending,
          deliveryRate,
          averageDeliveryTime,
          failureRate,
          recentDeliveries: [],
        };
      }

      return statsByType;
    } catch (error) {
      console.error('Error calculating stats by type:', error);
      return {};
    }
  }

  /**
   * Check delivery rates and trigger alerts if thresholds are exceeded
   */
  async checkAndAlert(): Promise<void> {
    try {
      const stats = await this.getDeliveryStats(TimePeriod.LAST_HOUR);

      // Check if we have enough data
      const totalProcessed = stats.totalSent + stats.totalFailed;
      if (totalProcessed < this.alertConfig.minSampleSize) {
        console.log('Not enough data for alerting:', { totalProcessed, minRequired: this.alertConfig.minSampleSize });
        return;
      }

      // Check failure rate threshold
      if (stats.failureRate > this.alertConfig.failureRateThreshold) {
        await this.triggerFailureRateAlert(stats);
      }

      // Check for connection issues (high pending count)
      if (stats.totalPending > 20 && stats.totalPending > totalProcessed * 0.5) {
        await this.triggerHighPendingAlert(stats);
      }

      // Check for slow delivery times (> 5 minutes average)
      if (stats.averageDeliveryTime > 5 * 60 * 1000) {
        await this.triggerSlowDeliveryAlert(stats);
      }

    } catch (error) {
      console.error('Error in delivery monitoring check:', error);
      await errorLogger.logError(error as Error, {
        operation: 'delivery_monitoring_check',
      });
    }
  }

  /**
   * Trigger alert for high failure rate
   */
  private async triggerFailureRateAlert(stats: DeliveryStats): Promise<void> {
    // Avoid duplicate alerts within 1 hour
    if (this.lastAlertTime && Date.now() - this.lastAlertTime.getTime() < 60 * 60 * 1000) {
      console.log('Skipping alert - too soon since last alert');
      return;
    }

    const alertMessage = `High WhatsApp failure rate detected: ${stats.failureRate.toFixed(1)}% (${stats.totalFailed}/${stats.totalSent + stats.totalFailed} messages failed)`;

    console.error('🚨 DELIVERY ALERT:', alertMessage);

    // Store alert
    await supabase.from('whatsapp_alerts').insert({
      alert_type: 'high_failure_rate',
      category: 'message_delivery',
      message: alertMessage,
      metadata: {
        stats,
        threshold: this.alertConfig.failureRateThreshold,
      },
      created_at: new Date().toISOString(),
    });

    this.lastAlertTime = new Date();

    // Future: Send notification to administrators
  }

  /**
   * Trigger alert for high pending count
   */
  private async triggerHighPendingAlert(stats: DeliveryStats): Promise<void> {
    const alertMessage = `High pending notification count: ${stats.totalPending} messages waiting to be sent`;

    console.warn('⚠️ DELIVERY WARNING:', alertMessage);

    await supabase.from('whatsapp_alerts').insert({
      alert_type: 'high_pending_count',
      category: 'connection',
      message: alertMessage,
      metadata: { stats },
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Trigger alert for slow delivery times
   */
  private async triggerSlowDeliveryAlert(stats: DeliveryStats): Promise<void> {
    const avgMinutes = (stats.averageDeliveryTime / 1000 / 60).toFixed(1);
    const alertMessage = `Slow message delivery detected: average ${avgMinutes} minutes`;

    console.warn('⚠️ DELIVERY WARNING:', alertMessage);

    await supabase.from('whatsapp_alerts').insert({
      alert_type: 'slow_delivery',
      category: 'message_delivery',
      message: alertMessage,
      metadata: { stats },
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Start automatic monitoring
   */
  startMonitoring(): void {
    if (this.monitoringTimer) {
      console.warn('Monitoring already started');
      return;
    }

    console.log('Starting WhatsApp delivery monitoring');
    
    // Run initial check
    this.checkAndAlert().catch(err => console.error('Error in initial monitoring check:', err));

    // Schedule periodic checks
    this.monitoringTimer = setInterval(() => {
      this.checkAndAlert().catch(err => console.error('Error in monitoring check:', err));
    }, this.alertConfig.checkIntervalMs);
  }

  /**
   * Stop automatic monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('Stopped WhatsApp delivery monitoring');
    }
  }

  /**
   * Get unresolved alerts
   */
  async getUnresolvedAlerts(): Promise<any[]> {
    try {
      const { data: alerts, error } = await supabase
        .from('whatsapp_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch unresolved alerts:', error);
        return [];
      }

      return alerts || [];
    } catch (error) {
      console.error('Error fetching unresolved alerts:', error);
      return [];
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) {
        console.error('Failed to resolve alert:', error);
        throw error;
      }

      console.log('Alert resolved:', alertId);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get delivery trends over time
   */
  async getDeliveryTrends(days: number = 7): Promise<Array<{
    date: string;
    sent: number;
    failed: number;
    deliveryRate: number;
  }>> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const { data: notifications, error } = await supabase
        .from('whatsapp_notifications')
        .select('created_at, status')
        .gte('created_at', since.toISOString());

      if (error || !notifications) {
        console.error('Failed to fetch delivery trends:', error);
        return [];
      }

      // Group by date
      const byDate = notifications.reduce((acc, n) => {
        const date = new Date(n.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { sent: 0, failed: 0 };
        }
        if (n.status === 'sent') acc[date].sent++;
        if (n.status === 'failed') acc[date].failed++;
        return acc;
      }, {} as Record<string, { sent: number; failed: number }>);

      // Convert to array and calculate rates
      return Object.entries(byDate).map(([date, stats]) => ({
        date,
        sent: stats.sent,
        failed: stats.failed,
        deliveryRate: stats.sent + stats.failed > 0
          ? (stats.sent / (stats.sent + stats.failed)) * 100
          : 0,
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error calculating delivery trends:', error);
      return [];
    }
  }

  // Helper methods

  private getTimePeriodDate(period: TimePeriod): Date {
    const now = Date.now();
    switch (period) {
      case TimePeriod.LAST_HOUR:
        return new Date(now - 60 * 60 * 1000);
      case TimePeriod.LAST_24_HOURS:
        return new Date(now - 24 * 60 * 60 * 1000);
      case TimePeriod.LAST_7_DAYS:
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case TimePeriod.LAST_30_DAYS:
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now - 24 * 60 * 60 * 1000);
    }
  }

  private getEmptyStats(): DeliveryStats {
    return {
      totalSent: 0,
      totalFailed: 0,
      totalPending: 0,
      deliveryRate: 0,
      averageDeliveryTime: 0,
      failureRate: 0,
      recentDeliveries: [],
    };
  }
}

// Export singleton instance
export const deliveryMonitor = new WhatsAppDeliveryMonitor();
