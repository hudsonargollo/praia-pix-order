# Requirements Document

## Introduction

This document specifies the requirements for implementing manual drag-and-drop sorting of menu products within categories for the Coco Loko Açaiteria ordering system. The feature enables administrators to customize the display order of products on the customer-facing menu page while maintaining category boundaries and ensuring customers never access sorting functionality.

## Glossary

- **Menu System**: The customer-facing product catalog accessible at /menu route
- **Product Card**: A visual component displaying product image, name, price, and add-to-cart button
- **Category**: A grouping of related products (e.g., Bebidas, Salgados Grandes)
- **Sort Order**: A numeric field determining the display sequence of products within a category
- **Sorting Mode**: An admin-only interface state enabling drag-and-drop reordering
- **Admin User**: An authenticated user with administrative privileges
- **Customer User**: An unauthenticated or non-admin user accessing the menu
- **Drag Handle**: A visual indicator (icon or area) that enables dragging functionality

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to enable sorting mode on the menu page, so that I can rearrange products without navigating to a separate interface

#### Acceptance Criteria

1. WHEN an Admin User authenticates successfully, THE Menu System SHALL display a toggle control labeled "Organizar Itens"
2. WHEN a Customer User accesses the menu page, THE Menu System SHALL NOT display any sorting controls
3. WHEN an Admin User activates the sorting toggle, THE Menu System SHALL enable drag-and-drop functionality for all Product Cards
4. WHEN an Admin User deactivates the sorting toggle, THE Menu System SHALL disable drag-and-drop functionality and return to normal viewing mode
5. WHEN an Admin User logs out, THE Menu System SHALL hide all sorting controls immediately

### Requirement 2

**User Story:** As an admin user, I want to drag and drop products within their category, so that I can customize the display order for customers

#### Acceptance Criteria

1. WHILE Sorting Mode is active, THE Menu System SHALL allow Admin Users to drag Product Cards vertically within the same Category
2. WHEN an Admin User drags a Product Card, THE Menu System SHALL display visual feedback including elevation and drop target indicators
3. WHEN an Admin User attempts to drag a Product Card to a different Category, THE Menu System SHALL prevent the action and snap the card back to its original position
4. WHEN an Admin User releases a Product Card at a valid drop location, THE Menu System SHALL update the visual order immediately
5. WHEN a Product Card position changes, THE Menu System SHALL persist the new Sort Order to the database

### Requirement 3

**User Story:** As an admin user, I want visual feedback during drag operations, so that I understand where products will be placed

#### Acceptance Criteria

1. WHEN an Admin User begins dragging a Product Card, THE Menu System SHALL apply elevation styling to the dragged card
2. WHILE a Product Card is being dragged, THE Menu System SHALL shift other Product Cards to indicate the drop location
3. WHEN a Product Card is dragged over an invalid drop target, THE Menu System SHALL display visual indication that the drop is not allowed
4. WHEN an Admin User successfully drops a Product Card, THE Menu System SHALL display a confirmation toast message "Ordem salva!"
5. WHILE Sorting Mode is active, THE Menu System SHALL display drag handle icons on each Product Card

### Requirement 4

**User Story:** As an admin user, I want to access a dedicated sorting interface from the product edit section, so that I can organize products without affecting the customer view

#### Acceptance Criteria

1. WHEN an Admin User accesses the product edit section, THE Menu System SHALL display a button labeled "Organizar Ordem no Menu"
2. WHEN an Admin User clicks the organize button, THE Menu System SHALL open a dedicated sorting interface displaying products from the selected Category
3. WHILE in the dedicated sorting interface, THE Menu System SHALL enable drag-and-drop functionality by default
4. WHEN an Admin User saves changes in the dedicated sorting interface, THE Menu System SHALL persist the Sort Order and close the interface
5. WHEN the dedicated sorting interface closes, THE Menu System SHALL reflect the updated order on the public menu page immediately

### Requirement 5

**User Story:** As a customer user, I want to see products in the order set by administrators, so that I can browse the menu in a logical sequence

#### Acceptance Criteria

1. WHEN any user loads the menu page, THE Menu System SHALL display Product Cards sorted by Sort Order in ascending sequence within each Category
2. WHERE a Product Card has no Sort Order value, THE Menu System SHALL display it using a default ordering method (alphabetical or by ID)
3. WHEN an Admin User updates Sort Order values, THE Menu System SHALL reflect changes on the customer-facing menu within 2 seconds
4. THE Menu System SHALL maintain Sort Order persistence across user sessions
5. THE Menu System SHALL NOT allow Customer Users to modify or access Sort Order values

### Requirement 6

**User Story:** As a system administrator, I want sort order data to be stored securely, so that product arrangements persist reliably

#### Acceptance Criteria

1. THE Menu System SHALL store Sort Order as a numeric field in the products database table
2. WHEN a Product Card position changes, THE Menu System SHALL update the Sort Order field within 1 second
3. THE Menu System SHALL ensure Sort Order values are unique within each Category
4. WHEN multiple Admin Users modify Sort Order simultaneously, THE Menu System SHALL handle conflicts using last-write-wins strategy
5. THE Menu System SHALL validate that only authenticated Admin Users can modify Sort Order values through API endpoints

### Requirement 7

**User Story:** As an admin user, I want the add-to-cart button to be disabled during sorting mode, so that I don't accidentally add products while organizing

#### Acceptance Criteria

1. WHILE Sorting Mode is active, THE Menu System SHALL disable all "Adicionar" buttons on Product Cards
2. WHILE Sorting Mode is active, THE Menu System SHALL apply visual styling to indicate disabled state on "Adicionar" buttons
3. WHEN Sorting Mode is deactivated, THE Menu System SHALL re-enable all "Adicionar" buttons
4. THE Menu System SHALL maintain all other Product Card visual elements unchanged during Sorting Mode
5. WHILE in the dedicated sorting interface, THE Menu System SHALL hide or disable "Adicionar" buttons

### Requirement 8

**User Story:** As an admin user, I want category boundaries to be enforced during sorting, so that products remain in their correct categories

#### Acceptance Criteria

1. THE Menu System SHALL prevent Product Cards from being dragged outside their assigned Category boundary
2. WHEN an Admin User attempts cross-category dragging, THE Menu System SHALL provide visual feedback that the action is invalid
3. THE Menu System SHALL maintain the Category assignment of each Product Card regardless of Sort Order changes
4. WHEN a Product Card's Category is changed through the edit interface, THE Menu System SHALL reset its Sort Order to the end of the new Category
5. THE Menu System SHALL NOT allow reordering of Category chips themselves through the sorting interface
