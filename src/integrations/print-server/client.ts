/**
 * Local Print Server Client
 * 
 * Connects to the local print server running on the same machine.
 * Falls back to browser printing if server is not available.
 */

const PRINT_SERVER_URL = 'http://localhost:3001';

interface PrintServerStatus {
  printerConnected: boolean;
  printers: any[];
  serverRunning: boolean;
}

class PrintServerClient {
  private isAvailable: boolean | null = null;

  /**
   * Check if print server is running
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${PRINT_SERVER_URL}/health`, {
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
      const response = await fetch(`${PRINT_SERVER_URL}/status`, {
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
      const response = await fetch(`${PRINT_SERVER_URL}/print`, {
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
        return true;
      }
      
      const error = await response.json();
      console.error('Print server error:', error);
      return false;
    } catch (error) {
      console.error('Failed to print via print server:', error);
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
