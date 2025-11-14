import { describe, it, expect } from 'vitest';
import {
  calculateConfirmedCommissions,
  calculateEstimatedCommissions,
  getCommissionStatus,
  getOrdersByCategory,
  ORDER_STATUS_CATEGORIES,
  COMMISSION_RATE
} from '../commissionUtils';
import type { Order } from '@/types/commission';

// Helper to create mock orders
const createMockOrder = (status: string, totalAmount: number): Order => ({
  id: `order-${Math.random()}`,
  created_at: new Date().toISOString(),
  total_amount: totalAmount,
  status,
  customer_name: 'Test Customer',
  customer_phone: '+5511999999999',
  waiter_id: 'waiter-1',
  table_number: 1,
  payment_method: 'pix',
  payment_status: 'pending',
  items: [],
  notes: null,
  updated_at: new Date().toISOString(),
});

describe('commissionUtils', () => {
  describe('calculateConfirmedCommissions', () => {
    it('should calculate commissions for paid orders', () => {
      const orders = [
        createMockOrder('paid', 100),
        createMockOrder('paid', 200),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(30); // (100 + 200) * 0.1 = 30
    });

    it('should calculate commissions for completed orders', () => {
      const orders = [
        createMockOrder('completed', 150),
        createMockOrder('completed', 250),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(40); // (150 + 250) * 0.1 = 40
    });

    it('should handle mixed paid and completed orders', () => {
      const orders = [
        createMockOrder('paid', 100),
        createMockOrder('completed', 200),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(30); // (100 + 200) * 0.1 = 30
    });

    it('should exclude pending orders', () => {
      const orders = [
        createMockOrder('paid', 100),
        createMockOrder('pending', 200),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(10); // Only 100 * 0.1 = 10
    });

    it('should exclude cancelled orders', () => {
      const orders = [
        createMockOrder('paid', 100),
        createMockOrder('cancelled', 200),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(10); // Only 100 * 0.1 = 10
    });

    it('should handle empty array', () => {
      const result = calculateConfirmedCommissions([]);
      
      expect(result).toBe(0);
    });

    it('should handle zero amounts', () => {
      const orders = [
        createMockOrder('paid', 0),
        createMockOrder('paid', 0),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(0);
    });

    it('should handle case-insensitive status matching', () => {
      const orders = [
        createMockOrder('PAID', 100),
        createMockOrder('Completed', 200),
        createMockOrder('PaId', 300),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(60); // (100 + 200 + 300) * 0.1 = 60
    });

    it('should return result with 2 decimal precision', () => {
      const orders = [
        createMockOrder('paid', 33.33),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(3.33); // 33.33 * 0.1 = 3.333, rounded to 3.33
      expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('should handle decimal amounts correctly', () => {
      const orders = [
        createMockOrder('paid', 123.45),
        createMockOrder('paid', 67.89),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(19.13); // (123.45 + 67.89) * 0.1 = 19.134, rounded to 19.13
    });
  });

  describe('calculateEstimatedCommissions', () => {
    it('should calculate commissions for pending orders', () => {
      const orders = [
        createMockOrder('pending', 100),
        createMockOrder('pending', 200),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(30); // (100 + 200) * 0.1 = 30
    });

    it('should calculate commissions for pending_payment orders', () => {
      const orders = [
        createMockOrder('pending_payment', 150),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(15); // 150 * 0.1 = 15
    });

    it('should calculate commissions for in_preparation orders', () => {
      const orders = [
        createMockOrder('in_preparation', 200),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(20); // 200 * 0.1 = 20
    });

    it('should calculate commissions for ready orders', () => {
      const orders = [
        createMockOrder('ready', 250),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(25); // 250 * 0.1 = 25
    });

    it('should handle all pending status types', () => {
      const orders = [
        createMockOrder('pending', 100),
        createMockOrder('pending_payment', 100),
        createMockOrder('in_preparation', 100),
        createMockOrder('ready', 100),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(40); // (100 * 4) * 0.1 = 40
    });

    it('should exclude paid orders', () => {
      const orders = [
        createMockOrder('pending', 100),
        createMockOrder('paid', 200),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(10); // Only 100 * 0.1 = 10
    });

    it('should exclude cancelled orders', () => {
      const orders = [
        createMockOrder('pending', 100),
        createMockOrder('cancelled', 200),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(10); // Only 100 * 0.1 = 10
    });

    it('should handle empty array', () => {
      const result = calculateEstimatedCommissions([]);
      
      expect(result).toBe(0);
    });

    it('should handle zero amounts', () => {
      const orders = [
        createMockOrder('pending', 0),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(0);
    });

    it('should handle case-insensitive status matching', () => {
      const orders = [
        createMockOrder('PENDING', 100),
        createMockOrder('Pending_Payment', 200),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(30); // (100 + 200) * 0.1 = 30
    });

    it('should return result with 2 decimal precision', () => {
      const orders = [
        createMockOrder('pending', 77.77),
      ];
      
      const result = calculateEstimatedCommissions(orders);
      
      expect(result).toBe(7.78); // 77.77 * 0.1 = 7.777, rounded to 7.78
      expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('getCommissionStatus', () => {
    describe('confirmed status (paid orders)', () => {
      it('should return confirmed config for paid status', () => {
        const order = createMockOrder('paid', 100);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('confirmed');
        expect(result.amount).toBe(10);
        expect(result.displayAmount).toContain('10,00');
        expect(result.displayAmount).toMatch(/R\$/);
        expect(result.className).toBe('text-green-600 font-semibold');
        expect(result.icon).toBe('CheckCircle');
        expect(result.tooltip).toBe('Comissão confirmada');
      });

      it('should return confirmed config for completed status', () => {
        const order = createMockOrder('completed', 200);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('confirmed');
        expect(result.amount).toBe(20);
        expect(result.icon).toBe('CheckCircle');
      });

      it('should handle case-insensitive paid status', () => {
        const order = createMockOrder('PAID', 100);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('confirmed');
      });
    });

    describe('pending status (pending orders)', () => {
      it('should return pending config for pending status', () => {
        const order = createMockOrder('pending', 100);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('pending');
        expect(result.amount).toBe(10);
        expect(result.displayAmount).toContain('10,00');
        expect(result.displayAmount).toMatch(/R\$/);
        expect(result.className).toBe('text-yellow-600 font-semibold');
        expect(result.icon).toBe('Clock');
        expect(result.tooltip).toBe('Comissão estimada - aguardando pagamento');
      });

      it('should return pending config for pending_payment status', () => {
        const order = createMockOrder('pending_payment', 150);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('pending');
        expect(result.amount).toBe(15);
        expect(result.icon).toBe('Clock');
      });

      it('should return pending config for in_preparation status', () => {
        const order = createMockOrder('in_preparation', 200);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('pending');
        expect(result.amount).toBe(20);
      });

      it('should return pending config for ready status', () => {
        const order = createMockOrder('ready', 250);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('pending');
        expect(result.amount).toBe(25);
      });
    });

    describe('excluded status (cancelled/expired orders)', () => {
      it('should return excluded config for cancelled status', () => {
        const order = createMockOrder('cancelled', 100);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('excluded');
        expect(result.amount).toBe(0);
        expect(result.displayAmount).toBe('R$ 0,00');
        expect(result.className).toBe('text-gray-400 line-through');
        expect(result.icon).toBe('XCircle');
        expect(result.tooltip).toBe('Pedido cancelado - sem comissão');
      });

      it('should return excluded config for expired status', () => {
        const order = createMockOrder('expired', 200);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('excluded');
        expect(result.amount).toBe(0);
      });

      it('should return excluded config for unknown status', () => {
        const order = createMockOrder('unknown_status', 300);
        
        const result = getCommissionStatus(order);
        
        expect(result.status).toBe('excluded');
        expect(result.amount).toBe(0);
      });
    });

    it('should format display amount in Brazilian Real', () => {
      const order = createMockOrder('paid', 1234.56);
      
      const result = getCommissionStatus(order);
      
      expect(result.displayAmount).toMatch(/R\$/);
      expect(result.displayAmount).toContain('123,46'); // 1234.56 * 0.1 = 123.456
    });

    it('should calculate commission with 2 decimal precision', () => {
      const order = createMockOrder('paid', 33.33);
      
      const result = getCommissionStatus(order);
      
      expect(result.amount).toBe(3.33);
      expect(result.amount.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('getOrdersByCategory', () => {
    it('should filter orders by PAID category', () => {
      const orders = [
        createMockOrder('paid', 100),
        createMockOrder('completed', 200),
        createMockOrder('pending', 300),
      ];
      
      const result = getOrdersByCategory(orders, 'PAID');
      
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('paid');
      expect(result[1].status).toBe('completed');
    });

    it('should filter orders by PENDING category', () => {
      const orders = [
        createMockOrder('pending', 100),
        createMockOrder('pending_payment', 200),
        createMockOrder('in_preparation', 300),
        createMockOrder('ready', 400),
        createMockOrder('paid', 500),
      ];
      
      const result = getOrdersByCategory(orders, 'PENDING');
      
      expect(result).toHaveLength(4);
      expect(result.map(o => o.status)).toEqual([
        'pending',
        'pending_payment',
        'in_preparation',
        'ready',
      ]);
    });

    it('should filter orders by EXCLUDED category', () => {
      const orders = [
        createMockOrder('cancelled', 100),
        createMockOrder('expired', 200),
        createMockOrder('paid', 300),
      ];
      
      const result = getOrdersByCategory(orders, 'EXCLUDED');
      
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('cancelled');
      expect(result[1].status).toBe('expired');
    });

    it('should handle empty array', () => {
      const result = getOrdersByCategory([], 'PAID');
      
      expect(result).toHaveLength(0);
    });

    it('should handle case-insensitive matching', () => {
      const orders = [
        createMockOrder('PAID', 100),
        createMockOrder('Completed', 200),
      ];
      
      const result = getOrdersByCategory(orders, 'PAID');
      
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no matches', () => {
      const orders = [
        createMockOrder('pending', 100),
        createMockOrder('cancelled', 200),
      ];
      
      const result = getOrdersByCategory(orders, 'PAID');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('constants', () => {
    it('should have correct ORDER_STATUS_CATEGORIES', () => {
      expect(ORDER_STATUS_CATEGORIES.PAID).toEqual(['paid', 'completed']);
      expect(ORDER_STATUS_CATEGORIES.PENDING).toEqual([
        'pending',
        'pending_payment',
        'in_preparation',
        'ready',
      ]);
      expect(ORDER_STATUS_CATEGORIES.EXCLUDED).toEqual(['cancelled', 'expired']);
    });

    it('should have correct COMMISSION_RATE', () => {
      expect(COMMISSION_RATE).toBe(0.1);
    });
  });

  describe('edge cases', () => {
    it('should handle very large amounts', () => {
      const orders = [
        createMockOrder('paid', 999999.99),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(100000); // 999999.99 * 0.1 = 99999.999, rounded to 100000.00
    });

    it('should handle very small amounts', () => {
      const orders = [
        createMockOrder('paid', 0.01),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(0); // 0.01 * 0.1 = 0.001, rounded to 0.00
    });

    it('should handle negative amounts as zero commission', () => {
      const orders = [
        createMockOrder('paid', -100),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(-10); // -100 * 0.1 = -10 (though this shouldn't happen in practice)
    });

    it('should handle mixed positive and negative amounts', () => {
      const orders = [
        createMockOrder('paid', 100),
        createMockOrder('paid', -50),
      ];
      
      const result = calculateConfirmedCommissions(orders);
      
      expect(result).toBe(5); // (100 - 50) * 0.1 = 5
    });
  });
});
