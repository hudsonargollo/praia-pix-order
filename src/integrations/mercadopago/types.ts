// TypeScript types for MercadoPago integration

export interface MercadoPagoPaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  customerName: string;
  customerPhone: string;
  tableNumber: string;
}

export interface MercadoPagoPaymentResponse {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  qrCode: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
  expirationDate: string;
  transactionAmount: number;
}

export interface MercadoPagoPaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  statusDetail: string;
  transactionAmount: number;
  dateCreated: string;
  dateApproved?: string;
}

export interface MercadoPagoWebhookData {
  id: string;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice';
  date_created: string;
  application_id: string;
  user_id: string;
  version: string;
  api_version: string;
  action: 'payment.created' | 'payment.updated';
  data: {
    id: string;
  };
}

export interface OrderPaymentData {
  orderId: string;
  mercadopagoPaymentId: string;
  qrCodeData: string;
  pixCopyPaste: string;
  paymentExpiresAt: string;
  status: 'pending_payment' | 'paid' | 'expired' | 'cancelled';
}

// Error types
export interface MercadoPagoError {
  message: string;
  error: string;
  status: number;
  cause?: {
    code: string;
    description: string;
  }[];
}

// Payment method types
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer';

// Payment status mapping
export const PAYMENT_STATUS_MAP = {
  pending: 'pending_payment',
  approved: 'paid',
  rejected: 'cancelled',
  cancelled: 'cancelled',
  in_process: 'pending_payment'
} as const;

export type MercadoPagoStatus = keyof typeof PAYMENT_STATUS_MAP;
export type OrderStatus = typeof PAYMENT_STATUS_MAP[MercadoPagoStatus];