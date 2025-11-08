import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaileysWhatsAppClient } from '../baileys-client';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Baileys WhatsApp Connection Integration Tests', () => {
  let client: BaileysWhatsAppClient;

  beforeEach(() => {
    client = new BaileysWhatsAppClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Connection Management', () => {
    it('should get connection status successfully', async () => {
      const mockStatus = {
        isConnected: true,
        connectionState: 'connected',
        phoneNumber: '5511999999999',
        lastConnected: '2024-01-01T10:00:00Z',
        monitoring: {
          retryCount: 0,
          isRetrying: false,
          uptime: 300000,
          lastHeartbeat: '2024-01-01T10:05:00Z'
        },
        timestamp: '2024-01-01T10:05:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const status = await client.getConnectionStatus();

      expect(mockFetch).toHaveBeenCalledWith('/api/whatsapp/connection?action=status');
      expect(status).toEqual(mockStatus);
      expect(status.isConnected).toBe(true);
      expect(status.connectionState).toBe('connected');
    });

    it('should handle connection status error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(client.getConnectionStatus()).rejects.toThrow(
        'Failed to get connection status: HTTP 500: Internal Server Error'
      );
    });

    it('should initiate connection successfully', async () => {
      const mockStatus = {
        isConnected: false,
        connectionState: 'connecting',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const status = await client.connect();

      expect(mockFetch).toHaveBeenCalledWith('/api/whatsapp/connection?action=connect', {
        method: 'POST'
      });
      expect(status.connectionState).toBe('connecting');
    });

    it('should disconnect successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await client.disconnect();

      expect(mockFetch).toHaveBeenCalledWith('/api/whatsapp/connection?action=disconnect', {
        method: 'POST'
      });
      expect(result.success).toBe(true);
    });

    it('should check if connection is ready', async () => {
      const mockStatus = {
        isConnected: true,
        connectionState: 'connected',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const isReady = await client.isReady();

      expect(isReady).toBe(true);
    });

    it('should return false when not ready', async () => {
      const mockStatus = {
        isConnected: false,
        connectionState: 'disconnected',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const isReady = await client.isReady();

      expect(isReady).toBe(false);
    });
  });

  describe('Message Sending', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        success: true,
        messageId: 'msg_123456789'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.sendMessage('5511999999999', 'Test message');

      expect(mockFetch).toHaveBeenCalledWith('/api/whatsapp/connection?action=send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: '5511999999999',
          message: 'Test message'
        })
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_123456789');
    });

    it('should handle message sending error', async () => {
      const mockError = {
        error: 'WhatsApp not connected'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockError)
      });

      const result = await client.sendMessage('5511999999999', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('WhatsApp not connected');
    });

    it('should handle network error during message sending', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.sendMessage('5511999999999', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Connection Monitoring and Recovery', () => {
    it('should perform health check successfully', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        monitoring: {
          retryCount: 0,
          isRetrying: false,
          uptime: 600000,
          lastHeartbeat: '2024-01-01T10:10:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse)
      });

      const health = await client.performHealthCheck();

      expect(mockFetch).toHaveBeenCalledWith('/api/whatsapp/connection?action=health');
      expect(health.status).toBe('healthy');
      expect(health.monitoring.uptime).toBe(600000);
    });

    it('should retry connection successfully', async () => {
      const mockRetryResponse = {
        success: true,
        message: 'Reconnection initiated'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRetryResponse)
      });

      const result = await client.retryConnection();

      expect(mockFetch).toHaveBeenCalledWith('/api/whatsapp/connection?action=retry', {
        method: 'POST'
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Reconnection initiated');
    });

    it('should handle retry when already connected', async () => {
      const mockRetryResponse = {
        success: false,
        message: 'Connection is already active'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRetryResponse)
      });

      const result = await client.retryConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection is already active');
    });

    it('should reset connection successfully', async () => {
      const mockResetResponse = {
        success: true,
        message: 'Connection reset successfully'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResetResponse)
      });

      const result = await client.resetConnection();

      expect(mockFetch).toHaveBeenCalledWith('/api/whatsapp/connection?action=reset', {
        method: 'POST'
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Connection reset successfully');
    });

    it('should wait for connection successfully', async () => {
      // Mock immediate successful connection
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          isConnected: true,
          connectionState: 'connected',
          timestamp: '2024-01-01T10:00:01Z'
        })
      });

      const status = await client.waitForConnection(1000);

      expect(status.isConnected).toBe(true);
      expect(status.connectionState).toBe('connected');
    });



    it('should handle failed connection state during wait', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          isConnected: false,
          connectionState: 'failed',
          timestamp: '2024-01-01T10:00:00Z'
        })
      });

      await expect(client.waitForConnection(5000)).rejects.toThrow('Connection failed');
    });
  });

  describe('Phone Number Formatting', () => {
    it('should format Brazilian phone numbers correctly', () => {
      // Test cases for Brazilian phone number formatting
      expect(client.formatPhoneNumber('11999999999')).toBe('5511999999999');
      expect(client.formatPhoneNumber('011999999999')).toBe('5511999999999');
      expect(client.formatPhoneNumber('5511999999999')).toBe('5511999999999');
      expect(client.formatPhoneNumber('+55 11 99999-9999')).toBe('5511999999999');
    });

    it('should handle landline numbers', () => {
      expect(client.formatPhoneNumber('1133334444')).toBe('551133334444');
      expect(client.formatPhoneNumber('01133334444')).toBe('551133334444');
    });

    it('should validate phone number length', () => {
      expect(() => client.formatPhoneNumber('123')).toThrow('Invalid phone number format or length');
      expect(() => client.formatPhoneNumber('55119999999999999')).toThrow('Invalid Brazilian phone number length');
    });

    it('should handle empty phone numbers', () => {
      expect(() => client.formatPhoneNumber('')).toThrow('Phone number cannot be empty');
      expect(() => client.formatPhoneNumber('   ')).toThrow('Phone number cannot be empty');
    });

    it('should handle international numbers', () => {
      expect(client.formatPhoneNumber('1234567890123')).toBe('1234567890123');
      expect(() => client.formatPhoneNumber('123456789012345678')).toThrow('Invalid phone number format or length');
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(client.getConnectionStatus()).rejects.toThrow(
        'Failed to get connection status: HTTP 404: Not Found'
      );
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(client.getConnectionStatus()).rejects.toThrow(
        'Failed to get connection status: Invalid JSON'
      );
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(client.getConnectionStatus()).rejects.toThrow(
        'Failed to get connection status: Request timeout'
      );
    });
  });

  describe('Connection State Transitions', () => {
    it('should handle QR code required state', async () => {
      const mockStatus = {
        isConnected: false,
        connectionState: 'qr_required',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const status = await client.getConnectionStatus();

      expect(status.connectionState).toBe('qr_required');
      expect(status.qrCode).toBeDefined();
      expect(status.isConnected).toBe(false);
    });

    it('should handle connecting state', async () => {
      const mockStatus = {
        isConnected: false,
        connectionState: 'connecting',
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const status = await client.getConnectionStatus();

      expect(status.connectionState).toBe('connecting');
      expect(status.isConnected).toBe(false);
    });

    it('should handle failed state', async () => {
      const mockStatus = {
        isConnected: false,
        connectionState: 'failed',
        monitoring: {
          retryCount: 5,
          isRetrying: false,
          lastRetryTime: '2024-01-01T09:55:00Z'
        },
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const status = await client.getConnectionStatus();

      expect(status.connectionState).toBe('failed');
      expect(status.isConnected).toBe(false);
      expect(status.monitoring?.retryCount).toBe(5);
    });
  });

  describe('Session Recovery Scenarios', () => {
    it('should handle session restoration after restart', async () => {
      // Simulate connecting with existing session
      const mockStatus = {
        isConnected: true,
        connectionState: 'connected',
        phoneNumber: '5511999999999',
        lastConnected: '2024-01-01T10:00:00Z',
        monitoring: {
          retryCount: 0,
          isRetrying: false,
          connectionStartTime: '2024-01-01T10:00:00Z'
        },
        timestamp: '2024-01-01T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const status = await client.connect();

      expect(status.isConnected).toBe(true);
      expect(status.phoneNumber).toBe('5511999999999');
    });

    it('should handle session expiration and re-authentication', async () => {
      // First call returns QR required (session expired)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          isConnected: false,
          connectionState: 'qr_required',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          timestamp: '2024-01-01T10:00:00Z'
        })
      });

      const status = await client.connect();

      expect(status.connectionState).toBe('qr_required');
      expect(status.qrCode).toBeDefined();
    });

    it('should handle connection recovery after network issues', async () => {
      // Simulate retry after network failure
      const mockRetryResponse = {
        success: true,
        message: 'Reconnection initiated'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRetryResponse)
      });

      const result = await client.retryConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Reconnection initiated');
    });
  });
});