import { supabase } from '../supabase/client';

/**
 * Error categories for WhatsApp operations
 */
export enum WhatsAppErrorCategory {
  CONNECTION = 'connection',
  AUTHENTICATION = 'authentication',
  MESSAGE_DELIVERY = 'message_delivery',
  PHONE_VALIDATION = 'phone_validation',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  DATABASE = 'database',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error log entry interface
 */
export interface WhatsAppErrorLog {
  id?: string;
  category: WhatsAppErrorCategory;
  severity: ErrorSeverity;
  errorMessage: string;
  errorStack?: string;
  context: Record<string, any>;
  orderId?: string;
  customerPhone?: string;
  notificationId?: string;
  isRetryable: boolean;
  timestamp: Date;
}

/**
 * Error statistics interface
 */
export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<WhatsAppErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrors: WhatsAppErrorLog[];
  errorRate: number; // Errors per hour
}

/**
 * WhatsApp Error Logger
 * Provides comprehensive error logging and tracking for WhatsApp operations
 */
export class WhatsAppErrorLogger {
  /**
   * Log an error with categorization and context
   * NOTE: Message content is NOT logged to protect customer privacy
   */
  async logError(
    error: Error,
    context: {
      operation: string;
      orderId?: string;
      customerPhone?: string;
      notificationId?: string;
      additionalData?: Record<string, any>;
    }
  ): Promise<void> {
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(category, error);
    const isRetryable = this.isRetryableError(error);

    // Sanitize context to remove message content
    const sanitizedContext = this.sanitizeContext({
      operation: context.operation,
      ...context.additionalData,
    });

    const errorLog: WhatsAppErrorLog = {
      category,
      severity,
      errorMessage: error.message,
      errorStack: error.stack,
      context: sanitizedContext,
      orderId: context.orderId,
      customerPhone: context.customerPhone,
      notificationId: context.notificationId,
      isRetryable,
      timestamp: new Date(),
    };

    // Log to console with appropriate level
    this.logToConsole(errorLog);

    // Store in database
    await this.storeErrorLog(errorLog);

    // Check if alerting is needed
    await this.checkAlertThresholds(category, severity);
  }

