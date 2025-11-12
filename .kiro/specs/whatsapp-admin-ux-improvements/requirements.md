# Requirements Document

## Introduction

This document outlines the requirements for improving the UI/UX of the WhatsApp Admin page, which is used by administrators to manage WhatsApp connection status, monitor notification statistics, and test message delivery. The current page has good functionality but needs mobile optimization, better visual hierarchy, and improved information density to make it more usable on smaller screens.

## Glossary

- **WhatsApp Admin Page**: Administrative interface for managing WhatsApp connection and monitoring notifications
- **Connection Status**: Current state of WhatsApp connection (connected, disconnected, connecting)
- **Stats Cards**: Dashboard cards showing notification metrics (sent, failed, pending, delivery time)
- **QR Code Dialog**: Modal window displaying QR code for WhatsApp connection
- **Mobile-First Design**: Design approach prioritizing mobile device experience
- **Information Density**: Amount of information displayed per screen area
- **Visual Hierarchy**: Organization of elements by importance and relationship

## Requirements

### Requirement 1

**User Story:** As an administrator on mobile, I want the header to be compact and efficient, so that I have more screen space for important content and actions.

#### Acceptance Criteria

1. WHEN THE WhatsApp Admin Page loads on mobile (width less than 768px), THE System SHALL display a compact header with logo and title only
2. WHEN THE WhatsApp Admin Page loads on mobile, THE System SHALL reduce header padding to minimum 12px vertical
3. WHEN THE WhatsApp Admin Page loads on mobile, THE System SHALL display connection status badge inline with title or in a compact format
4. WHEN THE WhatsApp Admin Page loads on mobile, THE System SHALL size the logo to maximum 32px height
5. THE WhatsApp Admin Page SHALL hide the subtitle "Monitoramento e gerenciamento de notificações" on mobile devices

### Requirement 2

**User Story:** As an administrator on mobile, I want the stats cards to be readable and well-organized, so that I can quickly understand notification metrics without scrolling horizontally.

#### Acceptance Criteria

1. WHEN THE WhatsApp Admin Page displays stats cards on mobile, THE System SHALL arrange cards in a 2-column grid layout
2. WHEN THE WhatsApp Admin Page displays stats cards, THE System SHALL reduce card padding to 12px on mobile devices
3. WHEN THE WhatsApp Admin Page displays stats cards, THE System SHALL size numbers to 20-24px font size on mobile
4. WHEN THE WhatsApp Admin Page displays stats cards, THE System SHALL size card titles to 12px font size on mobile
5. THE WhatsApp Admin Page SHALL maintain consistent spacing (12px gap) between stats cards on mobile

### Requirement 3

**User Story:** As an administrator on mobile, I want the connection status alert to be concise, so that it doesn't take up too much screen space.

#### Acceptance Criteria

1. WHEN THE WhatsApp Admin Page displays connection status alert on mobile, THE System SHALL reduce alert padding to 12px
2. WHEN THE WhatsApp Admin Page displays connection status alert on mobile, THE System SHALL use smaller font sizes (12-14px) for alert text
3. WHEN THE WhatsApp Admin Page displays connection info in alert, THE System SHALL display only essential information (phone number, connection time)
4. WHEN THE WhatsApp Admin Page displays connection alert on mobile, THE System SHALL hide profile name if space is limited
5. THE WhatsApp Admin Page SHALL maintain alert visibility without excessive vertical space consumption

### Requirement 4

**User Story:** As an administrator on mobile, I want action cards to be compact and easy to tap, so that I can quickly perform common tasks.

#### Acceptance Criteria

1. WHEN THE WhatsApp Admin Page displays action cards on mobile, THE System SHALL stack cards vertically in single column
2. WHEN THE WhatsApp Admin Page displays action cards on mobile, THE System SHALL reduce card padding to 16px
3. WHEN THE WhatsApp Admin Page displays action buttons, THE System SHALL size buttons to minimum 44px height for easy tapping
4. WHEN THE WhatsApp Admin Page displays action cards, THE System SHALL use concise card descriptions (maximum 60 characters)
5. THE WhatsApp Admin Page SHALL maintain 16px spacing between action cards on mobile

### Requirement 5

**User Story:** As an administrator, I want the page to have better visual hierarchy, so that I can focus on the most important information first.

#### Acceptance Criteria

1. WHEN THE WhatsApp Admin Page loads, THE System SHALL display connection status as the most prominent element
2. WHEN THE WhatsApp Admin Page loads, THE System SHALL display stats cards as secondary priority below connection status
3. WHEN THE WhatsApp Admin Page loads, THE System SHALL display action cards as tertiary priority below stats
4. WHEN THE WhatsApp Admin Page uses colors, THE System SHALL use green for connected state, orange for disconnected, and yellow for connecting
5. THE WhatsApp Admin Page SHALL use consistent color coding throughout all components

### Requirement 6

**User Story:** As an administrator on mobile, I want the QR code dialog to be optimized for small screens, so that I can easily scan the code and read instructions.

#### Acceptance Criteria

1. WHEN THE WhatsApp Admin Page displays QR code dialog on mobile, THE System SHALL size QR code to 200px × 200px
2. WHEN THE WhatsApp Admin Page displays QR code dialog on mobile, THE System SHALL reduce dialog padding to 16px
3. WHEN THE WhatsApp Admin Page displays connection instructions, THE System SHALL use 12px font size for instruction text
4. WHEN THE WhatsApp Admin Page displays QR code dialog, THE System SHALL center all content vertically and horizontally
5. THE WhatsApp Admin Page SHALL ensure QR code remains scannable at reduced size

### Requirement 7

**User Story:** As an administrator, I want the page to load quickly and respond smoothly, so that I can manage WhatsApp connection without delays.

#### Acceptance Criteria

1. WHEN THE WhatsApp Admin Page loads, THE System SHALL display initial content within 2 seconds
2. WHEN THE WhatsApp Admin Page refreshes stats, THE System SHALL update data without full page reload
3. WHEN THE WhatsApp Admin Page displays animations, THE System SHALL use CSS transforms for 60fps performance
4. WHEN a user taps buttons on mobile, THE System SHALL provide visual feedback within 100 milliseconds
5. THE WhatsApp Admin Page SHALL maintain responsive interactions even during data loading

### Requirement 8

**User Story:** As an administrator on mobile, I want unnecessary text and whitespace removed, so that I can see more information without scrolling.

#### Acceptance Criteria

1. WHEN THE WhatsApp Admin Page loads on mobile, THE System SHALL remove or abbreviate verbose card descriptions
2. WHEN THE WhatsApp Admin Page displays stats, THE System SHALL use abbreviated labels where appropriate (e.g., "Env." instead of "Enviadas")
3. WHEN THE WhatsApp Admin Page displays connection info, THE System SHALL format phone numbers compactly
4. WHEN THE WhatsApp Admin Page displays timestamps, THE System SHALL use relative time format (e.g., "2h ago") on mobile
5. THE WhatsApp Admin Page SHALL reduce vertical spacing between sections to 16-24px on mobile
