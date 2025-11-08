import { validatePhoneNumber } from './phone-validator';

/**
 * WhatsApp account existence checker
 * Validates if a phone number has an active WhatsApp account
 */

interface AccountCheckResult {
  exists: boolean;
  phone: string;
  error?: string;
}

/**
 * Check if a phone number has an active WhatsApp account
 * Note: This requires Baileys API connection to be active
 * @param phone - Phone number to check
 * @returns Promise with account existence result
 */
export async function checkWhatsAppExists(phone: string): Promise<AccountCheckResult> {
  // First validate the phone number format
  const validation = validatePhoneNumber(phone);
  
  if (!validation.isValid) {
    return {
      exists: false,
      phone,
      error: validation.error,
    };
  }

  const formattedPhone = validation.formattedNumber!;

  try {
    // Check if we have a Baileys connection available
    // This would be implemented through the Cloudflare Function
    const response = await fetch('/api/whatsapp/check-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: formattedPhone }),
    });

    if (!response.ok) {
      // If the API is not available, assume the number exists
      // This is a graceful degradation - we'll try to send anyway
      console.warn('WhatsApp account check API unavailable, assuming number exists');
      return {
        exists: true,
        phone: formattedPhone,
      };
    }

    const result = await response.json();
    
    return {
      exists: result.exists || false,
      phone: formattedPhone,
    };
  } catch (error) {
    // If there's an error checking, assume the number exists
    // Better to attempt sending than to block valid numbers
    console.warn('Error checking WhatsApp account existence:', error);
    return {
      exists: true,
      phone: formattedPhone,
      error: 'Unable to verify account, will attempt to send',
    };
  }
}

/**
 * Batch check multiple phone numbers for WhatsApp accounts
 * @param phones - Array of phone numbers
 * @returns Promise with array of check results
 */
export async function checkWhatsAppExistsBatch(phones: string[]): Promise<AccountCheckResult[]> {
  // Process in parallel with a reasonable limit
  const BATCH_SIZE = 10;
  const results: AccountCheckResult[] = [];

  for (let i = 0; i < phones.length; i += BATCH_SIZE) {
    const batch = phones.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(phone => checkWhatsAppExists(phone))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Mock implementation for development/testing
 * Simulates WhatsApp account existence check
 */
export function mockCheckWhatsAppExists(phone: string): AccountCheckResult {
  const validation = validatePhoneNumber(phone);
  
  if (!validation.isValid) {
    return {
      exists: false,
      phone,
      error: validation.error,
    };
  }

  // In mock mode, assume all valid numbers have WhatsApp
  return {
    exists: true,
    phone: validation.formattedNumber!,
  };
}
