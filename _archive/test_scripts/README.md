# Archived Test Scripts

This directory contains historical test scripts and deployment utilities that were used during development but are no longer needed in the main repository structure.

## Archival Information

- **Archived Date**: November 12, 2025
- **Reason**: Repository organization refactor to clean up root directory and improve maintainability
- **Original Location**: Repository root directory
- **Status**: Historical reference only - not for active use

These files are preserved for historical reference and troubleshooting purposes but should not be used in current development. Modern testing should use the project's standard test suite and deployment workflows.

---

## Archived Scripts

### Deployment Scripts

#### `deploy.sh`
**Purpose**: Simple Cloudflare Pages deployment script  
**Description**: Builds the project with `npm run build` and deploys to Cloudflare Pages using wrangler CLI. Includes commit-dirty flag for quick deployments.  
**Usage**: `./deploy.sh`

#### `deploy-webhook.sh`
**Purpose**: Deploy webhook handler to Supabase Edge Functions  
**Description**: Specialized deployment script for the MercadoPago webhook handler function.  
**Usage**: `./deploy-webhook.sh`

#### `add-background-image.sh`
**Purpose**: Upload background images to Supabase Storage  
**Description**: Utility script to add or update background images in the Supabase storage bucket.  
**Usage**: `./add-background-image.sh`

---

### Validation Scripts

#### `validate-refactor.sh`
**Purpose**: Repository reorganization validation script  
**Description**: Comprehensive validation script that checks TypeScript compilation, Vite build, dev server startup, and route functionality after refactoring steps. Uses colored output for pass/fail status.  
**Usage**: `./validate-refactor.sh`

#### `run-e2e-tests.sh`
**Purpose**: End-to-end testing orchestration  
**Description**: Shell script to run complete end-to-end tests across all user flows (customer, kitchen, cashier, admin, waiter).  
**Usage**: `./run-e2e-tests.sh`

---

### WhatsApp/Evolution API Tests

#### `test-evolution-api.ts`
**Purpose**: Test Evolution API connection and configuration  
**Description**: Validates connection to Evolution API instance, checks instance status, and verifies API key authentication. Tests the WhatsApp integration backend.  
**Usage**: `npx tsx test-evolution-api.ts`

#### `test-evolution-client.ts`
**Purpose**: Test Evolution API client implementation  
**Description**: Tests the client-side wrapper for Evolution API calls, including error handling and response parsing.  
**Usage**: `npx tsx test-evolution-client.ts`

#### `test-evolution-send-message.ts`
**Purpose**: Test sending WhatsApp messages via Evolution API  
**Description**: End-to-end test for sending WhatsApp messages through the Evolution API integration.  
**Usage**: `npx tsx test-evolution-send-message.ts`

#### `test-evolution-from-browser.html`
**Purpose**: Browser-based Evolution API testing  
**Description**: HTML page for testing Evolution API calls directly from the browser, useful for debugging CORS and authentication issues.  
**Usage**: Open in browser

#### `send-test-message.ts`
**Purpose**: Quick WhatsApp message test  
**Description**: Simple script to send a test WhatsApp notification to verify the messaging system is working.  
**Usage**: `npx tsx send-test-message.ts`

#### `send-quick-test.ts`
**Purpose**: Minimal WhatsApp notification test  
**Description**: Lightweight version of send-test-message.ts for rapid testing during development.  
**Usage**: `npx tsx send-quick-test.ts`

---

### Admin Feature Tests

#### `test-admin-features.ts`
**Purpose**: Test admin panel functionality  
**Description**: Comprehensive test suite for admin features including product management, waiter management, and reports. Requires active admin session.  
**Usage**: `npx tsx test-admin-features.ts`

#### `test-waiter-management-e2e.ts`
**Purpose**: End-to-end waiter management tests  
**Description**: Tests complete waiter management flow including creation, updates, deletion, and authentication.  
**Usage**: `npx tsx test-waiter-management-e2e.ts`

#### `test-waiter-orders-admin-panel.ts`
**Purpose**: Test waiter order tracking in admin panel  
**Description**: Validates that admin panel correctly displays and tracks orders placed by waiters.  
**Usage**: `npx tsx test-waiter-orders-admin-panel.ts`

---

### Database & RLS Tests

#### `test-customer-order-rls.ts`
**Purpose**: Test Row Level Security for customer orders  
**Description**: Validates RLS policies for customer order creation and access, ensuring customers can only see their own orders.  
**Usage**: `npx tsx test-customer-order-rls.ts`

