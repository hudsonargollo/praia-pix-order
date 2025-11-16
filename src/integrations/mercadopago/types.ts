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

// Payment Brick types
export interface PaymentBrickConfig {
  amount: number;
  locale: 'pt-BR';
  customization?: {
    visual?: {
      hidePaymentButton?: boolean;
      style?: {
        theme?: 'default' | 'dark' | 'bootstrap' | 'flat';
      };
    };
    paymentMethods?: {
      maxInstallments?: number;
      minInstallments?: number;
      types?: {
        excluded?: string[];
        included?: string[];
      };
    };
  };
}

export interface PaymentBrickCallbacks {
  onReady?: () => void;
  onError?: (error: PaymentBrickError) => void;
  onSubmit?: (formData: PaymentBrickFormData) => Promise<void>;
}

export interface PaymentBrickFormData {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

export interface PaymentBrickError {
  message: string;
  cause?: string;
  detail?: string;
}

export interface PaymentBrickInstance {
  mount: (containerId: string) => Promise<void>;
  unmount: () => Promise<void>;
  update: (config: Partial<PaymentBrickConfig>) => Promise<void>;
  getFormData: () => Promise<PaymentBrickFormData>;
}

export interface CardTokenResponse {
  id: string;
  public_key: string;
  card_id: string | null;
  luhn_validation: boolean;
  status: string;
  date_created: string;
  date_last_updated: string;
  date_due: string;
  cardholder: {
    identification: {
      number: string;
      type: string;
    };
    name: string;
  };
  security_code_length: number;
  expiration_month: number;
  expiration_year: number;
  last_four_digits: string;
  first_six_digits: string;
}

// Card payment request/response types
export interface CardPaymentRequest {
  orderId: string;
  token: string;
  amount: number;
  paymentMethodId: string;
  payer: {
    email: string;
    identification: {
      type: 'CPF' | 'CNPJ';
      number: string;
    };
  };
}

export interface CardPaymentResponse {
  success: boolean;
  paymentId?: string;
  status: 'approved' | 'rejected' | 'in_process';
  statusDetail?: string;
  error?: string;
}