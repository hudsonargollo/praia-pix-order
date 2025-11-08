/**
 * Phone Number Encryption Utility
 * Provides encryption/decryption for phone numbers stored in database
 * Uses Web Crypto API for secure encryption
 */

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // 128 bits authentication tag

/**
 * Get or generate encryption key from environment
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = import.meta.env.VITE_PHONE_ENCRYPTION_KEY;
  
  if (!keyString) {
    console.warn('VITE_PHONE_ENCRYPTION_KEY not set. Phone numbers will not be encrypted.');
    throw new Error('Encryption key not configured');
  }

  // Convert base64 key string to ArrayBuffer
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  
  // Import key for AES-GCM
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a phone number
 * Returns base64-encoded encrypted data with IV prepended
 */
export async function encryptPhoneNumber(phoneNumber: string): Promise<string> {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required for encryption');
    }

    // Get encryption key
    const key = await getEncryptionKey();

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Convert phone number to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(phoneNumber);

    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Failed to encrypt phone number:', error);
    throw new Error('Phone number encryption failed');
  }
}

/**
 * Decrypt a phone number
 * Expects base64-encoded encrypted data with IV prepended
 */
export async function decryptPhoneNumber(encryptedPhone: string): Promise<string> {
  try {
    if (!encryptedPhone) {
      throw new Error('Encrypted phone number is required for decryption');
    }

    // Get encryption key
    const key = await getEncryptionKey();

    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedPhone), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      encryptedData
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Failed to decrypt phone number:', error);
    throw new Error('Phone number decryption failed');
  }
}

/**
 * Check if encryption is configured
 */
export function isEncryptionConfigured(): boolean {
  return !!import.meta.env.VITE_PHONE_ENCRYPTION_KEY;
}

/**
 * Generate a new encryption key (for setup/testing)
 * Returns base64-encoded key
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  const keyArray = new Uint8Array(exported);
  return btoa(String.fromCharCode(...keyArray));
}

/**
 * Encrypt phone number if encryption is configured, otherwise return as-is
 * This allows graceful degradation when encryption is not set up
 */
export async function encryptPhoneNumberSafe(phoneNumber: string): Promise<string> {
  if (!isEncryptionConfigured()) {
    console.warn('Phone encryption not configured, storing phone number in plain text');
    return phoneNumber;
  }
  
  return await encryptPhoneNumber(phoneNumber);
}

/**
 * Decrypt phone number if it appears to be encrypted, otherwise return as-is
 * This allows backward compatibility with existing plain text phone numbers
 */
export async function decryptPhoneNumberSafe(phoneNumber: string): Promise<string> {
  if (!phoneNumber) {
    return phoneNumber;
  }

  // Check if it looks like encrypted data (base64)
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (!base64Regex.test(phoneNumber) || phoneNumber.length < 20) {
    // Doesn't look encrypted, return as-is
    return phoneNumber;
  }

  if (!isEncryptionConfigured()) {
    console.warn('Phone encryption not configured, cannot decrypt');
    return phoneNumber;
  }

  try {
    return await decryptPhoneNumber(phoneNumber);
  } catch (error) {
    // If decryption fails, it might be plain text that looks like base64
    console.warn('Failed to decrypt phone number, returning as-is');
    return phoneNumber;
  }
}
