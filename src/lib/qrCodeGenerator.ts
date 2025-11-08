/**
 * QR Code generation utilities for the restaurant
 * This file contains the URL that should be encoded in the QR codes
 */

/**
 * Gets the base URL for the application
 */
export const getBaseUrl = (): string => {
  // In production, this should be the actual domain
  // For development, use the current origin
  return window.location.origin;
};

/**
 * Gets the QR code URL that should be encoded in the QR codes
 * This is the URL that customers will be directed to when they scan any QR code
 */
export const getQRCodeUrl = (): string => {
  return `${getBaseUrl()}/qr`;
};

/**
 * Instructions for restaurant staff on how to generate QR codes
 */
export const QR_CODE_INSTRUCTIONS = {
  url: "/qr",
  fullUrl: "https://your-domain.com/qr", // Replace with actual domain
  instructions: [
    "1. Use any QR code generator (like qr-code-generator.com)",
    "2. Enter the URL: https://your-domain.com/qr",
    "3. Generate and download the QR code",
    "4. Print and place the same QR code on all tables",
    "5. Customers will scan the code and then select their table number"
  ],
  notes: [
    "• All tables use the same QR code",
    "• Customers will be prompted to enter their table number",
    "• No need for table-specific QR codes"
  ]
};