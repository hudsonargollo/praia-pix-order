import { describe, it, expect } from 'vitest';
import { formatOrderNumber, canEditOrder } from '../orderUtils';

describe('orderUtils', () => {
  describe('formatOrderNumber', () => {
    describe('with order_number present', () => {
      it('should format order number with label by default', () => {
        const order = { order_number: 123, id: 'abc123def456' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #123');
      });

      it('should format order number without label when specified', () => {
        const order = { order_number: 123, id: 'abc123def456' };
        
        const result = formatOrderNumber(order, false);
        
        expect(result).toBe('#123');
      });

      it('should handle single digit order numbers', () => {
        const order = { order_number: 1, id: 'abc123def456' };
        
        expect(formatOrderNumber(order)).toBe('Pedido #1');
        expect(formatOrderNumber(order, false)).toBe('#1');
      });

      it('should handle large order numbers', () => {
        const order = { order_number: 99999, id: 'abc123def456' };
        
        expect(formatOrderNumber(order)).toBe('Pedido #99999');
        expect(formatOrderNumber(order, false)).toBe('#99999');
      });

      it('should handle zero as order number', () => {
        const order = { order_number: 0, id: 'abc123def456' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #abc123de'); // Falls back to UUID since 0 is falsy
      });
    });

    describe('without order_number (fallback to UUID)', () => {
      it('should use first 8 characters of UUID with label', () => {
        const order = { id: 'abc123def456ghi789' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #abc123de');
      });

      it('should use first 8 characters of UUID without label', () => {
        const order = { id: 'abc123def456ghi789' };
        
        const result = formatOrderNumber(order, false);
        
        expect(result).toBe('#abc123de');
      });

      it('should handle short UUID', () => {
        const order = { id: 'abc123' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #abc123');
      });

      it('should handle UUID with exactly 8 characters', () => {
        const order = { id: 'abcd1234' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #abcd1234');
      });

      it('should handle UUID with hyphens', () => {
        const order = { id: 'abc-123-def-456' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #abc-123-');
      });
    });

    describe('edge cases', () => {
      it('should handle undefined order_number', () => {
        const order = { order_number: undefined, id: 'abc123def456' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #abc123de');
      });

      it('should handle null order_number', () => {
        const order = { order_number: null as any, id: 'abc123def456' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #abc123de');
      });

      it('should handle empty string as id', () => {
        const order = { id: '' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #');
      });

      it('should handle very long UUID', () => {
        const order = { id: 'a'.repeat(100) };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #aaaaaaaa');
        expect(result.length).toBe(16); // "Pedido #" + 8 chars
      });

      it('should handle negative order number', () => {
        const order = { order_number: -5, id: 'abc123def456' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #-5');
      });

      it('should handle decimal order number', () => {
        const order = { order_number: 123.45, id: 'abc123def456' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #123.45');
      });

      it('should handle NaN as order number', () => {
        const order = { order_number: NaN, id: 'abc123def456' };
        
        const result = formatOrderNumber(order);
        
        expect(result).toBe('Pedido #abc123de'); // NaN is falsy
      });
    });

    describe('includeLabel parameter', () => {
      it('should respect includeLabel=true explicitly', () => {
        const order = { order_number: 42, id: 'abc123def456' };
        
        const result = formatOrderNumber(order, true);
        
        expect(result).toBe('Pedido #42');
      });

      it('should respect includeLabel=false', () => {
        const order = { order_number: 42, id: 'abc123def456' };
        
        const result = formatOrderNumber(order, false);
        
        expect(result).toBe('#42');
      });

      it('should work with UUID fallback and includeLabel=false', () => {
        const order = { id: 'xyz789abc123' };
        
        const result = formatOrderNumber(order, false);
        
        expect(result).toBe('#xyz789ab');
      });
    });
  });

  describe('canEditOrder', () => {
    it('should return true for pending orders', () => {
      const order = { status: 'pending' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(true);
    });

    it('should return true for in_preparation orders', () => {
      const order = { status: 'in_preparation' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(true);
    });

    it('should return false for pending_payment orders', () => {
      const order = { status: 'pending_payment' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(false);
    });

    it('should return false for paid orders', () => {
      const order = { status: 'paid' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(false);
    });

    it('should return false for ready orders', () => {
      const order = { status: 'ready' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(false);
    });

    it('should return false for completed orders', () => {
      const order = { status: 'completed' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(false);
    });

    it('should return false for cancelled orders', () => {
      const order = { status: 'cancelled' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(false);
    });

    it('should handle uppercase status values', () => {
      expect(canEditOrder({ status: 'PENDING' })).toBe(true);
      expect(canEditOrder({ status: 'IN_PREPARATION' })).toBe(true);
      expect(canEditOrder({ status: 'PAID' })).toBe(false);
    });

    it('should handle mixed case status values', () => {
      expect(canEditOrder({ status: 'Pending' })).toBe(true);
      expect(canEditOrder({ status: 'In_Preparation' })).toBe(true);
      expect(canEditOrder({ status: 'Paid' })).toBe(false);
    });

    it('should return false for unknown status values', () => {
      const order = { status: 'unknown_status' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(false);
    });

    it('should return false for empty status', () => {
      const order = { status: '' };
      
      const result = canEditOrder(order);
      
      expect(result).toBe(false);
    });
  });
});
