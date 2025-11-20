/**
 * Local Print Server Client
 * 
 * Connects to the local print server running on the same machine.
 * Falls back to browser printing if server is not available.
 */

// Get print server URL from localStorage (configurable per computer)
const getServerUrl = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('print_server_url');
    if (stored) return stored;
  }
  return 'http://localhost:3001';
};

interface PrintServerStatus {
  printerConnected: boolean;
  printers: any[];
  serverRunning: boolean;
}

class PrintServerClient {
  private isAvailable: boolean | null = null;

  /**
   * Set custom print server URL
   */
  setServerUrl(url: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('print_server_url', url);
    }
  }

  /**
   * Get current server URL (always fresh from localStorage)
   */
  getServerUrl(): string {
    return getServerUrl();
  }

  /**
   * Check if print server is running
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const serverUrl = this.getServerUrl();
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000), // 1 second timeout
      });
      
      this.isAvailable = response.ok;
      return response.ok;
    } catch (error) {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<PrintServerStatus | null> {
    try {
      const serverUrl = this.getServerUrl();
      const response = await fetch(`${serverUrl}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get print server status:', error);
      return null;
    }
  }

  /**
   * Print content to thermal printer
   */
  async print(content: string, orderNumber?: number): Promise<boolean> {
    try {
      const serverUrl = this.getServerUrl();
      console.log('[PrintServerClient] Attempting to print to:', serverUrl);
      console.log('[PrintServerClient] Order number:', orderNumber);
      console.log('[PrintServerClient] Content length:', content.length);
      
      const response = await fetch(`${serverUrl}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          orderNumber,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log('[PrintServerClient] Print successful');
        return true;
      }
      
      const error = await response.json();
      console.error('[PrintServerClient] Print server error:', error);
      return false;
    } catch (error) {
      console.error('[PrintServerClient] Failed to print via print server:', error);
      return false;
    }
  }

  /**
   * Check if server is available (cached)
   */
  isServerAvailable(): boolean | null {
    return this.isAvailable;
  }
}

// Export singleton instance
export const printServerClient = new PrintServerClient();
