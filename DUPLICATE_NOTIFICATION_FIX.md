# Duplicate WhatsApp Notification Fix

## Problem
Two WhatsApp messages were being sent on payment confirmation because both the polling service and webhook service were triggering notifications independently.

## Root Cause
1. **Polling Service** (`src/integrations/mercadopago/polling.ts` line 127): Calls `notificationTriggers.onPaymentConfirmed()` when payment is approved
2. **Webhook Service** (`src/integrations/mercadopago/webhook.ts` line 60): Also calls `notificationTriggers.onPaymentConfirmed()` when processing payment webhooks

Since both services can process the same payment event, duplicate notifications were sent.

## Solution
Added duplicate detection in `src/integrations/whatsapp/notification-triggers.ts`:

- Before queuing any notification, check if a notification of the same type was already sent for that order
- Query the `whatsapp_notifications` table for existing sent notifications
- Skip queuing if a notification was already sent

This fix applies to all notification types:
- `payment_confirmed` - When payment is approved
- `preparing` - When order moves to preparation
- `ready` - When order is ready for pickup

## Changes Made
Updated `NotificationTriggerService` methods:
- `onPaymentConfirmed()` - Added duplicate check
- `onOrderPreparing()` - Added duplicate check  
- `onOrderReady()` - Added duplicate check

## Benefits
- Prevents duplicate notifications regardless of which service triggers first
- Idempotent notification system - safe to call multiple times
- No changes needed to polling or webhook services
- Maintains existing functionality while preventing duplicates
