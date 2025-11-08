// MercadoPago API client for payment processing
import { toast } from "sonner";
import { mockMercadoPagoService } from "./mock";

// Environment variables for MercadoPago
const MERCADOPAGO_ACCESS_TOKEN = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

// MercadoPago API base URL
const MERCADOPAGO_API_URL = 'https://api.mercadopago.com';

// Error handling configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

// Payment timeout configuration
const PAYMENT_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Types for MercadoPago integration
export interface PaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  customerName: string;
  customerPhone: string;
  tableNumber: string;
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  qrCode: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
  expirationDate: string;
  transactionAmount: number;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  statusDetail: string;
  transactionAmount: number;
  dateCreated: string;
  dateApproved?: string;
}

class MercadoPagoService {
  private accessToken: string;
  private publicKey: string;

  constructor() {
    this.accessToken = MERCADOPAGO_ACCESS_TOKEN;
    this.publicKey = MERCADOPAGO_PUBLIC_KEY;

    if (!this.accessToken) {
      console.error('MercadoPago access token not configured');
    }
    if (!this.publicKey) {
      console.error('MercadoPago public key not configured');
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = RETRY_CONFIG.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          console.error(`${context} failed after ${maxRetries + 1} attempts:`, lastError);
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          console.error(`${context} failed with non-retryable error:`, lastError);
          break;
        }

        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay
        );
        
        console.warn(`${context} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if an error is retryable
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
    
    // Temporary MercadoPago errors
    if (message.includes('temporary') || message.includes('try again')) {
      return true;
    }
    
    return false;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    if (message.includes('timeout')) {
      return 'Tempo limite excedido. Tente novamente.';
    }
    
    if (message.includes('invalid') || message.includes('400')) {
      return 'Dados inválidos. Verifique as informações e tente novamente.';
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Erro de autorização. Entre em contato com o suporte.';
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return 'Acesso negado. Entre em contato com o suporte.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'Pagamento não encontrado.';
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return 'Muitas tentativas. Aguarde um momento e tente novamente.';
    }
    
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return 'Erro temporário do servidor. Tente novamente em alguns minutos.';
    }
    
    return 'Erro inesperado. Tente novamente ou entre em contato com o suporte.';
  }

  /**
   * Create a new payment with MercadoPago
   */
  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    // Check if we should use mock service (only for development without credentials)
    const useMock = !this.accessToken || this.accessToken === "your_mercadopago_access_token_here";
    
    if (useMock) {
      console.warn("Using mock MercadoPago service - no real payments will be processed");
      toast.info("Modo de teste - pagamento simulado");
      return mockMercadoPagoService.createPayment(paymentData);
    }

    console.log("Using real MercadoPago API with credentials");

    return this.retryWithBackoff(async () => {
      try {
        // Validate input data
        this.validatePaymentData(paymentData);

        const response = await fetch('/api/mercadopago/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error?.message || response.statusText;
          throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        }

        const data = await response.json();

        // Validate response data
        if (!data.id) {
          throw new Error('Invalid response: missing payment ID');
        }

        return data;
      } catch (error) {
        const friendlyMessage = this.getUserFriendlyErrorMessage(error as Error);
        console.error('Error creating MercadoPago payment:', error);
        
        // Only show toast on final failure (not during retries)
        if (error instanceof Error && !this.isRetryableError(error)) {
          toast.error(friendlyMessage);
        }
        
        throw error;
      }
    }, 'Create payment');
  }

  /**
   * Validate payment data before sending to API
   */
  private validatePaymentData(paymentData: PaymentRequest): void {
    if (!paymentData.orderId) {
      throw new Error('Order ID is required');
    }
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Valid amount is required');
    }
    
    if (!paymentData.customerName || paymentData.customerName.trim().length < 2) {
      throw new Error('Valid customer name is required');
    }
    
    if (!paymentData.customerPhone || paymentData.customerPhone.length < 10) {
      throw new Error('Valid customer phone is required');
    }
    
    if (!paymentData.tableNumber) {
      throw new Error('Table number is required');
    }
    
    if (!this.accessToken) {
      throw new Error('MercadoPago access token not configured');
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // Use mock service if payment ID starts with 'mock_'
    if (paymentId.startsWith('mock_')) {
      return mockMercadoPagoService.checkPaymentStatus(paymentId);
    }

    const useMock = !this.accessToken || this.accessToken === "your_mercadopago_access_token_here";
    if (useMock) {
      return mockMercadoPagoService.checkPaymentStatus(paymentId);
    }

    return this.retryWithBackoff(async () => {
      try {
        if (!paymentId) {
          throw new Error('Payment ID is required');
        }

        const response = await fetch(`/api/mercadopago/check-payment?paymentId=${paymentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error?.message || response.statusText;
          throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        }

        const data = await response.json();

        // Validate response data
        if (!data.id) {
          throw new Error('Invalid response: missing payment ID');
        }

        return data;
      } catch (error) {
        console.error('Error checking payment status:', error);
        throw error;
      }
    }, 'Check payment status');
  }

  /**
   * Validate webhook signature (for security)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    // This would typically use HMAC validation with a secret key
    // For now, we'll implement basic validation
    // In production, implement proper HMAC-SHA256 validation
    return !!(signature && signature.length > 0);
  }

  /**
   * Process webhook notification
   */
  async processWebhook(webhookData: any): Promise<{ orderId: string; status: string; paymentId: string }> {
    try {
      const paymentId = webhookData.data?.id;
      
      if (!paymentId) {
        throw new Error('Invalid webhook data: missing payment ID');
      }

      // Get payment details
      const paymentStatus = await this.checkPaymentStatus(paymentId);
      
      return {
        orderId: webhookData.external_reference || '',
        status: paymentStatus.status,
        paymentId: paymentId.toString()
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mercadoPagoService = new MercadoPagoService();