import { ValidationResult } from './types';

/**
 * Brazilian phone number validation and formatting utilities
 * Handles +55 country code format and validates WhatsApp-compatible numbers
 */

// Brazilian phone number patterns
const BRAZIL_COUNTRY_CODE = '55';
const MOBILE_AREA_CODES = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
  '21', '22', '24', // Rio de Janeiro
  '27', '28', // Espírito Santo
  '31', '32', '33', '34', '35', '37', '38', // Minas Gerais
  '41', '42', '43', '44', '45', '46', // Paraná
  '47', '48', '49', // Santa Catarina
  '51', '53', '54', '55', // Rio Grande do Sul
  '61', // Distrito Federal
  '62', '64', // Goiás
  '63', // Tocantins
  '65', '66', // Mato Grosso
  '67', // Mato Grosso do Sul
  '68', // Acre
  '69', // Rondônia
  '71', '73', '74', '75', '77', // Bahia
  '79', // Sergipe
  '81', '87', // Pernambuco
  '82', // Alagoas
  '83', // Paraíba
  '84', // Rio Grande do Norte
  '85', '88', // Ceará
  '86', '89', // Piauí
  '91', '93', '94', // Pará
  '92', '97', // Amazonas
  '95', // Roraima
  '96', // Amapá
  '98', '99', // Maranhão
];

/**
 * Validates and formats a Brazilian phone number for WhatsApp
 * @param phone - Phone number in various formats
 * @returns ValidationResult with formatted number or error
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) {
    return {
      isValid: false,
      error: 'Phone number cannot be empty',
    };
  }

  // Try to parse and validate the number
  let formattedNumber: string;
  let areaCode: string;
  let localNumber: string;

  try {
    // Case 1: Number already has country code (55XXXXXXXXXXX)
    if (cleaned.startsWith(BRAZIL_COUNTRY_CODE)) {
      const withoutCountryCode = cleaned.substring(2);
      
      // Brazilian mobile: 55 + 2-digit area code + 9 + 8 digits = 13 digits total
      // Brazilian landline: 55 + 2-digit area code + 8 digits = 12 digits total
      if (withoutCountryCode.length === 11) {
        // Mobile number with 9th digit
        areaCode = withoutCountryCode.substring(0, 2);
        localNumber = withoutCountryCode.substring(2);
        
        if (!MOBILE_AREA_CODES.includes(areaCode)) {
          return {
            isValid: false,
            error: `Invalid Brazilian area code: ${areaCode}`,
          };
        }

        // Mobile numbers should start with 9
        if (!localNumber.startsWith('9')) {
          return {
            isValid: false,
            error: 'Brazilian mobile numbers must start with 9',
          };
        }

        formattedNumber = cleaned;
      } else if (withoutCountryCode.length === 10) {
        // Landline or old mobile format
        areaCode = withoutCountryCode.substring(0, 2);
        localNumber = withoutCountryCode.substring(2);
        
        if (!MOBILE_AREA_CODES.includes(areaCode)) {
          return {
            isValid: false,
            error: `Invalid Brazilian area code: ${areaCode}`,
          };
        }

        // WhatsApp only works with mobile numbers
        return {
          isValid: false,
          error: 'WhatsApp requires mobile numbers (11 digits with area code)',
        };
      } else {
        return {
          isValid: false,
          error: `Invalid Brazilian phone number length: ${cleaned.length} digits`,
        };
      }
    }
    // Case 2: Number starts with 0 (local format with leading zero)
    else if (cleaned.startsWith('0')) {
      const withoutZero = cleaned.substring(1);
      
      if (withoutZero.length === 11) {
        // Mobile: 0 + area code + 9 + 8 digits
        areaCode = withoutZero.substring(0, 2);
        localNumber = withoutZero.substring(2);
        
        if (!MOBILE_AREA_CODES.includes(areaCode)) {
          return {
            isValid: false,
            error: `Invalid Brazilian area code: ${areaCode}`,
          };
        }

        if (!localNumber.startsWith('9')) {
          return {
            isValid: false,
            error: 'Brazilian mobile numbers must start with 9',
          };
        }

        formattedNumber = BRAZIL_COUNTRY_CODE + withoutZero;
      } else if (withoutZero.length === 10) {
        // Landline or old format
        return {
          isValid: false,
          error: 'WhatsApp requires mobile numbers (11 digits with area code)',
        };
      } else {
        return {
          isValid: false,
          error: `Invalid phone number length: ${cleaned.length} digits`,
        };
      }
    }
    // Case 3: Local number without country code or leading zero
    else if (cleaned.length === 11) {
      // Mobile: area code + 9 + 8 digits
      areaCode = cleaned.substring(0, 2);
      localNumber = cleaned.substring(2);
      
      if (!MOBILE_AREA_CODES.includes(areaCode)) {
        return {
          isValid: false,
          error: `Invalid Brazilian area code: ${areaCode}`,
        };
      }

      if (!localNumber.startsWith('9')) {
        return {
          isValid: false,
          error: 'Brazilian mobile numbers must start with 9',
        };
      }

      formattedNumber = BRAZIL_COUNTRY_CODE + cleaned;
    } else if (cleaned.length === 10) {
      // Landline or old mobile format
      return {
        isValid: false,
        error: 'WhatsApp requires mobile numbers (11 digits with area code)',
      };
    } else {
      return {
        isValid: false,
        error: `Invalid phone number length: ${cleaned.length} digits. Expected 11 digits for Brazilian mobile.`,
      };
    }

    // Final validation
    if (formattedNumber.length !== 13) {
      return {
        isValid: false,
        error: `Invalid formatted number length: ${formattedNumber.length}. Expected 13 digits (55 + 11 digits).`,
      };
    }

    return {
      isValid: true,
      formattedNumber,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Error validating phone number: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Format a phone number for display (with formatting)
 * @param phone - Phone number in international format
 * @returns Formatted string like +55 (11) 99999-9999
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith(BRAZIL_COUNTRY_CODE) && cleaned.length === 13) {
    const areaCode = cleaned.substring(2, 4);
    const firstPart = cleaned.substring(4, 9);
    const secondPart = cleaned.substring(9, 13);
    return `+${BRAZIL_COUNTRY_CODE} (${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  return phone;
}

/**
 * Check if a phone number is a valid Brazilian mobile number
 * @param phone - Phone number to check
 * @returns true if valid Brazilian mobile number
 */
export function isBrazilianMobile(phone: string): boolean {
  const result = validatePhoneNumber(phone);
  return result.isValid;
}

/**
 * Extract area code from a Brazilian phone number
 * @param phone - Phone number
 * @returns Area code or null if invalid
 */
export function extractAreaCode(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith(BRAZIL_COUNTRY_CODE) && cleaned.length >= 4) {
    return cleaned.substring(2, 4);
  }
  
  if (cleaned.startsWith('0') && cleaned.length >= 3) {
    return cleaned.substring(1, 3);
  }
  
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2);
  }
  
  return null;
}

/**
 * Batch validate multiple phone numbers
 * @param phones - Array of phone numbers
 * @returns Array of validation results
 */
export function validatePhoneNumbers(phones: string[]): ValidationResult[] {
  return phones.map(phone => validatePhoneNumber(phone));
}
