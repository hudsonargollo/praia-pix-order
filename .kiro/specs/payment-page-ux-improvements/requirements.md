# Requirements Document

## Introduction

This feature improves the payment page user experience by optimizing the header layout to save vertical space and adding a prominent "Copy PIX Code" button for easier access without requiring scrolling. The goal is to streamline the payment flow for customers on mobile devices where screen real estate is limited.

## Glossary

- **Payment Page**: The page displayed to customers after checkout where they can complete payment via PIX QR code or copy-paste code
- **Header Section**: The top portion of the payment page containing the title, order number, and customer phone
- **PIX Code**: The alphanumeric string that customers can copy and paste into their banking app to complete payment
- **Copy Button**: An interactive button that copies the PIX code to the device clipboard
- **Viewport**: The visible area of the screen without scrolling

## Requirements

### Requirement 1

**User Story:** As a customer completing payment, I want a compact header that displays essential information without taking excessive vertical space, so that I can see more payment options without scrolling

#### Acceptance Criteria

1. WHEN the Payment Page loads, THE Payment Page SHALL display the header with a height no greater than 120 pixels on mobile devices
2. THE Payment Page SHALL display the order number and customer phone number in a single line or compact layout within the header
3. THE Payment Page SHALL maintain the back button functionality in the optimized header
4. THE Payment Page SHALL preserve the gradient background styling in the compact header
5. WHEN viewed on mobile devices with viewport height less than 700 pixels, THE Payment Page SHALL ensure the QR code and primary action button are visible without scrolling

### Requirement 2

**User Story:** As a customer who prefers to use PIX copy-paste instead of QR code scanning, I want a prominent "Copy PIX Code" button visible without scrolling, so that I can quickly complete my payment

#### Acceptance Criteria

1. THE Payment Page SHALL display a "Copy PIX Code" button within the initial viewport on mobile devices
2. WHEN the customer clicks the "Copy PIX Code" button, THE Payment Page SHALL copy the PIX code string to the device clipboard
3. WHEN the PIX code is successfully copied, THE Payment Page SHALL display a confirmation toast notification with the message "Código Pix copiado!"
4. THE Payment Page SHALL position the "Copy PIX Code" button below the QR code and above the full PIX code display section
5. THE Payment Page SHALL style the "Copy PIX Code" button with high visual prominence using primary color scheme
6. WHEN the payment status is not pending, THE Payment Page SHALL hide or disable the "Copy PIX Code" button

### Requirement 3

**User Story:** As a customer on a small mobile device, I want the payment page to minimize scrolling requirements, so that I can complete my payment quickly without navigation friction

#### Acceptance Criteria

1. WHEN the Payment Page loads on devices with viewport height between 600-700 pixels, THE Payment Page SHALL display the header, status badge, QR code, and copy button within the initial viewport
2. THE Payment Page SHALL reduce padding and margins in the header section to maximize content visibility
3. THE Payment Page SHALL maintain touch target sizes of at least 44x44 pixels for all interactive elements
4. WHEN the customer scrolls, THE Payment Page SHALL maintain smooth scrolling behavior without layout shifts
5. THE Payment Page SHALL ensure text remains readable with font sizes no smaller than 14 pixels