  /**
   * Sanitize context to remove sensitive data like message content
   * This ensures we comply with privacy requirements
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };
    
    // Remove message content fields
    const sensitiveFields = [
      'message',
      'messageContent',
      'message_content',
      'text',
      'body',
      'content',
      'customMessage',
      'custom_message',
    ];

    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeContext(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * Categorize error based on error message and type
   */
  private categorizeError(error: Error): WhatsAppErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes('connection') || message.includes('disconnect') || message.includes('websocket')) {
      return WhatsAppErrorCategory.CONNECTION;
    }

    if (message.includes('auth') || message.includes('credential') || message.includes('session')) {
      return WhatsAppErrorCategory.AUTHENTICATION;
    }

    if (message.includes('phone') || message.includes('number') || message.includes('invalid format')) {
      return WhatsAppErrorCategory.PHONE_VALIDATION;
    }

    if (message.includes('rate limit') || message.includes('429') || message.includes('throttle')) {
      return WhatsAppErrorCategory.RATE_LIMIT;
    }

    if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused')) {
      return WhatsAppErrorCategory.NETWORK;
    }

    if (message.includes('database') || message.includes('supabase') || message.includes('query')) {
      return WhatsAppErrorCategory.DATABASE;
    }

    if (message.includes('config') || message.includes('not configured') || message.includes('missing')) {
      return WhatsAppErrorCategory.CONFIGURATION;
    }

    if (message.includes('send') || message.includes('deliver') || message.includes('message')) {
      return WhatsAppErrorCategory.MESSAGE_DELIVERY;
    }

    return WhatsAppErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(category: WhatsAppErrorCategory, error: Error): ErrorSeverity {
    // Critical errors that require immediate attention
    if (category === WhatsAppErrorCategory.AUTHENTICATION || 
        category === WhatsAppErrorCategory.CONFIGURATION) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors that affect service availability
    if (category === WhatsAppErrorCategory.CONNECTION) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors that affect individual operations
    if (category === WhatsAppErrorCategory.MESSAGE_DELIVERY ||
        category === WhatsAppErrorCategory.RATE_LIMIT) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors that are expected or recoverable
    if (category === WhatsAppErrorCategory.PHONE_VALIDATION) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Network errors are retryable
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return true;
    }
    
    // HTTP 5xx errors are retryable
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }
    
    // Rate limiting is retryable
    if (message.includes('429') || message.includes('rate limit')) {
      return true;
    }
    
    // WhatsApp specific temporary errors
    if (message.includes('temporary') || message.includes('try again') || message.includes('busy')) {
      return true;
    }
    
    return false;
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(errorLog: WhatsAppErrorLog): void {
    const logMessage = `[WhatsApp ${errorLog.category}] ${errorLog.errorMessage}`;
    const logContext = {
      severity: errorLog.severity,
      isRetryable: errorLog.isRetryable,
      context: errorLog.context,
    };

    switch (errorLog.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, logContext);
        break;
      case ErrorSeverity.LOW:
        console.log(logMessage, logContext);
        break;
    }
  }

  /**
   * Store error log in database
   */
  private async storeErrorLog(errorLog: WhatsAppErrorLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_error_logs')
        .insert({
          category: errorLog.category,
          severity: errorLog.severity,
          error_message: errorLog.errorMessage,
          error_stack: errorLog.errorStack,
          context: errorLog.context,
          order_id: errorLog.orderId,
          customer_phone: errorLog.customerPhone,
          notification_id: errorLog.notificationId,
          is_retryable: errorLog.isRetryable,
          created_at: errorLog.timestamp.toISOString(),
        });

      if (error) {
        console.error('Failed to store error log in database:', error);
      }
    } catch (error) {
      console.error('Error storing error log:', error);
    }
  }

  /**
   * Check if error thresholds are exceeded and trigger alerts
   */
  private async checkAlertThresholds(
    category: WhatsAppErrorCategory,
    severity: ErrorSeverity
  ): Promise<void> {
    // Critical errors always trigger alerts
    if (severity === ErrorSeverity.CRITICAL) {
      await this.triggerAlert({
        type: 'critical_error',
        category,
        message: `Critical WhatsApp error detected: ${category}`,
      });
      return;
    }

    // Check error rate for the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const stats = await this.getErrorStats(oneHourAgo);

    // Alert if error rate exceeds threshold (10 errors per hour)
    if (stats.errorRate > 10) {
      await this.triggerAlert({
        type: 'high_error_rate',
        category,
        message: `High error rate detected: ${stats.errorRate.toFixed(1)} errors/hour`,
        stats,
      });
    }

    // Alert if specific category has too many errors (5 in last hour)
    if (stats.errorsByCategory[category] > 5) {
      await this.triggerAlert({
        type: 'category_threshold',
        category,
        message: `High error count for ${category}: ${stats.errorsByCategory[category]} errors in last hour`,
      });
    }
  }

  /**
   * Trigger an alert (log to console, could be extended to send notifications)
   */
  private async triggerAlert(alert: {
    type: string;
    category: WhatsAppErrorCategory;
    message: string;
    stats?: ErrorStats;
  }): Promise<void> {
    console.error('🚨 WHATSAPP ALERT:', alert);

    // Store alert in database
    try {
      await supabase
        .from('whatsapp_alerts')
        .insert({
          alert_type: alert.type,
          category: alert.category,
          message: alert.message,
          metadata: alert.stats || {},
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to store alert:', error);
    }

    // Future: Send email/SMS/Slack notification to administrators
  }

  /**
   * Get error statistics for a time period
   */
  async getErrorStats(since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<ErrorStats> {
    try {
      const { data: errors, error } = await supabase
        .from('whatsapp_error_logs')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch error stats:', error);
        return this.getEmptyStats();
      }

      const totalErrors = errors?.length || 0;
      const hoursSince = (Date.now() - since.getTime()) / (1000 * 60 * 60);
      const errorRate = hoursSince > 0 ? totalErrors / hoursSince : 0;

      const errorsByCategory = errors?.reduce((acc, err) => {
        acc[err.category as WhatsAppErrorCategory] = (acc[err.category as WhatsAppErrorCategory] || 0) + 1;
        return acc;
      }, {} as Record<WhatsAppErrorCategory, number>) || {} as Record<WhatsAppErrorCategory, number>;

      const errorsBySeverity = errors?.reduce((acc, err) => {
        acc[err.severity as ErrorSeverity] = (acc[err.severity as ErrorSeverity] || 0) + 1;
        return acc;
      }, {} as Record<ErrorSeverity, number>) || {} as Record<ErrorSeverity, number>;

      const recentErrors = (errors?.slice(0, 10) || []).map(err => ({
        id: err.id,
        category: err.category as WhatsAppErrorCategory,
        severity: err.severity as ErrorSeverity,
        errorMessage: err.error_message,
        errorStack: err.error_stack,
        context: err.context,
        orderId: err.order_id,
        customerPhone: err.customer_phone,
        notificationId: err.notification_id,
        isRetryable: err.is_retryable,
        timestamp: new Date(err.created_at),
      }));

      return {
        totalErrors,
        errorsByCategory,
        errorsBySeverity,
        recentErrors,
        errorRate,
      };
    } catch (error) {
      console.error('Error calculating error stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get errors for a specific order
   */
  async getOrderErrors(orderId: string): Promise<WhatsAppErrorLog[]> {
    try {
      const { data: errors, error } = await supabase
        .from('whatsapp_error_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch order errors:', error);
        return [];
      }

      return (errors || []).map(err => ({
        id: err.id,
        category: err.category as WhatsAppErrorCategory,
        severity: err.severity as ErrorSeverity,
        errorMessage: err.error_message,
        errorStack: err.error_stack,
        context: err.context,
        orderId: err.order_id,
        customerPhone: err.customer_phone,
        notificationId: err.notification_id,
        isRetryable: err.is_retryable,
        timestamp: new Date(err.created_at),
      }));
    } catch (error) {
      console.error('Error fetching order errors:', error);
      return [];
    }
  }

  /**
   * Clear old error logs (older than 30 days)
   */
  async cleanupOldLogs(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('whatsapp_error_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select();

      if (error) {
        console.error('Failed to cleanup old logs:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} old error logs`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return 0;
    }
  }

  private getEmptyStats(): ErrorStats {
    return {
      totalErrors: 0,
      errorsByCategory: {} as Record<WhatsAppErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recentErrors: [],
      errorRate: 0,
    };
  }
}

// Export singleton instance
export const errorLogger = new WhatsAppErrorLogger();
