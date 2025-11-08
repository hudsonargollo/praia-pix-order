import { WhatsAppMessage, WhatsAppResponse, WhatsAppError, OrderData, ValidationResult } from './types';
import { validatePhoneNumber } from './phone-validator';
import { checkWhatsAppExists } from './account-checker';

class WhatsAppClient {
  private apiToken: string;
  private phoneNumberId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.apiToken = import.meta.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = import.meta.env.WHATSAPP_PHONE_NUMBER_ID || '';
    
    if (!this.apiToken || !this.phoneNumberId) {
      console.warn('WhatsApp credentials not configured. Messages will not be sent.');
    }
  }

  /**
   * Validate a phone number using the phone validator
   */
  validatePhoneNumber(phone: string): ValidationResult {
    return validatePhoneNumber(phone);
  }

  /**
   * Check if a phone number has WhatsApp
   */
  async checkWhatsAppExists(phone: string): Promise<boolean> {
    const result = await checkWhatsAppExists(phone);
    return result.exists;
  }

  private async makeRequest(endpoint: string, data: any): Promise<WhatsAppResponse> {
    if (!this.apiToken || !this.phoneNumberId) {
      throw new Error('WhatsApp credentials not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(`Invalid JSON response from WhatsApp API: ${response.statusText}`);
      }

      if (!response.ok) {
        const error = result as WhatsAppError;
        const errorMessage = error?.error?.message || error?.error?.error_data?.details || response.statusText;
        const errorCode = error?.error?.code || response.status;
        
        // Provide more specific error messages based on error codes
        switch (errorCode) {
          case 400:
            throw new Error(`Invalid request: ${errorMessage}`);
          case 401:
            throw new Error('WhatsApp API authentication failed. Check credentials.');
          case 403:
            throw new Error('WhatsApp API access forbidden. Check permissions.');
          case 404:
            throw new Error('WhatsApp API endpoint not found.');
          case 429:
            throw new Error('WhatsApp API rate limit exceeded. Please try again later.');
          case 500:
          case 502:
          case 503:
          case 504:
            throw new Error(`WhatsApp API server error (${errorCode}). Please try again.`);
          default:
            throw new Error(`WhatsApp API Error (${errorCode}): ${errorMessage}`);
        }
      }

      // Validate response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response structure from WhatsApp API');
      }

      return result as WhatsAppResponse;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to WhatsApp API');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<string> {
    try {
      // Validate message before sending
      this.validateMessage(message);

      const response = await this.makeRequest(`${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        ...message,
      });

      // Validate response
      if (!response.messages || !response.messages[0] || !response.messages[0].id) {
        throw new Error('Invalid response: missing message ID');
      }

      return response.messages[0].id;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Validate WhatsApp message before sending
   */
  private validateMessage(message: WhatsAppMessage): void {
    if (!message.to) {
      throw new Error('Message recipient (to) is required');
    }

    if (!message.type) {
      throw new Error('Message type is required');
    }

    if (message.type === 'text' && (!message.text || !message.text.body)) {
      throw new Error('Text message body is required');
    }

    // Validate phone number format
    const phoneRegex = /^\d{10,15}$/;
    const cleanPhone = message.to.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      throw new Error('Invalid phone number format');
    }

    // Check message length limits
    if (message.type === 'text' && message.text?.body && message.text.body.length > 4096) {
      throw new Error('Message text exceeds maximum length (4096 characters)');
    }
  }

  async sendTextMessage(to: string, text: string): Promise<string> {
    try {
      // Validate inputs
      if (!to || !text) {
        throw new Error('Phone number and message text are required');
      }

      if (text.trim().length === 0) {
        throw new Error('Message text cannot be empty');
      }

      const formattedPhone = this.formatPhoneNumber(to);
      
      const message: WhatsAppMessage = {
        to: formattedPhone,
        type: 'text',
        text: {
          body: text.trim(),
        },
      };

      return await this.sendMessage(message);
    } catch (error) {
      console.error('Failed to send text message:', error);
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Use the centralized phone validator
    const validation = validatePhoneNumber(phone);
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid phone number format');
    }
    
    return validation.formattedNumber!;
  }

  isConfigured(): boolean {
    return !!(this.apiToken && this.phoneNumberId);
  }
}

export const whatsappClient = new WhatsAppClient();