// MercadoPago integration exports
export { mercadoPagoService } from './client';
export { paymentPollingService } from './polling';
export { paymentRecoveryService } from './recovery';
export { WebhookService } from './webhook';
export * from './types';
export * from './utils';

// Re-export commonly used functions
export {
  isPaymentExpired,
  getTimeUntilExpiration,
  formatTimeRemaining,
  getPaymentStatusColor,
  getPaymentStatusIcon,
  validateBrazilianPhone,
  formatBrazilianPhone,
  generateOrderDescription,
  calculatePaymentExpiration,
  retryWithBackoff,
  debounce
} from './utils';