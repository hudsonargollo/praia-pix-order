import { describe, it, expect } from 'vitest';
import { 
  validatePhoneNumber, 
  formatPhoneForDisplay, 
  isBrazilianMobile, 
  extractAreaCode 
} from '../phone-validator';

describe('Phone Validator', () => {
  describe('validatePhoneNumber', () => {
    it('should validate Brazilian mobile number with country code', () => {
      const result = validatePhoneNumber('5511987654321');
      expect(result.isValid).toBe(true);
      expect(result.formattedNumber).toBe('5511987654321');
    });

    it('should validate Brazilian mobile number without country code', () => {
      const result = validatePhoneNumber('11987654321');
      expect(result.isValid).toBe(true);
      expect(result.formattedNumber).toBe('5511987654321');
    });

    it('should validate Brazilian mobile number with leading zero', () => {
      const result = validatePhoneNumber('011987654321');
      expect(result.isValid).toBe(true);
      expect(result.formattedNumber).toBe('5511987654321');
    });

    it('should validate number with formatting characters', () => {
      const result = validatePhoneNumber('+55 (11) 98765-4321');
      expect(result.isValid).toBe(true);
      expect(result.formattedNumber).toBe('5511987654321');
    });

    it('should reject landline numbers', () => {
      const result = validatePhoneNumber('1133334444');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('WhatsApp requires mobile numbers');
    });

    it('should reject numbers without 9th digit', () => {
      const result = validatePhoneNumber('11887654321');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must start with 9');
    });

    it('should reject invalid area codes', () => {
      const result = validatePhoneNumber('00987654321');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Brazilian area code');
    });

    it('should reject empty phone number', () => {
      const result = validatePhoneNumber('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject invalid length', () => {
      const result = validatePhoneNumber('119876543');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('length');
    });

    it('should validate different area codes', () => {
      const areaCodes = ['11', '21', '31', '41', '51', '61', '71', '81', '85'];
      
      areaCodes.forEach(areaCode => {
        const result = validatePhoneNumber(`${areaCode}987654321`);
        expect(result.isValid).toBe(true);
        expect(result.formattedNumber).toBe(`55${areaCode}987654321`);
      });
    });
  });

  describe('formatPhoneForDisplay', () => {
    it('should format phone number for display', () => {
      const formatted = formatPhoneForDisplay('5511987654321');
      expect(formatted).toBe('+55 (11) 98765-4321');
    });

    it('should return original if not Brazilian format', () => {
      const formatted = formatPhoneForDisplay('123456789');
      expect(formatted).toBe('123456789');
    });
  });

  describe('isBrazilianMobile', () => {
    it('should return true for valid Brazilian mobile', () => {
      expect(isBrazilianMobile('5511987654321')).toBe(true);
      expect(isBrazilianMobile('11987654321')).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(isBrazilianMobile('1133334444')).toBe(false);
      expect(isBrazilianMobile('invalid')).toBe(false);
    });
  });

  describe('extractAreaCode', () => {
    it('should extract area code from number with country code', () => {
      expect(extractAreaCode('5511987654321')).toBe('11');
    });

    it('should extract area code from local number', () => {
      expect(extractAreaCode('11987654321')).toBe('11');
    });

    it('should extract area code from number with leading zero', () => {
      expect(extractAreaCode('011987654321')).toBe('11');
    });

    it('should return null for invalid number', () => {
      expect(extractAreaCode('1')).toBe(null);
    });
  });
});
