/**
 * Baileys WhatsApp Client for frontend integration
 * This client communicates with the Cloudflare Function that manages the Baileys connection
 */

export interface BaileysConnectionStatus {
  isConnected: boolean;
  qrCode?: string;
  lastConnected?: string;
  phoneNumber?: string;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'qr_required' | 'failed';
  monitoring?: {
    retryCount: number;
    lastRetryTime?: string;
    isRetrying: boolean;
    connectionStartTime?: string;
    lastHeartbeat?: string;
    uptime: number;
    timeSinceLastHeartbeat?: number;
  };
  timestamp: string;
}

export interface BaileysMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class BaileysWhatsAppClient {
  private baseUrl: string;

  constructor() {
    // Use the Cloudflare Function endpoint
    this.baseUrl = '/api/whatsapp/connection';
  }

  /**
   * Get current connection status
   */
  async getConnectionStatus(): Promise<BaileysConnectionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}?action=status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get connection status:', error);
      throw new Error(`Failed to get connection status: ${error.message}`);
    }
  }

  /**
   * Initialize WhatsApp connection
   */
  async connect(): Promise<BaileysConnectionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}?action=connect`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to connect:', error);
      throw new Error(`Failed to connect: ${error.message}`);
    }
  }

  /**
   * Disconnect WhatsApp
   */
  async disconnect(): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}?action=disconnect`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  }

  /**
   * Send a text message via Baileys
   */
  async sendMessage(to: string, message: string): Promise<BaileysMessageResult> {
    try {
      const response = await fetch(`${this.baseUrl}?action=send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, message }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: `Failed to send message: ${error.message}`,
      };
    }
  }

  /**
   * Check if WhatsApp is connected and ready
   */
  async isReady(): Promise<boolean> {
    try {
      const status = await this.getConnectionStatus();
      return status.isConnected && status.connectionState === 'connected';
    } catch (error) {
      console.error('Failed to check if ready:', error);
      return false;
    }
  }

  /**
   * Wait for connection to be ready
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<BaileysConnectionStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.getConnectionStatus();
        
        if (status.isConnected && status.connectionState === 'connected') {
          return status;
        }
        
        if (status.connectionState === 'failed') {
          throw new Error('Connection failed');
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error while waiting for connection:', error);
        throw error;
      }
    }
    
    throw new Error('Connection timeout');
  }

  /**
   * Perform health check on the connection
   */
  async performHealthCheck(): Promise<{ status: string; monitoring: any }> {
    try {
      const response = await fetch(`${this.baseUrl}?action=health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to perform health check:', error);
      throw new Error(`Failed to perform health check: ${error.message}`);
    }
  }

  /**
   * Retry connection manually
   */
  async retryConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}?action=retry`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to retry connection:', error);
      throw new Error(`Failed to retry connection: ${error.message}`);
    }
  }

  /**
   * Reset connection and clear session
   */
  async resetConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}?action=reset`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to reset connection:', error);
      throw new Error(`Failed to reset connection: ${error.message}`);
    }
  }

  /**
   * Format phone number for Brazilian WhatsApp
   */
  formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    if (!cleaned) {
      throw new Error('Phone number cannot be empty');
    }

    // If it starts with 55 (Brazil country code), validate and use as is
    if (cleaned.startsWith('55')) {
      if (cleaned.length >= 12 && cleaned.length <= 14) {
        return cleaned;
      } else {
        throw new Error('Invalid Brazilian phone number length');
      }
    }
    
    // If it starts with 0, remove it and add Brazil country code
    if (cleaned.startsWith('0')) {
      const withoutZero = cleaned.substring(1);
      if (withoutZero.length >= 10 && withoutZero.length <= 11) {
        return '55' + withoutZero;
      } else {
        throw new Error('Invalid phone number length after removing leading zero');
      }
    }
    
    // If it's a local Brazilian number, add Brazil country code
    if (cleaned.length === 10 || cleaned.length === 11) {
      return '55' + cleaned;
    }
    
    // For international numbers, validate length
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return cleaned;
    }
    
    throw new Error('Invalid phone number format or length');
  }
}

// Export singleton instance
export const baileysWhatsAppClient = new BaileysWhatsAppClient();