/**
 * PrintNode Integration for Thermal Printer Support
 * 
 * PrintNode provides reliable thermal printer integration for web applications.
 * Supports Elgin, Bematech, Epson, Star, and other ESC/POS printers.
 */

interface PrintNodePrinter {
  id: number;
  name: string;
  description: string;
  capabilities: Record<string, any>;
  default: boolean;
  createTimestamp: string;
  state: string;
}

interface PrintNodePrintJob {
  printerId: number;
  title: string;
  contentType: 'pdf_uri' | 'pdf_base64' | 'raw_uri' | 'raw_base64';
  content: string;
  source: string;
}

class PrintNodeClient {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.printnode.com';

  constructor() {
    // Try to load API key from localStorage
    this.loadApiKey();
  }

  /**
   * Set the PrintNode API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem('printnode_api_key', apiKey);
    }
  }

  /**
   * Load API key from localStorage
   */
  private loadApiKey(): void {
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('printnode_api_key');
    }
  }

  /**
   * Check if PrintNode is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): string {
    if (!this.apiKey) {
      throw new Error('PrintNode API key not configured');
    }
    return `Basic ${btoa(this.apiKey + ':')}`;
  }

  /**
   * Get list of available printers
   */
  async getPrinters(): Promise<PrintNodePrinter[]> {
    if (!this.apiKey) {
      throw new Error('PrintNode API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/printers`, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get printers: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Print raw text content (for thermal printers)
   */
  async printRawText(printerId: number, content: string, title: string = 'Receipt'): Promise<number> {
    if (!this.apiKey) {
      throw new Error('PrintNode API key not configured');
    }

    const printJob: PrintNodePrintJob = {
      printerId,
      title,
      contentType: 'raw_base64',
      content: btoa(content),
      source: 'Coco Loko Kitchen',
    };

    const response = await fetch(`${this.baseUrl}/printjobs`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printJob),
    });

    if (!response.ok) {
      throw new Error(`Failed to print: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Get the default printer ID from localStorage
   */
  getDefaultPrinterId(): number | null {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('printnode_default_printer');
      return id ? parseInt(id, 10) : null;
    }
    return null;
  }

  /**
   * Set the default printer ID
   */
  setDefaultPrinterId(printerId: number): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('printnode_default_printer', printerId.toString());
    }
  }

  /**
   * Test the connection to PrintNode
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getPrinters();
      return true;
    } catch (error) {
      console.error('PrintNode connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const printNodeClient = new PrintNodeClient();
