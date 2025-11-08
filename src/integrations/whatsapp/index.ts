/**
 * WhatsApp Integration - Main Export File
 * Exports all public APIs for WhatsApp notifications
 */

export { evolutionClient } from './evolution-client';
export { notificationTriggers } from './notification-triggers';
export { queueManager } from './queue-manager';
export { whatsappService } from './service';
export { WhatsAppTemplates } from './templates';
export { validatePhoneNumber } from './phone-validator';
export { optOutManager } from './opt-out-manager';
export { complianceChecker } from './compliance';
export { deliveryMonitor } from './delivery-monitor';
export { errorLogger } from './error-logger';

// Export types
export type {
  OrderData,
  NotificationRequest,
  QueuedNotification,
  NotificationResult,
  ProcessResult,
  QueueStats,
} from './types';
