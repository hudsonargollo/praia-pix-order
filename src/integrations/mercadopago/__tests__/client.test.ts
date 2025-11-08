import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mercadoPagoService } from '../client'
import type { PaymentRequest } from '../client'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console methods to avoid noise in tests
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
}

describe('MercadoPagoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('createPayment', () => {
    const validPaymentData: PaymentRequest = {
      orderId: 'order-123',
      amount: 25.50,
      description: 'Açaí com granola',
      customerName: 'João Silva',
      customerPhone: '+5511999999999',
      tableNumber: '5'
    }

    const mockSuccessResponse = {
      id: 'payment-123',
      status: 'pending',
      point_of_interaction: {
        transaction_data: {
          qr_code: 'pix-qr-code-string',
          qr_code_base64: 'base64-encoded-qr',
        }
      },
      date_of_expiration: '2024-01-01T12:00:00Z',
      transaction_amount: 25.50
    }

    it('should create payment successfully with valid data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      })

      const result = await mercadoPagoService.createPayment(validPaymentData)

      expect(result).toEqual({
        id: 'payment-123',
        status: 'pending',
        qrCode: 'pix-qr-code-string',
        qrCodeBase64: 'base64-encoded-qr',
        pixCopyPaste: 'pix-qr-code-string',
        expirationDate: '2024-01-01T12:00:00Z',
        transactionAmount: 25.50
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mercadopago.com/v1/payments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Idempotency-Key': 'order-123'
          }),
          body: expect.stringContaining('"transaction_amount":25.5')
        })
      )
    })

    it('should validate required fields', async () => {
      const invalidData = { ...validPaymentData, orderId: '' }
      
      await expect(mercadoPagoService.createPayment(invalidData))
        .rejects.toThrow('Order ID is required')
    })

    it('should validate amount is positive', async () => {
      const invalidData = { ...validPaymentData, amount: 0 }
      
      await expect(mercadoPagoService.createPayment(invalidData))
        .rejects.toThrow('Valid amount is required')
    })

    it('should validate customer name length', async () => {
      const invalidData = { ...validPaymentData, customerName: 'A' }
      
      await expect(mercadoPagoService.createPayment(invalidData))
        .rejects.toThrow('Valid customer name is required')
    })

    it('should validate phone number length', async () => {
      const invalidData = { ...validPaymentData, customerPhone: '123' }
      
      await expect(mercadoPagoService.createPayment(invalidData))
        .rejects.toThrow('Valid customer phone is required')
    })

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          message: 'Invalid payment data'
        })
      })

      await expect(mercadoPagoService.createPayment(validPaymentData))
        .rejects.toThrow('HTTP 400: Invalid payment data')
    })

    it('should handle network errors with retry', async () => {
      // Mock network error
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessResponse)
        })

      const result = await mercadoPagoService.createPayment(validPaymentData)

      expect(result.id).toBe('payment-123')
      expect(mockFetch).toHaveBeenCalledTimes(3) // 2 failures + 1 success
    })

    it('should fail after max retries', async () => {
      // Mock persistent network error
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(mercadoPagoService.createPayment(validPaymentData))
        .rejects.toThrow('Network error')

      expect(mockFetch).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    }, 10000)

    it('should not retry non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          message: 'Invalid credentials'
        })
      })

      await expect(mercadoPagoService.createPayment(validPaymentData))
        .rejects.toThrow('HTTP 401: Invalid credentials')

      expect(mockFetch).toHaveBeenCalledTimes(1) // No retries for 401
    })

    it('should handle missing QR code data gracefully', async () => {
      const responseWithoutQR = {
        ...mockSuccessResponse,
        point_of_interaction: {}
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseWithoutQR)
      })

      const result = await mercadoPagoService.createPayment(validPaymentData)

      expect(result.qrCode).toBe('')
      expect(result.qrCodeBase64).toBe('')
      expect(result.pixCopyPaste).toBe('')
    })
  })

  describe('checkPaymentStatus', () => {
    const mockStatusResponse = {
      id: 'payment-123',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 25.50,
      date_created: '2024-01-01T10:00:00Z',
      date_approved: '2024-01-01T10:05:00Z'
    }

    it('should check payment status successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatusResponse)
      })

      const result = await mercadoPagoService.checkPaymentStatus('payment-123')

      expect(result).toEqual({
        id: 'payment-123',
        status: 'approved',
        statusDetail: 'accredited',
        transactionAmount: 25.50,
        dateCreated: '2024-01-01T10:00:00Z',
        dateApproved: '2024-01-01T10:05:00Z'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mercadopago.com/v1/payments/payment-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should validate payment ID is provided', async () => {
      await expect(mercadoPagoService.checkPaymentStatus(''))
        .rejects.toThrow('Payment ID is required')
    })

    it('should handle API errors when checking status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({
          message: 'Payment not found'
        })
      })

      await expect(mercadoPagoService.checkPaymentStatus('invalid-id'))
        .rejects.toThrow('HTTP 404: Payment not found')
    })

    it('should retry on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatusResponse)
        })

      const result = await mercadoPagoService.checkPaymentStatus('payment-123')

      expect(result.status).toBe('approved')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('processWebhook', () => {
    const mockWebhookData = {
      type: 'payment',
      action: 'payment.updated',
      data: { id: 'payment-123' },
      external_reference: 'order-123'
    }

    it('should process webhook successfully', async () => {
      const mockStatusResponse = {
        id: 'payment-123',
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 25.50,
        date_created: '2024-01-01T10:00:00Z',
        date_approved: '2024-01-01T10:05:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatusResponse)
      })

      const result = await mercadoPagoService.processWebhook(mockWebhookData)

      expect(result).toEqual({
        orderId: 'order-123',
        status: 'approved',
        paymentId: 'payment-123'
      })
    })

    it('should handle webhook without payment ID', async () => {
      const invalidWebhook = { ...mockWebhookData, data: {} }

      await expect(mercadoPagoService.processWebhook(invalidWebhook))
        .rejects.toThrow('Invalid webhook data: missing payment ID')
    })

    it('should handle errors when fetching payment status', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'))

      await expect(mercadoPagoService.processWebhook(mockWebhookData))
        .rejects.toThrow('API error')
    })
  })

  describe('validateWebhookSignature', () => {
    it('should validate signature exists', () => {
      const result = mercadoPagoService.validateWebhookSignature('payload', 'signature')
      expect(result).toBe(true)
    })

    it('should reject empty signature', () => {
      const result = mercadoPagoService.validateWebhookSignature('payload', '')
      expect(result).toBe(false)
    })

    it('should reject missing signature', () => {
      const result = mercadoPagoService.validateWebhookSignature('payload', null as any)
      expect(result).toBe(false)
    })
  })

  describe('error handling utilities', () => {
    it('should identify retryable network errors', async () => {
      // Mock network error followed by success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessResponse)
        })

      const result = await mercadoPagoService.createPayment(validPaymentData)
      
      expect(result.id).toBe('payment-123')
      expect(mockFetch).toHaveBeenCalledTimes(2) // 1 failure + 1 success
    })

    it('should not retry non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          message: 'Invalid request'
        })
      })
      
      await expect(mercadoPagoService.createPayment(validPaymentData))
        .rejects.toThrow('HTTP 400: Invalid request')
        
      // Should not have retried (only 1 call)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})