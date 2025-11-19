# Requirements Document

## Introduction

This feature enables automatic printing of order receipts in the kitchen when orders are marked as "In Preparation" (Em Preparo), and provides manual printing capabilities for orders and reports by administrators. The system will support thermal printers (80mm) for kitchen receipts and standard printers for administrative reports.

## Glossary

- **Print Station**: A device (browser/computer) configured to automatically print kitchen receipts when orders reach preparation status
- **Thermal Printer**: An 80mm receipt printer commonly used in kitchens for order tickets
- **Order Receipt**: A printed ticket containing order details for kitchen staff
- **Auto-Print Mode**: A toggleable setting that enables automatic printing on status changes
- **Kitchen View**: The staff interface showing orders in the preparation queue
- **Admin Panel**: The administrative interface for managing orders and viewing reports

## Requirements

### Requirement 1: Automatic Kitchen Printing

**User Story:** As a kitchen staff member, I want orders to print automatically when they are accepted, so I don't have to manually check the screen or press print.

#### Acceptance Criteria

1. WHEN an order status changes to 'em_preparo' (In Preparation), AND the current device has Auto-Print Mode enabled, THE Print Station SHALL automatically trigger the print job for that order
2. THE Kitchen View SHALL provide a toggle control to enable or disable Auto-Print Mode for the current device
3. THE Print Station SHALL persist the Auto-Print Mode setting across browser sessions
4. THE Order Receipt SHALL format content to fit 80mm thermal paper width
5. THE Print Station SHALL print only the order receipt content without browser UI elements

### Requirement 2: Manual Order Printing

**User Story:** As an admin, I want to reprint an order receipt manually, so I can replace lost tickets or provide a customer copy.

#### Acceptance Criteria

1. WHEN the admin views an order in the Order List or Order Details, THE Admin Panel SHALL display a "Print Receipt" button for that order
2. WHEN the admin clicks the "Print Receipt" button, THE Admin Panel SHALL open the browser print dialog with the order receipt pre-formatted
3. THE Admin Panel SHALL maintain the current view after printing without navigation

### Requirement 3: Report Printing

**User Story:** As an admin, I want to print the daily sales report, so I can have a physical record of the shift.

#### Acceptance Criteria

1. WHEN the admin is on the Reports page, THE Admin Panel SHALL display a "Print Report" button
2. THE Admin Panel SHALL format the report to fit standard paper sizes (A4 or Letter)
3. WHEN the admin clicks "Print Report", THE Admin Panel SHALL open the browser print dialog with the formatted report
