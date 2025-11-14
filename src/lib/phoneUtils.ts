/**
 * Formats a Brazilian phone number to (XX) 00000-0000 format
 * @param phone - Raw phone number (digits only or with formatting)
 * @returns Formatted phone string or original if invalid
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Must be 11 digits (DDD + 9 + 8 digits)
  if (digits.length !== 11) return phone;
  
  // Format as (XX) 00000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
