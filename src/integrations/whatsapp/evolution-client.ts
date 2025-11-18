/**
 * Evolution API Client for WhatsApp Integration
 * Provides a clean interface to send WhatsApp messages via Evolution API
 */

export interface EvolutionAPIConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface SendTextMessageParams {
  number: string;
  text: string;
  delay?: number;
}

export interface EvolutionAPIResponse {
  key?: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message?: any;
  messageTimestamp?: string;
  status?: string;
}

export interface InstanceStatus {
  instanceName: string;
  state: 'open' | 'close' | 'connecting';
}

export class EvolutionAPIClient {
  private config: EvolutionAPIConfig;

  constructor(config?: EvolutionAPIConfig) {
    // Handle both browser (import.meta.env) and Node.js (process.env) environments
    const getEnv = (key: string): string => {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key] || '';
      }
      if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || '';
      }
      return '';
    };

    // Fallback to hardcoded values if env vars not available
    const defaultConfig = {
      apiUrl: 'http://wppapi.clubemkt.digital',
      apiKey: 'DD451E404240-4C45-AF35-BFCA6A976927',
      instanceName: 'cocooo',
    };

    this.config = config || {
      apiUrl: getEnv('VITE_EVOLUTION_API_URL') || defaultConfig.apiUrl,
      apiKey: getEnv('VITE_EVOLUTION_API_KEY') || defaultConfig.apiKey,
      instanceName: getEnv('VITE_EVOLUTION_INSTANCE_NAME') || defaultConfig.instanceName,
    };

    console.log('Evolution API initialized:', {
      url: this.config.apiUrl,
      instance: this.config.instanceName,
      hasKey: !!this.config.apiKey,
      configured: this.isConfigured()
    });
  }

  /**
   * Check if the Evolution API is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.apiUrl &&
      this.config.apiKey &&
      this.config.instanceName
    );
  }

  /**
   * Make a request to the Evolution API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Evolution API not configured. Check environment variables.');
    }

    const url = `${this.config.apiUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.response?.message || data.error || response.statusText;
        throw new Error(`Evolution API Error (${response.status}): ${JSON.stringify(errorMessage)}`);
      }

      return data as T;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to Evolution API');
      }
      throw error;
    }
  }

  /**
   * Get the connection status of the WhatsApp instance
   */
  async getConnectionStatus(): Promise<InstanceStatus> {
    return this.makeRequest<InstanceStatus>(
      `/instance/connectionState/${this.config.instanceName}`,
      'GET'
    ).then(response => {
      // Evolution API returns { instance: { instanceName, state } }
      return (response as any).instance as InstanceStatus;
    });
  }

  /**
   * Check if the instance is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const status = await this.getConnectionStatus();
      return status.state === 'open';
    } catch (error) {
      console.error('Failed to check connection status:', error);
      return false;
    }
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendTextMessage(params: SendTextMessageParams): Promise<EvolutionAPIResponse> {
    // Validate phone number format
    let phoneNumber = params.number.trim();
    
    // If number doesn't start with +, add it
    if (!phoneNumber.startsWith('+')) {
      // Remove all non-digits first
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      // Add + prefix
      phoneNumber = '+' + cleanNumber;
    } else {
      // Keep the + but remove other non-digit characters except +
      phoneNumber = '+' + phoneNumber.substring(1).replace(/\D/g, '');
    }
    
    // Validate length (should be +55XXXXXXXXXXX = 14 characters for Brazil)
    if (phoneNumber.length < 12 || phoneNumber.length > 16) {
      throw new Error(`Invalid phone number format: ${phoneNumber}. Must be +[country code][number]`);
    }

    // Validate message text
    if (!params.text || params.text.trim().length === 0) {
      throw new Error('Message text cannot be empty');
    }

    const payload = {
      number: phoneNumber,
      text: params.text.trim(),
      delay: params.delay || 0,
    };

    // Use Cloudflare Function proxy to bypass CORS
    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Evolution API Error (${response.status}): ${JSON.stringify(data)}`);
      }

      return data as EvolutionAPIResponse;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Format a phone number to the correct format for Evolution API
   * Accepts formats like: +55 11 99999-9999, (11) 99999-9999, 11999999999
   * Returns: 5511999999999 (country code + number, no formatting)
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with 0, remove it (common in Brazil)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If it doesn't start with country code, assume Brazil (55)
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Validate if a phone number has WhatsApp
   * Note: Evolution API will return this info when trying to send a message
   */
  async checkWhatsAppExists(phone: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatPhoneNumber(phone);
      
      // Try to send a test message to check if number exists
      // Evolution API returns error if number doesn't have WhatsApp
      await this.sendTextMessage({
        number: formattedNumber,
        text: 'test', // This won't actually be sent, just validates the number
      });
      
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      
      // Check if error indicates number doesn't exist
      if (errorMessage.includes('exists') || errorMessage.includes('not found')) {
        return false;
      }
      
      // Other errors might not be related to number existence
      throw error;
    }
  }

  /**
   * Get QR code for connecting the WhatsApp instance
   * Returns base64 QR code image
   */
  async getQRCode(): Promise<{ qrcode?: string; state?: string }> {
    return this.makeRequest(
      `/instance/connect/${this.config.instanceName}`,
      'GET'
    );
  }

  /**
   * Fetch all instances
   */
  async fetchInstances(): Promise<any[]> {
    return this.makeRequest<any[]>('/instance/fetchInstances', 'GET');
  }

  /**
   * Logout and disconnect the instance
   */
  async logout(): Promise<void> {
    await this.makeRequest(
      `/instance/logout/${this.config.instanceName}`,
      'POST'
    );
  }

  /**
   * Restart the instance
   */
  async restart(): Promise<void> {
    await this.makeRequest(
      `/instance/restart/${this.config.instanceName}`,
      'POST'
    );
  }
}

// Export a singleton instance
export const evolutionClient = new EvolutionAPIClient();
