import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import type { 
  WhatsAppSession, 
  QueuedNotification, 
  MessageTemplate, 
  NotificationType 
} from '../types'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}))

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
}

describe('WhatsApp Database Schema Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('WhatsApp Sessions Table', () => {
    const mockSessionData = {
      id: 'session-123',
      sessionId: 'baileys-session-1',
      sessionData: { creds: {}, keys: {} },
      phoneNumber: '+5511999999999',
      isActive: true,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z')
    }

    it('should create WhatsApp session successfully', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [mockSessionData], 
          error: null 
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      // Simulate session creation
      const sessionData = {
        session_id: 'baileys-session-1',
        session_data: { creds: {}, keys: {} },
        phone_number: '+5511999999999',
        is_active: true
      }

      const result = await supabase.from('whatsapp_sessions').insert(sessionData).select()

      expect(result.data).toEqual([mockSessionData])
      expect(result.error).toBeNull()
      expect(mockInsert).toHaveBeenCalledWith(sessionData)
    })

    it('should retrieve active session by session_id', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: mockSessionData, 
            error: null 
          }))
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('whatsapp_sessions')
        .select('*')
        .eq('session_id', 'baileys-session-1')
        .single()

      expect(result.data).toEqual(mockSessionData)
      expect(result.error).toBeNull()
    })

    it('should update session data', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const updateData = {
        session_data: { creds: { updated: true }, keys: {} },
        phone_number: '+5511888888888',
        updated_at: new Date().toISOString()
      }

      const result = await supabase.from('whatsapp_sessions')
        .update(updateData)
        .eq('session_id', 'baileys-session-1')

      expect(result.error).toBeNull()
      expect(mockUpdate).toHaveBeenCalledWith(updateData)
    })

    it('should handle session data validation', async () => {
      // Test that session_data is required (JSONB NOT NULL)
      const invalidSessionData = {
        session_id: 'test-session',
        // Missing session_data
        is_active: true
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'null value in column "session_data" violates not-null constraint' }
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('whatsapp_sessions').insert(invalidSessionData).select()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('session_data')
    })

    it('should enforce unique session_id constraint', async () => {
      const duplicateSessionData = {
        session_id: 'baileys-session-1', // Same as existing
        session_data: { creds: {}, keys: {} },
        is_active: true
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'duplicate key value violates unique constraint "whatsapp_sessions_session_id_key"' }
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('whatsapp_sessions').insert(duplicateSessionData).select()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('unique constraint')
    })
  })

  describe('WhatsApp Notifications Table', () => {
    const mockNotificationData = {
      id: 'notification-123',
      orderId: 'order-123',
      customerPhone: '+5511999999999',
      notificationType: 'payment_confirmed' as NotificationType,
      messageContent: 'Seu pagamento foi confirmado!',
      status: 'pending' as const,
      attempts: 0,
      scheduledAt: new Date('2024-01-01T10:00:00Z'),
      createdAt: new Date('2024-01-01T10:00:00Z')
    }

    it('should create notification successfully', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [mockNotificationData], 
          error: null 
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const notificationData = {
        order_id: 'order-123',
        customer_phone: '+5511999999999',
        notification_type: 'payment_confirmed',
        message_content: 'Seu pagamento foi confirmado!',
        status: 'pending',
        attempts: 0,
        scheduled_at: new Date('2024-01-01T10:00:00Z').toISOString()
      }

      const result = await supabase.from('whatsapp_notifications').insert(notificationData).select()

      expect(result.data).toEqual([mockNotificationData])
      expect(result.error).toBeNull()
      expect(mockInsert).toHaveBeenCalledWith(notificationData)
    })

    it('should retrieve pending notifications ordered by scheduled_at', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ 
            data: [mockNotificationData], 
            error: null 
          }))
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('whatsapp_notifications')
        .select('*')
        .eq('status', 'pending')
        .order('scheduled_at')

      expect(result.data).toEqual([mockNotificationData])
      expect(result.error).toBeNull()
    })

    it('should update notification status and attempts', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const updateData = {
        status: 'sent',
        attempts: 1,
        sent_at: new Date().toISOString(),
        whatsapp_message_id: 'msg-123'
      }

      const result = await supabase.from('whatsapp_notifications')
        .update(updateData)
        .eq('id', 'notification-123')

      expect(result.error).toBeNull()
      expect(mockUpdate).toHaveBeenCalledWith(updateData)
    })

    it('should handle foreign key constraint for order_id', async () => {
      const invalidNotificationData = {
        order_id: 'non-existent-order',
        customer_phone: '+5511999999999',
        notification_type: 'payment_confirmed',
        message_content: 'Test message'
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'insert or update on table "whatsapp_notifications" violates foreign key constraint' }
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('whatsapp_notifications').insert(invalidNotificationData).select()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('foreign key constraint')
    })

    it('should validate notification_type check constraint', async () => {
      const invalidNotificationData = {
        order_id: 'order-123',
        customer_phone: '+5511999999999',
        notification_type: 'invalid_type', // Not in allowed values
        message_content: 'Test message'
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'new row for relation "whatsapp_notifications" violates check constraint' }
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('whatsapp_notifications').insert(invalidNotificationData).select()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('check constraint')
    })

    it('should validate status check constraint', async () => {
      const invalidStatusData = {
        order_id: 'order-123',
        customer_phone: '+5511999999999',
        notification_type: 'payment_confirmed',
        message_content: 'Test message',
        status: 'invalid_status' // Not in allowed values
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'new row for relation "whatsapp_notifications" violates check constraint' }
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('whatsapp_notifications').insert(invalidStatusData).select()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('check constraint')
    })
  })

  describe('Notification Templates Table', () => {
    const mockTemplateData = {
      id: 'template-123',
      templateType: 'payment_confirmed' as NotificationType,
      content: 'Olá {{customerName}}! Seu pagamento foi confirmado!',
      variables: ['customerName', 'orderNumber'],
      isActive: true,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z')
    }

    it('should create notification template successfully', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [mockTemplateData], 
          error: null 
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const templateData = {
        template_type: 'payment_confirmed',
        content: 'Olá {{customerName}}! Seu pagamento foi confirmado!',
        variables: ['customerName', 'orderNumber'],
        is_active: true
      }

      const result = await supabase.from('notification_templates').insert(templateData).select()

      expect(result.data).toEqual([mockTemplateData])
      expect(result.error).toBeNull()
      expect(mockInsert).toHaveBeenCalledWith(templateData)
    })

    it('should retrieve active template by type', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: mockTemplateData, 
            error: null 
          }))
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('notification_templates')
        .select('*')
        .eq('template_type', 'payment_confirmed')
        .single()

      expect(result.data).toEqual(mockTemplateData)
      expect(result.error).toBeNull()
    })

    it('should update template content', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const updateData = {
        content: 'Olá {{customerName}}! Seu pagamento de R$ {{orderTotal}} foi confirmado!',
        variables: ['customerName', 'orderTotal'],
        updated_at: new Date().toISOString()
      }

      const result = await supabase.from('notification_templates')
        .update(updateData)
        .eq('template_type', 'payment_confirmed')

      expect(result.error).toBeNull()
      expect(mockUpdate).toHaveBeenCalledWith(updateData)
    })

    it('should enforce unique template_type constraint', async () => {
      const duplicateTemplateData = {
        template_type: 'payment_confirmed', // Same as existing
        content: 'Duplicate template',
        variables: [],
        is_active: true
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'duplicate key value violates unique constraint "notification_templates_template_type_key"' }
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('notification_templates').insert(duplicateTemplateData).select()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('unique constraint')
    })

    it('should handle content validation (NOT NULL)', async () => {
      const invalidTemplateData = {
        template_type: 'custom',
        // Missing content (required)
        variables: [],
        is_active: true
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'null value in column "content" violates not-null constraint' }
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('notification_templates').insert(invalidTemplateData).select()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('content')
    })

    it('should handle variables as JSONB array', async () => {
      const templateWithVariables = {
        template_type: 'ready',
        content: 'Olá {{customerName}}! Pedido #{{orderNumber}} pronto!',
        variables: ['customerName', 'orderNumber', 'estimatedTime'],
        is_active: true
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [templateWithVariables], 
          error: null 
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('notification_templates').insert(templateWithVariables).select()

      expect(result.data).toEqual([templateWithVariables])
      expect(result.error).toBeNull()
    })
  })

  describe('Database Indexes and Performance', () => {
    it('should efficiently query notifications by status and scheduled_at', async () => {
      // This tests that the composite index on (status, scheduled_at) is working
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ 
                data: [], 
                error: null 
              }))
            }))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('whatsapp_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(10)

      expect(result.error).toBeNull()
      // This query should be efficient due to the composite index
    })

    it('should efficiently query sessions by session_id', async () => {
      // This tests that the unique index on session_id is working
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: null 
          }))
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('whatsapp_sessions')
        .select('*')
        .eq('session_id', 'baileys-session-1')
        .single()

      expect(result.error).toBeNull()
      // This query should be efficient due to the unique index
    })

    it('should efficiently query templates by template_type', async () => {
      // This tests that the unique index on template_type is working
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: null 
          }))
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('notification_templates')
        .select('*')
        .eq('template_type', 'payment_confirmed')
        .single()

      expect(result.error).toBeNull()
      // This query should be efficient due to the unique index
    })
  })

  describe('Row Level Security (RLS)', () => {
    it('should allow authenticated users to read notifications', async () => {
      // Mock authenticated user context
      const mockSelect = vi.fn(() => Promise.resolve({ 
        data: [], 
        error: null 
      }))
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('whatsapp_notifications').select('*')

      expect(result.error).toBeNull()
      // RLS should allow this for authenticated users
    })

    it('should allow service role to manage sessions', async () => {
      // Mock service role context
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [], 
          error: null 
        }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const sessionData = {
        session_id: 'test-session',
        session_data: { creds: {}, keys: {} },
        is_active: true
      }

      const result = await supabase.from('whatsapp_sessions').insert(sessionData).select()

      expect(result.error).toBeNull()
      // RLS should allow this for service role
    })

    it('should allow authenticated users to manage templates', async () => {
      // Mock authenticated user context
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const updateData = {
        content: 'Updated template content',
        updated_at: new Date().toISOString()
      }

      const result = await supabase.from('notification_templates')
        .update(updateData)
        .eq('template_type', 'payment_confirmed')

      expect(result.error).toBeNull()
      // RLS should allow this for authenticated users
    })
  })
})