/**
 * MercadoPago API Client
 * 
 * Provides a service layer for interacting with MercadoPago payment APIs.
 * Handles both PIX and credit card payments with comprehensive error handling
 * and retry logic.
 * 
 * Features:
 * - Exponential backoff retry for transient failures
 * - User-friendly error messages in Portuguese
 * - Request validation
 * - Mock service for development without credentials
 * 
 * @module mercadopago/client
 * @see {@link https://www.mercadopago.com.br/developers/en/reference}
 */

import { toast } from "sonner";
import { mockMercadoPagoService } from "./mock";
import type { CardPaymentRequest, CardPaymentResponse } from "./types";

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
   * Implements retry mechanism with exponential backoff
   * 
   * Automatically retries failed operations with increasing delays between attempts.
   * Only retries on transient errors (network issues, timeouts, 5xx errors).
   * 
   * @template T
   * @param {function} operation - Async operation to retry
   * @param {string} context - Description of operation for logging
   * @param {number} [maxRetries] - Maximum number of retry attempts
   * @returns {Promise<T>} Result of the operation
   * @throws {Error} Last error if all retries fail
   * @private
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
   * Determines if an error should trigger a retry
   * 
   * Retryable errors include:
   * - Network errors (connection, timeout)
   * - HTTP 5xx server errors
   * - HTTP 429 rate limiting
   * - Temporary MercadoPago errors
   * 
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   * @private
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
   * Converts technical error messages to user-friendly Portuguese messages
   * 
   * Maps common error types to clear, actionable messages for customers.
   * 
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message in Portuguese
   * @private
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
   * Creates a new PIX payment with MercadoPago
   * 
   * This method:
   * 1. Validates payment data
   * 2. Sends request to backend API
   * 3. Returns PIX QR code and payment details
   * 4. Handles errors with retry logic
   * 
   * @async
   * @param {PaymentRequest} paymentData - Payment request data
   * @returns {Promise<PaymentResponse>} Payment response with QR code and details
   * @throws {Error} If validation fails or payment creation fails after retries
   */
  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    // Check if we should use mock service (only for development without credentials)
    const useMock = !this.accessToken || this.accessToken === "your_mercadopago_access_token_here";
    
    if (useMock) {
      toast.info("Modo de teste - pagamento simulado");
      return mockMercadoPagoService.createPayment(paymentData);
    }

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
   * Validates payment request data before sending to API
   * 
   * Checks for:
   * - Required fields (orderId, amount, customer info)
   * - Valid data types and formats
   * - Minimum value constraints
   * - Access token configuration
   * 
   * @param {PaymentRequest} paymentData - Payment data to validate
   * @throws {Error} If validation fails with specific error message
   * @private
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
   * Checks the current status of a payment
   * 
   * Used for polling payment status or verifying payment completion.
   * 
   * @async
   * @param {string} paymentId - MercadoPago payment ID
   * @returns {Promise<PaymentStatus>} Current payment status and details
   * @throws {Error} If payment ID is invalid or status check fails
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

  /**
   * Creates a credit card payment with MercadoPago
   * 
   * This method:
   * 1. Validates the payment request data
   * 2. Sends the card token and payment details to the backend
   * 3. Handles the payment response (approved, rejected, in_process)
   * 4. Shows appropriate toast notifications
   * 5. Retries on transient failures
   * 
   * Security:
   * - Only the card token is sent (not raw card data)
   * - Token is single-use and expires quickly
   * - Backend validates and processes the payment
   * 
   * @async
   * @param {CardPaymentRequest} request - Payment request with token and order details
   * @returns {Promise<CardPaymentResponse>} Payment result with status and details
   * @throws {Error} If validation fails or payment processing fails after retries
   */
  async createCardPayment(request: CardPaymentRequest): Promise<CardPaymentResponse> {
    return this.retryWithBackoff(async () => {
      try {
        // Validate request data
        if (!request.orderId) {
          throw new Error('Order ID is required');
        }
        
        if (!request.token) {
          throw new Error('Card token is required');
        }
        
        if (!request.amount || request.amount <= 0) {
          throw new Error('Valid amount is required');
        }
        
        if (!request.paymentMethodId) {
          throw new Error('Payment method is required');
        }
        
        if (!request.payer?.email || !request.payer?.identification?.type || !request.payer?.identification?.number) {
          throw new Error('Payer information is required');
        }

        const response = await fetch('/api/mercadopago/create-card-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Payment failed';
          throw new Error(errorMessage);
        }

        const data: CardPaymentResponse = await response.json();

        // Show appropriate toast based on status
        if (data.success && data.status === 'approved') {
          toast.success('Pagamento aprovado!');
        } else if (data.status === 'rejected') {
          toast.error(data.error || 'Pagamento recusado');
        } else if (data.status === 'in_process') {
          toast.info('Pagamento em análise');
        }

        return data;
      } catch (error) {
        const friendlyMessage = this.getUserFriendlyErrorMessage(error as Error);
        console.error('Error creating card payment:', error);
        
        // Only show toast on final failure (not during retries)
        if (error instanceof Error && !this.isRetryableError(error)) {
          toast.error(friendlyMessage);
        }
        
        throw error;
      }
    }, 'Create card payment');
  }
}

/**
 * Singleton instance of MercadoPagoService
 * 
 * Use this instance throughout the application for all MercadoPago operations.
 * 
 * @example
 * ```typescript
 * import { mercadoPagoService } from '@/integrations/mercadopago/client';
 * 
 * // Create PIX payment
 * const payment = await mercadoPagoService.createPayment(paymentData);
 * 
 * // Create card payment
 * const cardPayment = await mercadoPagoService.createCardPayment(cardRequest);
 * ```
 */
export const mercadoPagoService = new MercadoPagoService();