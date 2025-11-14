# Requirements Document - Header Standardization

## Introduction

This feature standardizes the header design across all pages in the application. Currently, different pages have inconsistent header styles - some use the old design with back arrows and basic buttons, while others use the improved design with logo, action buttons, and better navigation. This creates a disjointed user experience and makes the application feel less polished.

## Glossary

- **Header**: The top navigation bar present on all pages
- **Action Buttons**: Quick access buttons for common tasks (Reports, Products, WhatsApp, etc.)
- **Logo Header**: The improved header design featuring the Coco Loko logo
- **Legacy Header**: The old header design with back arrows and basic styling
- **Gestão de Garçons**: Waiter management page
- **Connection Status**: Real-time connection indicator showing online/offline state

## Requirements

### Requirement 1

**User Story:** As a user, I want all pages to have a consistent header design, so that the application feels cohesive and professional

#### Acceptance Criteria

1. WHEN THE Application loads any page, THE Application SHALL display a header with the Coco Loko logo
2. THE Header SHALL use the orange-to-pink gradient design on mobile devices
3. THE Header SHALL use a solid color background on desktop devices
4. THE Header SHALL include a green pulse indicator on the logo showing system status
5. THE Header SHALL be responsive and adapt to mobile, tablet, and desktop screen sizes

### Requirement 2

**User Story:** As an admin or staff member, I want quick access to common actions from the header, so that I can navigate efficiently

#### Acceptance Criteria

1. WHEN THE Header displays on admin/staff pages, THE Header SHALL show action buttons for Reports, Products, and WhatsApp
2. THE Header SHALL display action buttons with icons and labels on desktop
3. THE Header SHALL display action buttons with icons only on mobile devices
4. THE Header SHALL include a logout button on all pages
5. THE Header SHALL use consistent button styling across all pages

### Requirement 3

**User Story:** As a user, I want to see my connection status in the header, so that I know if I'm online or offline

#### Acceptance Criteria

1. WHEN THE Application is connected, THE Header SHALL display a green "Online" badge with WiFi icon
2. WHEN THE Application is connecting, THE Header SHALL display a yellow "Conectando..." badge with pulsing WiFi icon
3. WHEN THE Application is disconnected, THE Header SHALL display a red "Offline" badge with WiFi-off icon
4. THE Header SHALL include a "Reconectar" button when offline
5. THE Connection status SHALL be visible on both mobile and desktop views

### Requirement 4

**User Story:** As a user on the Gestão de Garçons page, I want the same modern header as other pages, so that the experience is consistent

#### Acceptance Criteria

1. WHEN THE Gestão de Garçons page loads, THE Page SHALL display the standardized logo header
2. THE Header SHALL replace the old back arrow with proper navigation
3. THE Header SHALL include the refresh button as an action button
4. THE Header SHALL include the add waiter button as an action button
5. THE Header SHALL remove the centered title text (keep it in page content instead)

### Requirement 5

**User Story:** As a developer, I want a reusable header component, so that maintaining headers is easier

#### Acceptance Criteria

1. THE Application SHALL provide a shared Header component
2. THE Header component SHALL accept props for page-specific customization
3. THE Header component SHALL handle navigation internally
4. THE Header component SHALL manage connection status display
5. THE Header component SHALL be used consistently across all pages
