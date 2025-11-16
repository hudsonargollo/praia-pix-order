/**
 * MercadoPago Card Payment Brick Service - Fixed Version
 * 
 * This is a simplified, working version of the Payment Brick integration
 * that properly handles the Card Payment Brick API.
 */

import type {
  PaymentBrickConfig,
  PaymentBrickCallbacks,
  PaymentBrickFormData,
  PaymentBrickError,
} from './types';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const ERROR_MESSAGES = {
  SDK_LOAD_FAILED: 'Erro ao carregar sistema de pagamento. Verifique sua conexão.',
  PUBLIC_KEY_MISSING: 'Configuração de pagamento inválida.',
  BRICK_CREATE_FAILED: 'Erro ao carregar formulário de pagamento.',
  BRICK_NOT_INITIALIZED: 'Formulário de pagamento não inicializado.',
  TOKEN_NOT_FOUND: 'Token não encontrado nos dados do formulário.',
  GENERIC_ERROR: 'Erro inesperado. Tente novamente.',
} as const;

class PaymentBrickServiceFixed {
  private mp: any = null;
  private brickController: any = null;
  private publicKey: string;
  private isInitialized = false;
  private sdkLoadPromise: Promise<void> | null = null;

  constructor() {
    this.publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    
    if (!this.publicKey) {
      console.error('MercadoPago public key not found');
    }
  }

  private loadSDK(): Promise<void> {
    if (this.sdkLoadPromise) {
      return this.sdkLoadPromise;
    }

    if (window.MercadoPago) {
      this.sdkLoadPromise = Promise.resolve();
      return this.sdkLoadPromise;
    }

    // Workaround for "browser is not defined" error in MercadoPago SDK
    // The SDK tries to detect the browser but fails in some environments
    if (typeof (window as any).browser === 'undefined') {
      (window as any).browser = {
        name: 'chrome',
        version: '120.0.0'
      };
    }

    this.sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      
      script.onload = () => {
        console.log('✓ MercadoPago SDK loaded');
        resolve();
      };
      
      script.onerror = () => {
        console.error('✗ Failed to load MercadoPago SDK');
        this.sdkLoadPromise = null;
        reject(new Error(ERROR_MESSAGES.SDK_LOAD_FAILED));
      };
      
      document.head.appendChild(script);
    });

    return this.sdkLoadPromise;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.mp) {
      return;
    }

    if (!this.publicKey) {
      throw new Error(ERROR_MESSAGES.PUBLIC_KEY_MISSING);
    }

    try {
      await this.loadSDK();

      if (!window.MercadoPago) {
        throw new Error(ERROR_MESSAGES.SDK_LOAD_FAILED);
      }

      this.mp = new window.MercadoPago(this.publicKey, {
        locale: 'pt-BR'
      });

      this.isInitialized = true;
      console.log('✓ MercadoPago SDK initialized');
    } catch (error) {
      console.error('✗ Failed to initialize MercadoPago SDK:', error);
      throw error;
    }
  }

  async createPaymentBrick(
    containerId: string,
    config: PaymentBrickConfig,
    callbacks?: PaymentBrickCallbacks
  ): Promise<any> {
    if (!this.isInitialized || !this.mp) {
      await this.initialize();
    }

    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container "${containerId}" not found`);
      }

      if (this.brickController) {
        await this.unmount();
      }

      if (!config.amount || config.amount <= 0) {
        throw new Error('Valor inválido para pagamento');
      }

      console.log('Creating Card Payment Brick with amount:', config.amount);

      // Ensure browser object exists before creating brick
      if (typeof (window as any).browser === 'undefined') {
        (window as any).browser = {
          name: 'chrome',
          version: '120.0.0'
        };
      }

      const bricksBuilder = this.mp.bricks();
      
      this.brickController = await bricksBuilder.create('cardPayment', containerId, {
        initialization: {
          amount: config.amount,
        },
        customization: {
          visual: {
            hidePaymentButton: false,
            hideFormTitle: true,
            style: {
              theme: 'default',
            },
          },
          paymentMethods: {
            maxInstallments: 1,
          },
        },
        callbacks: {
          onReady: () => {
            console.log('✓ Card Payment Brick ready');
            callbacks?.onReady?.();
          },
          onError: (error: any) => {
            console.error('✗ Card Payment Brick error:', error);
            callbacks?.onError?.({
              message: error.message || ERROR_MESSAGES.GENERIC_ERROR,
              cause: error.cause,
              detail: error.detail,
            });
          },
          onSubmit: async (formData: any) => {
            console.log('Card Payment Brick onSubmit called');
            if (callbacks?.onSubmit) {
              try {
                await callbacks.onSubmit(formData);
              } catch (error) {
                console.error('Error in onSubmit callback:', error);
                throw error;
              }
            }
          },
        },
      });

      console.log('✓ Card Payment Brick created successfully');
      return this.brickController;
    } catch (error) {
      console.error('✗ Failed to create Card Payment Brick:', error);
      throw error;
    }
  }

  async getCardToken(formData: PaymentBrickFormData): Promise<string> {
    try {
      if (!formData || !formData.token) {
        throw new Error(ERROR_MESSAGES.TOKEN_NOT_FOUND);
      }

      if (typeof formData.token !== 'string' || formData.token.trim().length === 0) {
        throw new Error(ERROR_MESSAGES.TOKEN_NOT_FOUND);
      }

      console.log('✓ Card token extracted successfully');
      return formData.token;
    } catch (error) {
      console.error('✗ Failed to get card token:', error);
      throw error;
    }
  }

  async unmount(): Promise<void> {
    if (this.brickController) {
      try {
        await this.brickController.unmount();
        this.brickController = null;
        console.log('✓ Card Payment Brick unmounted');
      } catch (error) {
        console.error('✗ Failed to unmount Card Payment Brick:', error);
      }
    }
  }

  isSDKInitialized(): boolean {
    return this.isInitialized && this.mp !== null;
  }

  getBrickController(): any {
    return this.brickController;
  }
}

export const paymentBrickServiceFixed = new PaymentBrickServiceFixed();
export { PaymentBrickServiceFixed };
