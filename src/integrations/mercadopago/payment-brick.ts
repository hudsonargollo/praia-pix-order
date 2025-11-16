/**
 * MercadoPago Payment Brick Service
 * 
 * Provides a service layer for managing the MercadoPago Payment Brick component.
 * Handles SDK initialization, Payment Brick lifecycle, and card tokenization.
 * 
 * Key Features:
 * - Dynamic SDK loading
 * - Payment Brick initialization and configuration
 * - Secure client-side card tokenization
 * - Error handling with user-friendly Portuguese messages
 * - Automatic cleanup and unmounting
 * 
 * Security:
 * - Card data never leaves the browser
 * - Tokenization happens client-side via MercadoPago SDK
 * - Tokens are single-use and expire quickly
 * 
 * @module payment-brick
 * @see {@link https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/payment-brick/introduction}
 */

import type {
  PaymentBrickConfig,
  PaymentBrickCallbacks,
  PaymentBrickInstance,
  PaymentBrickFormData,
  PaymentBrickError,
} from './types';

// Global MercadoPago SDK interface
declare global {
  interface Window {
    MercadoPago: any;
  }
}

/**
 * Error messages in Portuguese for user-friendly feedback
 */
const ERROR_MESSAGES = {
  SDK_LOAD_FAILED: 'Erro ao carregar sistema de pagamento. Verifique sua conexão.',
  SDK_INIT_FAILED: 'Erro ao inicializar sistema de pagamento.',
  PUBLIC_KEY_MISSING: 'Configuração de pagamento inválida. Entre em contato com o suporte.',
  BRICK_CREATE_FAILED: 'Erro ao carregar formulário de pagamento.',
  BRICK_NOT_INITIALIZED: 'Formulário de pagamento não inicializado.',
  TOKEN_NOT_FOUND: 'Token não encontrado nos dados do formulário.',
  TOKENIZATION_FAILED: 'Erro ao processar dados do cartão.',
  INVALID_CARD_NUMBER: 'Número de cartão inválido.',
  INVALID_EXPIRY: 'Data de validade inválida.',
  INVALID_CVV: 'Código de segurança inválido.',
  INVALID_CARDHOLDER: 'Nome do titular inválido.',
  INVALID_DOCUMENT: 'Documento inválido.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  GENERIC_ERROR: 'Erro inesperado. Tente novamente.',
} as const;

/**
 * Maps MercadoPago error codes and messages to user-friendly Portuguese messages
 * 
 * Handles various error types:
 * - Network errors (connection, timeout)
 * - Card validation errors (invalid number, expiry, CVV)
 * - SDK initialization errors
 * - Generic errors
 * 
 * @param {any} error - Error object from MercadoPago SDK or network request
 * @returns {string} User-friendly error message in Portuguese
 * @private
 */
function getErrorMessage(error: any): string {
  if (!error) {
    return ERROR_MESSAGES.GENERIC_ERROR;
  }

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCause = error.cause?.toLowerCase() || '';
  const errorDetail = error.detail?.toLowerCase() || '';

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Card validation errors
  if (errorMessage.includes('card number') || errorCause.includes('card number') || errorDetail.includes('card number')) {
    return ERROR_MESSAGES.INVALID_CARD_NUMBER;
  }

  if (errorMessage.includes('expir') || errorCause.includes('expir') || errorDetail.includes('expir')) {
    return ERROR_MESSAGES.INVALID_EXPIRY;
  }

  if (errorMessage.includes('cvv') || errorMessage.includes('security code') || errorCause.includes('cvv') || errorCause.includes('security')) {
    return ERROR_MESSAGES.INVALID_CVV;
  }

  if (errorMessage.includes('cardholder') || errorMessage.includes('holder name') || errorCause.includes('cardholder')) {
    return ERROR_MESSAGES.INVALID_CARDHOLDER;
  }

  if (errorMessage.includes('document') || errorMessage.includes('cpf') || errorMessage.includes('cnpj')) {
    return ERROR_MESSAGES.INVALID_DOCUMENT;
  }

  // SDK errors
  if (errorMessage.includes('sdk') || errorMessage.includes('script')) {
    return ERROR_MESSAGES.SDK_LOAD_FAILED;
  }

  // Return the original message if it's already in Portuguese, otherwise generic error
  if (error.message && /[áàâãéêíóôõúç]/i.test(error.message)) {
    return error.message;
  }

  return ERROR_MESSAGES.GENERIC_ERROR;
}

/**
 * Service class for managing MercadoPago Payment Brick
 * Provides methods to initialize, mount, and interact with the Payment Brick component
 */
