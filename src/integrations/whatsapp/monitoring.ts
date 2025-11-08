/**
 * WhatsApp Monitoring and Error Handling
 * 
 * This module provides comprehensive monitoring, error logging, and alerting
 * for the WhatsApp notification system.
 */

import { errorLogger, type ErrorStats } from './error-logger';
import { deliveryMonitor, TimePeriod, type DeliveryStats } from './delivery-monitor';

export {
  WhatsAppErrorLogger,
  errorLogger,
  WhatsAppErrorCategory,
  ErrorSeverity,
  type WhatsAppErrorLog,
  type ErrorStats,
} from './error-logger';

export {
  WhatsAppDeliveryMonitor,
  deliveryMonitor,
  TimePeriod,
  type DeliveryStats,
  type DeliveryRecord,
} from './delivery-monitor';

/**
 * Initialize monitoring system
 * 
 * Call this function to start automatic monitoring and alerting.
 * It will check delivery rates and error thresholds periodically.
 */
export function initializeMonitoring(): void {
  deliveryMonitor.startMonitoring();
  console.log('WhatsApp monitoring system initialized');
}

/**
 * Stop monitoring system
 * 
 * Call this function to stop automatic monitoring.
 */
export function stopMonitoring(): void {
  deliveryMonitor.stopMonitoring();
  console.log('WhatsApp monitoring system stopped');
}

/**
 * Get comprehensive system health status
 */
export async function getSystemHealth(): Promise<{
  delivery: DeliveryStats;
  errors: ErrorStats;
  alerts: any[];
  status: 'healthy' | 'warning' | 'critical';
}> {
  const [delivery, errors, alerts] = await Promise.all([
    deliveryMonitor.getDeliveryStats(TimePeriod.LAST_HOUR),
    errorLogger.getErrorStats(new Date(Date.now() - 60 * 60 * 1000)),
    deliveryMonitor.getUnresolvedAlerts(),
  ]);

  // Determine overall status
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  if (alerts.length > 0) {
    const hasCritical = alerts.some(a => a.alert_type === 'critical_error');
    status = hasCritical ? 'critical' : 'warning';
  } else if (delivery.failureRate > 10) {
    status = 'warning';
  } else if (errors.errorRate > 10) {
    status = 'warning';
  }

  return {
    delivery,
    errors,
    alerts,
    status,
  };
}
