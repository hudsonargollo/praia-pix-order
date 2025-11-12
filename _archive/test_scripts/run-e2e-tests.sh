#!/bin/bash

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Run the E2E tests
npx tsx test-waiter-management-e2e.ts
