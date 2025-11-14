# Requirements Document

## Introduction

This feature comprehensively refactors the payment page (PIX checkout) to prioritize the PIX copy-paste flow over QR code scanning, reorganize content hierarchy for mobile-first usage, and fix navigation issues. The goal is to provide a streamlined payment experience where customers can quickly copy the PIX code and complete payment in their banking app.

## Glossary

- **Payment Page**: The page displayed to customers after checkout where they can complete payment via PIX QR code or copy-paste code
- **PIX Code**: The alphanumeric string that customers can copy and paste into their banking app to complete payment
- **PIX Code Snippet**: A truncated display of the PIX code showing first 10 and last 6 characters with ellipsis
- **QR Code**: The scannable image that customers can use as an alternative payment method
- **Copy Button**: An interactive button that copies the full PIX code to the device clipboard
- **Status Badge**: Visual indicator showing current payment status (Pendente, Pago, etc.)
- **Resumo do Pedido**: Order summary card displaying customer information and total amount

## Requirements

### Requirement 1

**User Story:** As a customer completing payment, I want a clear and informative header that explains what I need to do, so that I understand the payment process immediately

#### Acceptance Criteria

1. THE Payment Page SHALL display the header title as "Detalhes do pagamento PIX"
2. THE Payment Page SHALL display an optional subtitle "Use o código PIX abaixo para concluir o pagamento" below the title
3. THE Payment Page SHALL maintain the back button functionality in the header
4. THE Payment Page SHALL preserve the gradient background styling in the header
5. THE Payment Page SHALL ensure the header text is clearly readable with appropriate font sizes

### Requirement 2

**User Story:** As a customer who prefers to use PIX copy-paste, I want the PIX code to be the primary focus of the page, so that I can quickly copy it without searching

#### Acceptance Criteria

1. THE Payment Page SHALL display the PIX code section as the primary content area with high visual prominence
2. THE Payment Page SHALL display a label "Código PIX" above the PIX code
3. THE Payment Page SHALL display the PIX code as a snippet in the format "${first 10 chars}...${last 6 chars}"
4. THE Payment Page SHALL display helper text "Clique em 'Copiar Código PIX' para colar no app do seu banco" below the snippet
5. WHEN the customer clicks the "Copiar Código PIX" button, THE Payment Page SHALL copy the full PIX code string to the device clipboard
6. WHEN the PIX code is successfully copied, THE Payment Page SHALL display a confirmation toast notification with the message "Copiado!"
7. THE Payment Page SHALL style the "Copiar Código PIX" button as a full-width primary button with high visual prominence
8. THE Payment Page SHALL position the PIX code section above the QR code section

### Requirement 3

**User Story:** As a customer who may want to scan a QR code, I want the QR code available as a secondary option, so that I have flexibility in how I complete payment

#### Acceptance Criteria

1. THE Payment Page SHALL display the QR code section below the primary PIX code section
2. THE Payment Page SHALL display the title "Pagar com QR Code (opcional)" above the QR code
3. THE Payment Page SHALL display helper text "Se preferir, aponte a câmera do app do seu banco para o QR Code" near the QR code
4. THE Payment Page SHALL render the QR code at a smaller size than the current implementation to reduce vertical space
5. THE Payment Page SHALL maintain QR code image quality for successful scanning
6. THE Payment Page SHALL visually de-emphasize the QR code section compared to the PIX code section

### Requirement 4

**User Story:** As a customer reviewing my order, I want to see a clear summary of my order details, so that I can confirm the payment amount before completing the transaction

#### Acceptance Criteria

1. THE Payment Page SHALL display the "Resumo do Pedido" card below the QR code section
2. THE Payment Page SHALL display the customer name with label "Cliente:"
3. THE Payment Page SHALL display the customer phone with label "Telefone:" formatted as "(DDD) 00000-0000" without country code prefix
4. THE Payment Page SHALL format phone numbers by extracting the last 11 digits and applying the Brazilian phone format pattern
5. THE Payment Page SHALL display the total amount with label "Total:" in a visually prominent style
6. THE Payment Page SHALL maintain consistent styling with the rest of the page

### Requirement 5

**User Story:** As a customer who wants to go back, I want the back button to work correctly, so that I can navigate without encountering errors

#### Acceptance Criteria

1. THE Payment Page SHALL display a "Voltar" button in the footer or header area
2. WHEN the customer clicks the "Voltar" button, THE Payment Page SHALL first attempt to navigate using window.history.back()
3. IF window.history.back() is not available or fails, THE Payment Page SHALL navigate to a valid fallback route such as "/menu" or "/"
4. THE Payment Page SHALL never navigate to a broken checkout-... route that results in a 404 error
5. THE Payment Page SHALL ensure the "Voltar" button has a minimum touch target size of 44x44 pixels

### Requirement 6

**User Story:** As a customer on a mobile device, I want the page layout to be optimized for mobile viewing, so that I can complete payment without excessive scrolling

#### Acceptance Criteria

1. THE Payment Page SHALL use a mobile-first, full-width stacked layout for all sections
2. THE Payment Page SHALL minimize vertical spacing between sections while maintaining readability
3. THE Payment Page SHALL ensure all interactive elements have minimum touch target sizes of 44x44 pixels
4. THE Payment Page SHALL maintain smooth scrolling behavior without layout shifts
5. THE Payment Page SHALL ensure text remains readable with font sizes no smaller than 14 pixels

### Requirement 7

**User Story:** As a customer, I want to see the current payment status clearly, so that I know whether my payment is pending, approved, or has an issue

#### Acceptance Criteria

1. THE Payment Page SHALL display the "Status do pagamento" section below the header
2. THE Payment Page SHALL display the current payment status with an appropriate badge (Pendente, Pago, Expirado, Erro)
3. THE Payment Page SHALL maintain the existing status badge styling and behavior
4. THE Payment Page SHALL integrate the status section into the new page hierarchy
5. WHEN the payment status is not pending, THE Payment Page SHALL hide or disable payment-related actions appropriately
