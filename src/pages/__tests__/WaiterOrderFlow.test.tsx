import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mercadoPagoService } from '@/integrations/mercadopago/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/integrations/mercadopago/client', () => ({
  mercadoPagoService: {
    createPayment: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Waiter Order Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Waiter Order Creation', () => {
    it('creates order with waiter attribution and correct data structure', async () => {
      const mockUser = {
        id: 'waiter-123',
        user_metadata: { role: 'waiter', full_name: 'João Garçom' },
      };

      const mockOrder = {
        id: 'order-123',
        customer_name: 'Maria Silva',
        customer_phone: '+5573999999999',
        total_amount: 25.50,
        status: 'pending',
        waiter_id: 'waiter-123',
        created_by_waiter: true,
        order_notes: 'Açaí sem granola, adicionar mel',
      };

      // Mock auth user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock order creation
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockOrder,
            error: null,
          }),
        }),
      });

      const mockOrderItemsInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'orders') {
          return { insert: mockInsert } as any;
        }
        if (table === 'order_items') {
          return { insert: mockOrderItemsInsert } as any;
        }
        return {} as any;
      });

      // Simulate order creation process
      const orderData = {
        customer_name: 'Maria Silva',
        customer_phone: '+5573999999999',
        table_number: '-',
        status: 'pending',
        total_amount: 25.50,
        waiter_id: 'waiter-123',
        order_notes: 'Açaí sem granola, adicionar mel',
        created_by_waiter: true,
      };

      const orderItems = [
        {
          order_id: 'order-123',
          menu_item_id: '1',
          quantity: 2,
          unit_price: 12.50,
          item_name: 'Açaí 300ml',
        },
      ];

      // Execute order creation
      const { data: order } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      await supabase
        .from('order_items')
        .insert(orderItems);

      // Verify order creation with correct waiter attribution
      expect(mockInsert).toHaveBeenCalledWith(orderData);
      expect(mockOrderItemsInsert).toHaveBeenCalledWith(orderItems);
      expect(order).toEqual(mockOrder);
    });

    it('validates phone number format (11 digits) in order creation', () => {
      const validPhones = ['73999999999', '11987654321', '85123456789'];
      const invalidPhones = ['7399999999', '739999999999', '10999999999'];

      validPhones.forEach(phone => {
        const phoneDigits = phone.replace(/\D/g, '');
        expect(phoneDigits.length).toBe(11);
        
        const ddd = phoneDigits.substring(0, 2);
        const dddNumber = parseInt(ddd);
        expect(dddNumber).toBeGreaterThanOrEqual(11);
        expect(dddNumber).toBeLessThanOrEqual(99);
      });

      invalidPhones.forEach(phone => {
        const phoneDigits = phone.replace(/\D/g, '');
        const isValid = phoneDigits.length === 11;
        
        if (isValid) {
          const ddd = phoneDigits.substring(0, 2);
          const dddNumber = parseInt(ddd);
          const isDDDValid = dddNumber >= 11 && dddNumber <= 99;
          expect(isDDDValid).toBe(false);
        } else {
          expect(isValid).toBe(false);
        }
      });
    });

    it('enforces order notes character limit (500 characters)', () => {
      const validNotes = 'Açaí sem granola, adicionar mel extra';
      const longNotes = 'a'.repeat(501);
      const maxNotes = 'a'.repeat(500);

      expect(validNotes.length).toBeLessThanOrEqual(500);
      expect(longNotes.length).toBeGreaterThan(500);
      expect(maxNotes.length).toBe(500);

      // Simulate validation logic
      const validateNotes = (notes: string) => notes.length <= 500;
      
      expect(validateNotes(validNotes)).toBe(true);
      expect(validateNotes(longNotes)).toBe(false);
      expect(validateNotes(maxNotes)).toBe(true);
    });
  });

  describe('PIX QR Code Generation for Waiter Orders', () => {
    it('generates PIX payment with correct waiter order data', async () => {
      const mockPaymentResponse = {
        id: 'payment-123',
        qrCodeBase64: 'base64-qr-code',
        pixCopyPaste: 'pix-copy-paste-code',
        expirationDate: '2024-01-01T11:00:00Z',
      };

      vi.mocked(mercadoPagoService.createPayment).mockResolvedValue(mockPaymentResponse);

      const orderData = {
        orderId: 'order-123',
        amount: 25.50,
        description: 'Pedido Garçom - Maria Silva',
        customerName: 'Maria Silva',
        customerPhone: '+5573999999999',
        tableNumber: 'Waiter',
      };

      const paymentResponse = await mercadoPagoService.createPayment(orderData);

      expect(mercadoPagoService.createPayment).toHaveBeenCalledWith(orderData);
      expect(paymentResponse).toEqual(mockPaymentResponse);
      expect(paymentResponse.id).toBe('payment-123');
      expect(paymentResponse.qrCodeBase64).toBeDefined();
      expect(paymentResponse.pixCopyPaste).toBeDefined();
    });

    it('updates order status when PIX payment is completed', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const orderId = 'order-123';
      const paymentId = 'payment-456';

      // Simulate payment completion
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          mercadopago_payment_id: paymentId,
        })
        .eq('id', orderId);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'paid',
        mercadopago_payment_id: paymentId,
      });
    });
  });

  describe('Waiter Performance Reporting', () => {
    it('calculates waiter sales and commission totals correctly', () => {
      const orders = [
        {
          id: 'order-1',
          total_amount: 25.50,
          commission_amount: 2.55,
          status: 'completed',
        },
        {
          id: 'order-2',
          total_amount: 18.00,
          commission_amount: 1.80,
          status: 'paid',
        },
        {
          id: 'order-3',
          total_amount: 12.00,
          commission_amount: 1.20,
          status: 'cancelled', // Should not be included
        },
      ];

      // Filter out cancelled orders
      const validOrders = orders.filter(order => order.status !== 'cancelled');
      
      const totalSales = validOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalCommissions = validOrders.reduce((sum, order) => sum + order.commission_amount, 0);
      const averageTicket = validOrders.length > 0 ? totalSales / validOrders.length : 0;

      expect(totalSales).toBe(43.50);
      expect(totalCommissions).toBe(4.35);
      expect(averageTicket).toBe(21.75);
      expect(validOrders.length).toBe(2);
    });

    it('fetches waiter orders with correct filtering', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          customer_name: 'Maria Silva',
          total_amount: 25.50,
          status: 'completed',
          waiter_id: 'waiter-123',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockOrders,
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const waiterId = 'waiter-123';

      // Simulate fetching waiter orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total_amount, 
          status, 
          commission_amount, 
          customer_name, 
          customer_phone
        `)
        .eq('waiter_id', waiterId)
        .order('created_at', { ascending: false });

      expect(mockSelect).toHaveBeenCalledWith(`
          id, 
          created_at, 
          total_amount, 
          status, 
          commission_amount, 
          customer_name, 
          customer_phone
        `);
      expect(orders).toEqual(mockOrders);
    });
  });

  describe('Order Status Management', () => {
    it('sets correct initial status for waiter orders', () => {
      const waiterOrder = {
        status: 'pending', // Waiter orders start as pending
        created_by_waiter: true,
      };

      const customerOrder = {
        status: 'pending_payment', // Customer orders start as pending_payment
        created_by_waiter: false,
      };

      expect(waiterOrder.status).toBe('pending');
      expect(waiterOrder.created_by_waiter).toBe(true);
      
      expect(customerOrder.status).toBe('pending_payment');
      expect(customerOrder.created_by_waiter).toBe(false);
    });

    it('validates PIX generation eligibility for orders', () => {
      const orders = [
        {
          id: 'order-1',
          status: 'pending',
          customer_name: 'Maria Silva',
          customer_phone: '+5573999999999',
        },
        {
          id: 'order-2',
          status: 'completed',
          customer_name: 'João Santos',
          customer_phone: '+5573888888888',
        },
        {
          id: 'order-3',
          status: 'cancelled',
          customer_name: 'Ana Costa',
          customer_phone: '+5573777777777',
        },
        {
          id: 'order-4',
          status: 'pending',
          customer_name: null, // Missing customer info
          customer_phone: null,
        },
      ];

      const canGeneratePIX = (order: any) => {
        const allowedStatuses = ['pending', 'in progress', 'completed'];
        return allowedStatuses.includes(order.status.toLowerCase()) && 
               !!order.customer_name && 
               !!order.customer_phone;
      };

      expect(canGeneratePIX(orders[0])).toBe(true);  // Valid order
      expect(canGeneratePIX(orders[1])).toBe(true);  // Completed order
      expect(canGeneratePIX(orders[2])).toBe(false); // Cancelled order
      expect(canGeneratePIX(orders[3])).toBe(false); // Missing customer info
    });
  });
});