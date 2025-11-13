# Requirements Document

## Introduction

This specification defines the requirements for refactoring the Coco Loko Açaiteria home page (Index page) to improve the user experience through a more compact grid layout for quick access actions and an interactive carousel for the "Como Funciona" section. The refactor maintains the existing visual identity (colors, fonts, rounded cards) while modernizing the layout and adding dynamic behavior.

## Glossary

- **Home Page**: The Index page component located at the root path ("/") of the application
- **Quick Access Section**: The area containing four main action buttons (Fazer Pedido, Consultar Pedido, Garçom, Gerente)
- **Como Funciona Section**: The "How It Works" section explaining the system for Cliente, Garçom, and Gerente
- **Carousel**: A horizontal slider component that displays content items one at a time with navigation controls
- **Auto-slide**: Automatic progression through carousel items at timed intervals
- **Navigation Controls**: UI elements (dots, arrows) that allow manual carousel navigation

## Requirements

### Requirement 1: Quick Access Grid Layout

**User Story:** As a user visiting the home page, I want to see all four main actions at once in a compact grid layout, so that I can quickly choose my desired action without scrolling.

#### Acceptance Criteria

1. THE Home Page SHALL display the four action buttons (Fazer Pedido, Consultar Pedido, Garçom, Gerente) in a 2x2 grid layout
2. WHEN the Home Page is rendered, THE Home Page SHALL NOT display the "Acesso Rápido" heading text
3. THE Home Page SHALL maintain equal height and width for all four action cards in the grid
4. THE Home Page SHALL preserve the existing color scheme for each action card (purple for Fazer Pedido, cyan for Consultar Pedido, green for Garçom, yellow for Gerente)
5. THE Home Page SHALL maintain the existing icons and labels for each action card

### Requirement 2: Grid Responsive Behavior

**User Story:** As a mobile user, I want the grid layout to adapt to my screen size, so that the buttons remain accessible and visually balanced.

#### Acceptance Criteria

1. WHEN the viewport width is standard mobile size, THE Home Page SHALL display two cards per row with approximately 50% width each minus spacing
2. THE Home Page SHALL maintain comfortable spacing between cards horizontally and vertically
3. THE Home Page SHALL ensure all four cards remain visible without requiring vertical scrolling in the quick access area
4. WHEN the viewport width is very narrow, THE Home Page SHALL maintain the two-per-row layout while adjusting card dimensions as needed

### Requirement 3: Interactive Carousel Implementation

**User Story:** As a user exploring how the system works, I want to see an interactive carousel that automatically shows me each role's functionality, so that I can understand the system without manual interaction.

#### Acceptance Criteria

1. THE Home Page SHALL replace the vertical stack of three "Como Funciona" cards with a horizontal carousel
2. THE Home Page SHALL maintain the "Como Funciona" section heading
3. WHEN the carousel is displayed, THE Home Page SHALL show one card fully visible at a time (Cliente, Garçom, or Gerente)
4. THE Home Page SHALL preserve the existing content, icons, and text for each role card (Cliente, Garçom, Gerente)
5. THE Home Page SHALL maintain the existing color scheme for each role card

### Requirement 4: Carousel Auto-Slide Behavior

**User Story:** As a user viewing the home page, I want the carousel to automatically progress through the items, so that I can see all available information without manual interaction.

#### Acceptance Criteria

1. WHEN the carousel is displayed, THE Home Page SHALL automatically advance to the next slide after 5 seconds
2. THE Home Page SHALL cycle through slides in the order: Cliente → Garçom → Gerente → Cliente
3. WHEN a user manually interacts with the carousel, THE Home Page SHALL pause auto-slide for 10 seconds
4. AFTER the pause period expires, THE Home Page SHALL resume auto-slide behavior

### Requirement 5: Carousel Manual Navigation

**User Story:** As a user, I want to manually control the carousel navigation, so that I can view specific information at my own pace.

#### Acceptance Criteria

1. THE Home Page SHALL support horizontal swipe gestures on touch devices to navigate between carousel slides
2. THE Home Page SHALL display pagination dots below the carousel indicating the total number of slides and current position
3. WHEN a pagination dot is clicked or tapped, THE Home Page SHALL navigate to the corresponding slide
4. THE Home Page SHALL highlight the active pagination dot to indicate the current slide
5. THE Home Page SHALL provide visual feedback during slide transitions with smooth animations

### Requirement 6: Carousel Visual Indicators

**User Story:** As a user, I want clear visual indicators that the "Como Funciona" section is interactive, so that I know I can swipe or wait for automatic progression.

#### Acceptance Criteria

1. THE Home Page SHALL display pagination dots that are large enough to tap (minimum 44x44 pixels touch target)
2. WHEN the carousel first loads, THE Home Page SHALL animate the first slide transition to indicate motion capability
3. THE Home Page SHALL optionally show a partial view of the next card peeking from the side to hint at additional content
4. THE Home Page SHALL ensure sufficient color contrast between pagination dots and background for visibility

### Requirement 7: Accessibility and Internationalization

**User Story:** As a user with accessibility needs, I want the refactored home page to be accessible and maintain Portuguese language support, so that I can use the system effectively.

#### Acceptance Criteria

1. THE Home Page SHALL maintain all text content in Portuguese (BR)
2. THE Home Page SHALL ensure readable font sizes for all text elements (minimum 14px for body text)
3. THE Home Page SHALL provide sufficient color contrast ratios for text and interactive elements (WCAG AA compliance)
4. THE Home Page SHALL ensure carousel navigation controls have accessible touch targets (minimum 44x44 pixels)
5. THE Home Page SHALL support keyboard navigation for carousel controls

### Requirement 8: Visual Identity Preservation

**User Story:** As a stakeholder, I want the refactored home page to maintain the Coco Loko brand identity, so that the user experience remains consistent with the existing design system.

#### Acceptance Criteria

1. THE Home Page SHALL preserve the existing gradient backgrounds (gradient-ocean for mobile, gradient-acai for desktop)
2. THE Home Page SHALL maintain the existing rounded corner styles (rounded-2xl) for all cards
3. THE Home Page SHALL preserve the Coco Loko logo display at the top of the page
4. THE Home Page SHALL maintain the existing shadow effects (shadow-lg, shadow-xl) for cards
5. THE Home Page SHALL preserve the existing hover effects and transitions for interactive elements

### Requirement 9: Navigation Behavior Preservation

**User Story:** As a user, I want all navigation actions to work exactly as before, so that the refactor doesn't disrupt my workflow.

#### Acceptance Criteria

1. WHEN the "Fazer Pedido" button is clicked, THE Home Page SHALL navigate to "/qr"
2. WHEN the "Consultar Pedido" button is clicked, THE Home Page SHALL navigate to "/order-lookup"
3. WHEN the "Garçom" button is clicked, THE Home Page SHALL navigate to "/waiter"
4. WHEN the "Gerente" button is clicked, THE Home Page SHALL navigate to "/auth"
5. THE Home Page SHALL maintain all existing navigation behavior without introducing new routes or changing destinations
