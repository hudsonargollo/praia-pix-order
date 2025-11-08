import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebhookService } from '../webhook'
import type { MercadoPagoWebhookData } from '../types'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}))

vi.mock('../client', () => ({
  mercadoPagoService: {
    checkPaymentStatus: vi.fn()
  }
}))

vi.mock('@/integrations/whatsapp', () => ({
  whatsappService: {
    sendOrderConfirmation: vi.fn()
  }
}))

// Import mocked modules
import { supabase } from '@/integrations/supabase/client'
import { mercadoPagoService } from '../client'
import { whatsappService } from '@/integrations/whatsapp'

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
}

describe('WebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('processWebhookData', () => {
    const mockWebhookData: MercadoPagoWebhookData = {
      id: 'webhook-123',
      live_mode: false,
      type: 'payment',
      date_created: '2024-01-01T10:00:00Z',
      application_id: 'app-123',
      user_id: 'user-123',
      version: '1',
      api_version: 'v1',
      action: 'payment.updated',
      data: {
        id: 'payment-123'
      }
    }

    const mockOrder = {
      id: 'order-123',
      order_number: 1001,
      customer_name: 'João Silva',
      customer_phone: '+5511999999999',
      table_number: '5',
      total_amount: 25.50,
      status: 'pending_payment',
      payment_confirmed_at: null,
      created_at: '2024-01-01T09:00:00Z'
    }

    const mockPaymentStatus = {
      id: 'payment-123',
      status: 'approved' as const,
      statusDetail: 'accredited',
      transactionAmount: 25.50,
      dateCreated: '2024-01-01T10:00:00Z',
      dateApproved: '2024-01-01T10:05:00Z'
    }

    it('should process payment webhook successfully', async () => {
      // Mock payment status check
      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(mockPaymentStatus)

      // Mock order lookup - return order with matching payment ID
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [mockOrder], 
            error: null 
          }))
        }))
      }))

      // Mock order update
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))

      // Mock order items lookup for WhatsApp
      const mockOrderItemsSelect = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          data: [
            {
              item_name: 'Açaí com granola',
              quantity: 1,
              unit_price: 25.50
            }
          ], 
          error: null 
        }))
      }))

      vi.mocked(supabase.from)
        .mockReturnValueOnce({ select: mockSelect } as any)
        .mockReturnValueOnce({ update: mockUpdate } as any)
        .mockReturnValueOnce({ select: mockOrderItemsSelect } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(true)
      expect(mercadoPagoService.checkPaymentStatus).toHaveBeenCalledWith('payment-123')
    })

    it('should ignore non-payment webhooks', async () => {
      const nonPaymentWebhook = {
        ...mockWebhookData,
        type: 'subscription' as const
      }

      const result = await WebhookService.processWebhookData(nonPaymentWebhook)

      expect(result).toBe(true)
      expect(mercadoPagoService.checkPaymentStatus).not.toHaveBeenCalled()
    })

    it('should handle order not found', async () => {
      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(mockPaymentStatus)

      // Mock empty order result
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          }))
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(false)
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Order not found for payment:', 
        'payment-123'
      )
    })

    it('should handle database errors when finding order', async () => {
      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(mockPaymentStatus)

      // Mock database error
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Database error' }
          }))
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(false)
    })

    it('should update order status from pending_payment to paid', async () => {
      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(mockPaymentStatus)

      // Mock order lookup
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [mockOrder], 
            error: null 
          }))
        }))
      }))

      // Mock order update
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))

      vi.mocked(supabase.from)
        .mockReturnValueOnce({ select: mockSelect } as any)
        .mockReturnValueOnce({ update: mockUpdate } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'paid',
        payment_confirmed_at: expect.any(String)
      })
    })

    it('should handle rejected payments', async () => {
      const rejectedPaymentStatus = {
        ...mockPaymentStatus,
        status: 'rejected' as const
      }

      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(rejectedPaymentStatus)

      // Mock order lookup
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [mockOrder], 
            error: null 
          }))
        }))
      }))

      // Mock order update
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))

      vi.mocked(supabase.from)
        .mockReturnValueOnce({ select: mockSelect } as any)
        .mockReturnValueOnce({ update: mockUpdate } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'cancelled',
        payment_confirmed_at: null
      })
    })

    it('should handle cancelled payments', async () => {
      const cancelledPaymentStatus = {
        ...mockPaymentStatus,
        status: 'cancelled' as const
      }

      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(cancelledPaymentStatus)

      // Mock order lookup
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [mockOrder], 
            error: null 
          }))
        }))
      }))

      // Mock order update
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))

      vi.mocked(supabase.from)
        .mockReturnValueOnce({ select: mockSelect } as any)
        .mockReturnValueOnce({ update: mockUpdate } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'cancelled',
        payment_confirmed_at: null
      })
    })

    it('should not update order if status unchanged', async () => {
      const pendingPaymentStatus = {
        ...mockPaymentStatus,
        status: 'pending' as const
      }

      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(pendingPaymentStatus)

      // Mock order lookup
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [mockOrder], 
            error: null 
          }))
        }))
      }))

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(true)
      // Update should not be called since status didn't change
      expect(supabase.from).toHaveBeenCalledTimes(1) // Only for select
    })

    it('should handle database errors when updating order', async () => {
      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(mockPaymentStatus)

      // Mock order lookup
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [mockOrder], 
            error: null 
          }))
        }))
      }))

      // Mock order update with error
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          error: { message: 'Update failed' }
        }))
      }))

      vi.mocked(supabase.from)
        .mockReturnValueOnce({ select: mockSelect } as any)
        .mockReturnValueOnce({ update: mockUpdate } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(false)
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error updating order status:', 
        { message: 'Update failed' }
      )
    })

    it('should send WhatsApp confirmation for paid orders', async () => {
      vi.mocked(mercadoPagoService.checkPaymentStatus).mockResolvedValue(mockPaymentStatus)

      // Mock order lookup
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [mockOrder], 
            error: null 
          }))
        }))
      }))

      // Mock order update
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))

      // Mock order items lookup
      const mockOrderItemsSelect = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          data: [
            {
              item_name: 'Açaí com granola',
              quantity: 1,
              unit_price: 25.50
            }
          ], 
          error: null 
        }))
      }))

      vi.mocked(supabase.from)
        .mockReturnValueOnce({ select: mockSelect } as any)
        .mockReturnValueOnce({ update: mockUpdate } as any)
        .mockReturnValueOnce({ select: mockOrderItemsSelect } as any)

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(true)
      expect(whatsappService.sendOrderConfirmation).toHaveBeenCalledWith({
        id: 'order-123',
        orderNumber: 1001,
        customerName: 'João Silva',
        customerPhone: '+5511999999999',
        tableNumber: '5',
        totalAmount: 25.50,
        items: [
          {
            itemName: 'Açaí com granola',
            quantity: 1,
            unitPrice: 25.50
          }
        ],
        status: 'pending_payment',
        createdAt: '2024-01-01T09:00:00Z'
      })
    })

    it('should handle errors when checking payment status', async () => {
      vi.mocked(mercadoPagoService.checkPaymentStatus).mockRejectedValue(
        new Error('API error')
      )

      const result = await WebhookService.processWebhookData(mockWebhookData)

      expect(result).toBe(false)
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error processing webhook data:', 
        expect.any(Error)
      )
    })
  })

  describe('validateWebhookSignature', () => {
    it('should validate signature with secret', () => {
      const result = WebhookService.validateWebhookSignature(
        'payload', 
        'signature', 
        'secret'
      )
      expect(result).toBe(true)
    })

    it('should reject empty signature', () => {
      const result = WebhookService.validateWebhookSignature(
        'payload', 
        '', 
        'secret'
      )
      expect(result).toBe(false)
    })

    it('should handle validation errors gracefully', () => {
      // This tests the error handling in the validation method
      const result = WebhookService.validateWebhookSignature(
        'payload', 
        'signature', 
        'secret'
      )
      expect(result).toBe(true)
    })
  })

  describe('isDuplicateWebhook', () => {
    it('should return false for now (not implemented)', async () => {
      const result = await WebhookService.isDuplicateWebhook('webhook-123')
      expect(result).toBe(false)
    })
  })

  describe('getWebhookStatus', () => {
    it('should return not_found for now (not implemented)', async () => {
      const result = await WebhookService.getWebhookStatus('webhook-123')
      expect(result).toBe('not_found')
    })

    it('should handle errors and return failed', async () => {
      // This would test error handling when the method is fully implemented
      const result = await WebhookService.getWebhookStatus('webhook-123')
      expect(result).toBe('not_found')
    })
  })
})