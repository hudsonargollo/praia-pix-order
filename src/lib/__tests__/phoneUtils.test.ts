import { describe, it, expect } from 'vitest';
import { formatPhoneNumber } from '../phoneUtils';

describe('phoneUtils', () => {
  describe('formatPhoneNumber', () => {
    describe('valid inputs', () => {
      it('should format 11-digit phone number correctly', () => {
        const result = formatPhoneNumber('11987654321');
        
        expect(result).toBe('(11) 98765-4321');
      });

      it('should format phone number with existing formatting', () => {
        const result = formatPhoneNumber('(11) 98765-4321');
        
        expect(result).toBe('(11) 98765-4321');
      });

      it('should format phone number with mixed formatting', () => {
        const result = formatPhoneNumber('11-98765-4321');
        
        expect(result).toBe('(11) 98765-4321');
      });

      it('should format phone number with spaces', () => {
        const result = formatPhoneNumber('11 98765 4321');
        
        expect(result).toBe('(11) 98765-4321');
      });

      it('should format phone number with parentheses only', () => {
        const result = formatPhoneNumber('(11)987654321');
        
        expect(result).toBe('(11) 98765-4321');
      });

      it('should handle different area codes', () => {
        expect(formatPhoneNumber('21987654321')).toBe('(21) 98765-4321');
        expect(formatPhoneNumber('85987654321')).toBe('(85) 98765-4321');
        expect(formatPhoneNumber('47987654321')).toBe('(47) 98765-4321');
      });
    });

    describe('invalid inputs', () => {
      it('should return N/A for null', () => {
        const result = formatPhoneNumber(null);
        
        expect(result).toBe('N/A');
      });

      it('should return N/A for undefined', () => {
        const result = formatPhoneNumber(undefined);
        
        expect(result).toBe('N/A');
      });

      it('should return original for empty string', () => {
        const result = formatPhoneNumber('');
        
        expect(result).toBe('N/A');
      });

      it('should return original for too short number', () => {
        const result = formatPhoneNumber('1198765432');
        
        expect(result).toBe('1198765432');
      });

      it('should return original for too long number', () => {
        const result = formatPhoneNumber('119876543210');
        
        expect(result).toBe('119876543210');
      });

      it('should return original for 10-digit number (old format)', () => {
        const result = formatPhoneNumber('1187654321');
        
        expect(result).toBe('1187654321');
      });

      it('should return original for non-numeric string', () => {
        const result = formatPhoneNumber('invalid-phone');
        
        expect(result).toBe('invalid-phone');
      });

      it('should return original for partially numeric string', () => {
        const result = formatPhoneNumber('11abc654321');
        
        expect(result).toBe('11abc654321');
      });
    });

    describe('edge cases', () => {
      it('should handle phone with plus sign prefix', () => {
        const result = formatPhoneNumber('+5511987654321');
        
        expect(result).toBe('+5511987654321'); // 13 digits, returns original
      });

      it('should handle phone with country code', () => {
        const result = formatPhoneNumber('5511987654321');
        
        expect(result).toBe('5511987654321'); // 13 digits, returns original
      });

      it('should handle phone with dots', () => {
        const result = formatPhoneNumber('11.98765.4321');
        
        expect(result).toBe('(11) 98765-4321');
      });

      it('should handle phone with multiple special characters', () => {
        const result = formatPhoneNumber('(11)-98765.4321');
        
        expect(result).toBe('(11) 98765-4321');
      });

      it('should handle whitespace-only string', () => {
        const result = formatPhoneNumber('   ');
        
        expect(result).toBe('   ');
      });

      it('should handle string with only special characters', () => {
        const result = formatPhoneNumber('()- ');
        
        expect(result).toBe('()- ');
      });
    });
  });
});
