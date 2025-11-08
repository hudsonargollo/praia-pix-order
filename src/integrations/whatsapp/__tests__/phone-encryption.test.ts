import { describe, it, expect, beforeAll } from 'vitest';
import {
  encryptPhoneNumber,
  decryptPhoneNumber,
  encryptPhoneNumberSafe,
  decryptPhoneNumberSafe,
  isEncryptionConfigured,
  generateEncryptionKey,
} from '../phone-encryption';

describe('Phone Number Encryption', () => {
  let testKey: string;

  beforeAll(async () => {
    // Generate a test encryption key
    testKey = await generateEncryptionKey();
    // Set it in the environment for testing
    import.meta.env.VITE_PHONE_ENCRYPTION_KEY = testKey;
  });

  describe('encryptPhoneNumber', () => {
    it('should encrypt a phone number', async () => {
      const phoneNumber = '+5511987654321';
      const encrypted = await encryptPhoneNumber(phoneNumber);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(phoneNumber);
      expect(encrypted.length).toBeGreaterThan(20);
    });

    it('should produce different encrypted values for same input', async () => {
      const phoneNumber = '+5511987654321';
      const encrypted1 = await encryptPhoneNumber(phoneNumber);
      const encrypted2 = await encryptPhoneNumber(phoneNumber);

      // Due to random IV, encrypted values should be different
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error for empty phone number', async () => {
      await expect(encryptPhoneNumber('')).rejects.toThrow();
    });
  });

  describe('decryptPhoneNumber', () => {
    it('should decrypt an encrypted phone number', async () => {
      const phoneNumber = '+5511987654321';
      const encrypted = await encryptPhoneNumber(phoneNumber);
      const decrypted = await decryptPhoneNumber(encrypted);

      expect(decrypted).toBe(phoneNumber);
    });

    it('should handle multiple encrypt/decrypt cycles', async () => {
      const phoneNumber = '+5511987654321';
      
      const encrypted1 = await encryptPhoneNumber(phoneNumber);
      const decrypted1 = await decryptPhoneNumber(encrypted1);
      
      const encrypted2 = await encryptPhoneNumber(decrypted1);
      const decrypted2 = await decryptPhoneNumber(encrypted2);

      expect(decrypted2).toBe(phoneNumber);
    });

    it('should throw error for invalid encrypted data', async () => {
      await expect(decryptPhoneNumber('invalid-data')).rejects.toThrow();
    });

    it('should throw error for empty encrypted data', async () => {
      await expect(decryptPhoneNumber('')).rejects.toThrow();
    });
  });

  describe('encryptPhoneNumberSafe', () => {
    it('should encrypt when encryption is configured', async () => {
      const phoneNumber = '+5511987654321';
      const encrypted = await encryptPhoneNumberSafe(phoneNumber);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(phoneNumber);
    });

    it('should return plain text when encryption is not configured', async () => {
      // Temporarily remove encryption key
      const originalKey = import.meta.env.VITE_PHONE_ENCRYPTION_KEY;
      delete import.meta.env.VITE_PHONE_ENCRYPTION_KEY;

      const phoneNumber = '+5511987654321';
      const result = await encryptPhoneNumberSafe(phoneNumber);

      expect(result).toBe(phoneNumber);

      // Restore key
      import.meta.env.VITE_PHONE_ENCRYPTION_KEY = originalKey;
    });
  });

  describe('decryptPhoneNumberSafe', () => {
    it('should decrypt encrypted phone numbers', async () => {
      const phoneNumber = '+5511987654321';
      const encrypted = await encryptPhoneNumber(phoneNumber);
      const decrypted = await decryptPhoneNumberSafe(encrypted);

      expect(decrypted).toBe(phoneNumber);
    });

    it('should return plain text phone numbers as-is', async () => {
      const phoneNumber = '+5511987654321';
      const result = await decryptPhoneNumberSafe(phoneNumber);

      expect(result).toBe(phoneNumber);
    });

    it('should handle non-base64 strings', async () => {
      const phoneNumber = '+55 (11) 98765-4321';
      const result = await decryptPhoneNumberSafe(phoneNumber);

      expect(result).toBe(phoneNumber);
    });
  });

  describe('isEncryptionConfigured', () => {
    it('should return true when encryption key is set', () => {
      expect(isEncryptionConfigured()).toBe(true);
    });

    it('should return false when encryption key is not set', () => {
      const originalKey = import.meta.env.VITE_PHONE_ENCRYPTION_KEY;
      delete import.meta.env.VITE_PHONE_ENCRYPTION_KEY;

      expect(isEncryptionConfigured()).toBe(false);

      import.meta.env.VITE_PHONE_ENCRYPTION_KEY = originalKey;
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a valid base64 key', async () => {
      const key = await generateEncryptionKey();

      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
      expect(/^[A-Za-z0-9+/]+=*$/.test(key)).toBe(true);
    });

    it('should generate different keys each time', async () => {
      const key1 = await generateEncryptionKey();
      const key2 = await generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle Brazilian phone numbers correctly', async () => {
      const testNumbers = [
        '+5511987654321',
        '+5521987654321',
        '+5585987654321',
      ];

      for (const number of testNumbers) {
        const encrypted = await encryptPhoneNumber(number);
        const decrypted = await decryptPhoneNumber(encrypted);
        expect(decrypted).toBe(number);
      }
    });

    it('should maintain data integrity across encryption/decryption', async () => {
      const phoneNumber = '+5511987654321';
      const iterations = 10;

      let current = phoneNumber;
      for (let i = 0; i < iterations; i++) {
        const encrypted = await encryptPhoneNumber(current);
        current = await decryptPhoneNumber(encrypted);
      }

      expect(current).toBe(phoneNumber);
    });
  });
});