class PaymentBrickService {
  private mp: any = null;
  private brickController: PaymentBrickInstance | null = null;
  private publicKey: string;
  private isInitialized = false;
  private sdkLoadPromise: Promise<void> | null = null;

  constructor() {
    this.publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    
    if (!this.publicKey) {
      console.error('MercadoPago public key not found in environment variables');
    }
  }

  /**
   * Loads the MercadoPago SDK script dynamically
   * 
   * This method:
   * - Checks if SDK is already loaded to avoid duplicate loads
   * - Creates and injects script tag into document head
   * - Returns a promise that resolves when SDK is ready
   * - Caches the promise to prevent multiple simultaneous loads
   * 
   * @returns {Promise<void>} Promise that resolves when SDK is loaded
   * @throws {Error} If SDK fails to load
   * @private
   */
  private loadSDK(): Promise<void> {
    // Return existing promise if already loading
    if (this.sdkLoadPromise) {
      return this.sdkLoadPromise;
    }

    // Check if SDK is already loaded
    if (window.MercadoPago) {
      this.sdkLoadPromise = Promise.resolve();
      return this.sdkLoadPromise;
    }

    // Create new loading promise
    this.sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      
      script.onload = () => {
        resolve();
      };
      
      script.onerror = () => {
        const error = new Error(ERROR_MESSAGES.SDK_LOAD_FAILED);
        console.error('Failed to load MercadoPago SDK:', error);
        this.sdkLoadPromise = null; // Reset to allow retry
        reject(error);
      };
      
      document.head.appendChild(script);
    });

    return this.sdkLoadPromise;
  }

  /**
   * Initializes the MercadoPago SDK with the public key
   * 
   * This method must be called before creating a Payment Brick.
   * It:
   * 1. Validates that public key is configured
   * 2. Loads the MercadoPago SDK script if not already loaded
   * 3. Creates a MercadoPago instance with the public key
   * 4. Sets locale to pt-BR for Brazilian Portuguese
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {Error} If public key is missing or SDK fails to load
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.mp) {
      return;
    }

    if (!this.publicKey) {
      const error = new Error(ERROR_MESSAGES.PUBLIC_KEY_MISSING);
      console.error('MercadoPago public key is not configured');
      throw error;
    }

    try {
      // Load SDK if not already loaded
      await this.loadSDK();

      // Verify SDK is available
      if (!window.MercadoPago) {
        throw new Error(ERROR_MESSAGES.SDK_LOAD_FAILED);
      }

      // Initialize MercadoPago instance
      this.mp = new window.MercadoPago(this.publicKey, {
        locale: 'pt-BR'
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MercadoPago SDK:', error);
      const friendlyMessage = getErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Creates and mounts a Payment Brick instance
   * 
   * This method:
   * 1. Ensures SDK is initialized
   * 2. Validates container element exists
   * 3. Unmounts any existing brick
   * 4. Creates new brick with provided configuration
   * 5. Mounts brick in the specified container
   * 6. Sets up event callbacks (onReady, onError, onSubmit)
   * 
   * Configuration:
   * - No installments (single payment only)
   * - Portuguese (pt-BR) locale
   * - Custom button hidden (we use our own)
   * 
   * @async
   * @param {string} containerId - DOM element ID where the brick will be mounted
   * @param {PaymentBrickConfig} config - Payment Brick configuration (amount, locale, customization)
   * @param {PaymentBrickCallbacks} [callbacks] - Event callbacks for brick lifecycle
   * @returns {Promise<PaymentBrickInstance>} The created brick instance
   * @throws {Error} If container not found, amount invalid, or brick creation fails
   */
  async createPaymentBrick(
    containerId: string,
    config: PaymentBrickConfig,
    callbacks?: PaymentBrickCallbacks
  ): Promise<PaymentBrickInstance> {
    if (!this.isInitialized || !this.mp) {
      await this.initialize();
    }

    try {
      // Verify container exists
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container element with id "${containerId}" not found`);
      }

      // Unmount existing brick if any
      if (this.brickController) {
        await this.unmount();
      }

      // Validate amount
      if (!config.amount || config.amount <= 0) {
        throw new Error('Valor inválido para pagamento');
      }

      // Create brick configuration with defaults
      const brickConfig = {
        amount: config.amount,
        locale: config.locale,
        customization: {
          visual: {
            hidePaymentButton: true, // We'll use our own button
            style: {
              theme: 'default' as const,
            },
            ...config.customization?.visual,
          },
          paymentMethods: {
            maxInstallments: 1, // No installments
            minInstallments: 1,
            ...config.customization?.paymentMethods,
          },
        },
      };

      // Create Payment Brick instance
      const bricksBuilder = this.mp.bricks();
      
      this.brickController = await bricksBuilder.create('payment', containerId, {
        initialization: {
          amount: brickConfig.amount,
        },
        customization: brickConfig.customization,
        callbacks: {
          onReady: () => {
            callbacks?.onReady?.();
          },
          onError: (error: PaymentBrickError) => {
            console.error('Payment Brick error:', error);
            const friendlyMessage = getErrorMessage(error);
            // Create a new error object with friendly message
            const userError: PaymentBrickError = {
              message: friendlyMessage,
              cause: error.cause,
              detail: error.detail,
            };
            callbacks?.onError?.(userError);
          },
          onSubmit: async (formData: PaymentBrickFormData) => {
            if (callbacks?.onSubmit) {
              try {
                await callbacks.onSubmit(formData);
              } catch (error) {
                console.error('Error in onSubmit callback:', error);
                const friendlyMessage = getErrorMessage(error);
                throw new Error(friendlyMessage);
              }
            }
          },
        },
      });

      return this.brickController;
    } catch (error) {
      console.error('Failed to create Payment Brick:', error);
      const friendlyMessage = getErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Extracts the card token from Payment Brick form data
   * 
   * The token is a secure, one-time-use string that represents the customer's
   * card details. This token should be sent to the backend for payment processing.
   * 
   * Security Note:
   * - The token is generated by MercadoPago SDK client-side
   * - Raw card data never touches our servers
   * - Token expires quickly and can only be used once
   * 
   * @async
   * @param {PaymentBrickFormData} formData - Form data from Payment Brick submission
   * @returns {Promise<string>} The card token to send to backend
   * @throws {Error} If token is missing or invalid
   */
  async getCardToken(formData: PaymentBrickFormData): Promise<string> {
    try {
      if (!formData) {
        throw new Error(ERROR_MESSAGES.TOKEN_NOT_FOUND);
      }

      if (!formData.token) {
        throw new Error(ERROR_MESSAGES.TOKEN_NOT_FOUND);
      }

      // Validate token format (basic check)
      if (typeof formData.token !== 'string' || formData.token.trim().length === 0) {
        throw new Error(ERROR_MESSAGES.TOKENIZATION_FAILED);
      }

      return formData.token;
    } catch (error) {
      console.error('Failed to get card token:', error);
      const friendlyMessage = getErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Unmounts the current Payment Brick instance
   * 
   * This method should be called:
   * - When the component unmounts (cleanup)
   * - Before creating a new brick instance
   * - When resetting the payment form
   * 
   * Safely handles cases where no brick is mounted.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async unmount(): Promise<void> {
    if (this.brickController) {
      try {
        await this.brickController.unmount();
        this.brickController = null;
      } catch (error) {
        console.error('Failed to unmount Payment Brick:', error);
      }
    }
  }

  /**
   * Updates Payment Brick configuration without recreating it
   * 
   * Useful for updating the amount or other settings dynamically.
   * Note: Not all configuration options can be updated after creation.
   * 
   * @async
   * @param {Partial<PaymentBrickConfig>} config - Configuration properties to update
   * @returns {Promise<void>}
   * @throws {Error} If brick is not initialized or update fails
   */
  async updateBrick(config: Partial<PaymentBrickConfig>): Promise<void> {
    if (!this.brickController) {
      const error = new Error(ERROR_MESSAGES.BRICK_NOT_INITIALIZED);
      console.error('Payment Brick not initialized');
      throw error;
    }

    try {
      // Validate amount if provided
      if (config.amount !== undefined && config.amount <= 0) {
        throw new Error('Valor inválido para pagamento');
      }

      await this.brickController.update(config);
    } catch (error) {
      console.error('Failed to update Payment Brick:', error);
      const friendlyMessage = getErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Checks if the MercadoPago SDK is initialized
   * 
   * @returns {boolean} True if SDK is initialized and ready to use
   */
  isSDKInitialized(): boolean {
    return this.isInitialized && this.mp !== null;
  }

  /**
   * Gets the current Payment Brick controller instance
   * 
   * @returns {PaymentBrickInstance | null} The brick instance or null if not created
   */
  getBrickController(): PaymentBrickInstance | null {
    return this.brickController;
  }
}

/**
 * Singleton instance of PaymentBrickService
 * 
 * Use this instance throughout the application to manage Payment Brick.
 * The singleton pattern ensures only one SDK instance is created.
 * 
 * @example
 * ```typescript
 * import { paymentBrickService } from '@/integrations/mercadopago/payment-brick';
 * 
 * await paymentBrickService.createPaymentBrick('container-id', config, callbacks);
 * ```
 */
export const paymentBrickService = new PaymentBrickService();

/**
 * Export class for testing purposes
 * Allows creating isolated instances in tests
 */
export { PaymentBrickService };
