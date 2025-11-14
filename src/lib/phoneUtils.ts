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
