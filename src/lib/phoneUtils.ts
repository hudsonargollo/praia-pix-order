/**
 * Formats a Brazilian phone number to (XX) 00000-0000 format
 * @param phone - Raw phone number (digits only or with formatting)
 * @returns Formatted phone string or original if invalid
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Remove country code if present (55)
  if (digits.length === 13 && digits.startsWith('55')) {
    digits = digits.slice(2);
  } else if (digits.length === 12 && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  
  // Handle 11 digits (DDD + 9 + 8 digits) - mobile with 9
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  
  // Handle 10 digits (DDD + 8 digits) - landline
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  
  // Return original if format is not recognized
  return phone;
}

/**
 * Normalizes a Brazilian phone number to E.164 format (+55XXXXXXXXXXX)
 * @param rawPhone - Raw phone number (digits only or with formatting)
 * @returns Normalized phone string in E.164 format or null if invalid
 * @example
 * normalizePhone("71987654321") // returns "+5571987654321"
 * normalizePhone("(71) 98765-4321") // returns "+5571987654321"
 * normalizePhone("123") // returns null (invalid)
 */
export function normalizePhone(rawPhone: string): string | null {
  if (!rawPhone) return null;
  
  // Remove all non-digit characters
  const digits = rawPhone.replace(/\D/g, '');
  
  // Validate exactly 11 digits
  if (digits.length !== 11) return null;
  
  // Extract and validate DDD (area code)
  const ddd = parseInt(digits.substring(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  
  // Return E.164 format with +55 country code
  return `+55${digits}`;
}