#### `test-order-creation-rls.ts`
**Purpose**: Test order creation with RLS policies  
**Description**: Specifically tests that order creation works correctly with Row Level Security enabled.  
**Usage**: `npx tsx test-order-creation-rls.ts`

---

### Edge Functions Tests

#### `test-edge-functions.ts`
**Purpose**: Test Supabase Edge Functions  
**Description**: Validates that all Supabase Edge Functions (waiter management, webhooks) are deployed and responding correctly.  
**Usage**: `npx tsx test-edge-functions.ts`

#### `test-waiter-edge-functions.ts`
**Purpose**: Test waiter-specific Edge Functions  
**Description**: Focused tests for waiter management Edge Functions (create, update, delete, list waiters).  
**Usage**: `npx tsx test-waiter-edge-functions.ts`

#### `test-waiter-functions.ts`
**Purpose**: Test waiter RPC functions  
**Description**: Tests database RPC functions related to waiter operations.  
**Usage**: `npx tsx test-waiter-functions.ts`

#### `test-list-waiters-direct.ts`
**Purpose**: Direct test of list-waiters function  
**Description**: Minimal test to verify the list-waiters Edge Function is accessible and returns data.  
**Usage**: `npx tsx test-list-waiters-direct.ts`

---

### Service Role & Authentication Tests

#### `test-service-role-key.ts`
**Purpose**: Test Supabase service role key configuration  
**Description**: Validates that the service role key is properly configured and has admin privileges for bypassing RLS.  
**Usage**: `npx tsx test-service-role-key.ts`

#### `test-service-role-direct.ts`
**Purpose**: Direct service role authentication test  
**Description**: Tests service role authentication and permissions without going through Edge Functions.  
**Usage**: `npx tsx test-service-role-direct.ts`

---

### Payment System Tests

#### `test-payment-notification.ts`
**Purpose**: Test payment notification flow  
**Description**: End-to-end test of payment confirmation and WhatsApp notification delivery after successful payment.  
**Usage**: `npx tsx test-payment-notification.ts`

---

### Production Validation

#### `verify-production.ts`
**Purpose**: Production environment validation  
**Description**: Comprehensive checks to verify production deployment is working correctly, including all routes, API endpoints, and integrations.  
**Usage**: `npx tsx verify-production.ts`

---

## File Categories

### By Type
- **Shell Scripts (5)**: Deployment and validation automation
- **TypeScript Tests (20)**: Feature and integration testing
- **HTML Tests (1)**: Browser-based API testing

### By Functionality
- **Deployment (3)**: deploy.sh, deploy-webhook.sh, add-background-image.sh
- **WhatsApp/Evolution API (6)**: test-evolution-*.ts, send-*-test.ts
- **Admin Features (3)**: test-admin-features.ts, test-waiter-management-e2e.ts, test-waiter-orders-admin-panel.ts
- **Database/RLS (2)**: test-customer-order-rls.ts, test-order-creation-rls.ts
- **Edge Functions (4)**: test-edge-functions.ts, test-waiter-edge-functions.ts, test-waiter-functions.ts, test-list-waiters-direct.ts
- **Authentication (2)**: test-service-role-key.ts, test-service-role-direct.ts
- **Payment (1)**: test-payment-notification.ts
- **Validation (3)**: validate-refactor.sh, run-e2e-tests.sh, verify-production.ts

---

## Historical Context

These scripts were created during the development and debugging phases of the Coco Loko Açaiteria project. They served important purposes:

1. **Rapid Testing**: Quick validation of features without full test suite setup
2. **Debugging**: Isolated testing of problematic components (especially WhatsApp integration)
3. **Deployment**: Manual deployment workflows before CI/CD automation
4. **RLS Validation**: Ensuring Row Level Security policies worked correctly
5. **Production Verification**: Post-deployment smoke tests

## Migration Notes

- Modern testing should use the project's standard test suite in `src/components/__tests__/` and `src/pages/__tests__/`
- Deployment should use the scripts in `scripts/` directory or CI/CD pipelines
- Edge Function testing should be done through Supabase CLI: `npx supabase functions serve`
- Production validation should use proper monitoring and alerting tools

## Preservation Rationale

These files are preserved because:
- They document the evolution of the testing strategy
- They contain useful patterns for manual testing and debugging
- They may be referenced when troubleshooting similar issues
- They show the historical development process and challenges faced

**Note**: Do not run these scripts in the current project without reviewing and updating them first. Dependencies, API endpoints, and configurations may have changed since archival.
