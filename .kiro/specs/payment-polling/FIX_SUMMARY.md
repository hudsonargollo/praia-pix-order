# PIX Payment Polling Fix

## Problem

PIX payments were not automatically updating from `pending_payment` to `paid` status after payment confirmation.

## Root Causes

1. **Missing RPC Function**: The `confirm_order_payment` function didn't exist in the database
2. **Wrong Environment Variable**: The check-payment API was looking for `MERCADOPAGO_ACCESS_TOKEN` instead of `VITE_MERCADOPAGO_ACCESS_TOKEN`

## Solutions Implemented

### 1. Created Database Function

**File**: `supabase/migrations/20251116000001_create_confirm_order_payment_function.sql`

Created a `SECURITY DEFINER` function that bypasses RLS to update order status:

```sql
CREATE OR REPLACE FUNCTION confirm_order_payment(
  _order_id UUID,
  _payment_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
```

This function:
- Updates order status to `paid`
- Sets `payment_status` to `confirmed`
- Records `payment_confirmed_at` timestamp
- Stores the MercadoPago payment ID
- Only updates orders that are still `pending_payment`

### 2. Fixed Check Payment API

**File**: `functions/api/mercadopago/check-payment.js`

Updated to use the correct environment variable:

```javascript
// Before
const accessToken = env.MERCADOPAGO_ACCESS_TOKEN || 'fallback';

// After
const accessToken = env.VITE_MERCADOPAGO_ACCESS_TOKEN || env.MERCADOPAGO_ACCESS_TOKEN;
```

Now checks both variable names for compatibility and shows a proper error if neither is configured.

## How It Works Now

### Payment Flow

1. **Customer pays with PIX**
   - QR code is generated
   - Order status: `pending_payment`

2. **Payment is confirmed** (two methods):
   
   **Method A: Webhook (Primary)**
   - MercadoPago sends webhook to `/api/mercadopago/webhook`
   - Webhook updates order status immediately
   - Fastest method (instant)

   **Method B: Polling (Fallback)**
   - Frontend polls `/api/mercadopago/check-payment` every 5-15 seconds
   - When payment is approved, calls `confirm_order_payment` RPC
   - Updates order status
   - Triggers WhatsApp notification

3. **Order moves to paid**
   - Status changes to `paid`
   - WhatsApp notification sent
   - Customer redirected to order status page

### Polling Schedule

- **First 50 seconds**: Check every 5 seconds
- **Next 3.5 minutes**: Check every 10 seconds  
- **Remaining time**: Check every 15 seconds
- **Total timeout**: 15 minutes

## Testing

### Test the Fix

1. **Create a test order**:
   ```
   Go to menu → Add items → Checkout
   ```

2. **Generate PIX payment**:
   ```
   Select PIX → Generate QR code
   ```

3. **Simulate payment** (test mode):
   ```
   Use MercadoPago test credentials
   Payment should auto-approve in test mode
   ```

4. **Verify status change**:
   ```
   Order should change from pending_payment → paid
   Within 5-10 seconds
   ```

5. **Check WhatsApp**:
   ```
   Customer should receive payment confirmation message
   ```

## Deployment

**Latest deployment**: https://60fb521b.coco-loko-acaiteria.pages.dev

**Migration applied**: ✅ `confirm_order_payment` function created

## Files Modified

1. `supabase/migrations/20251116000001_create_confirm_order_payment_function.sql` - New
2. `functions/api/mercadopago/check-payment.js` - Fixed environment variable
3. `scripts/run-migration.sh` - New migration script

## Monitoring

To check if polling is working:

1. **Browser Console**:
   ```
   Look for: "Payment polling check"
   Should see status updates every 5-15 seconds
   ```

2. **Cloudflare Functions Logs**:
   ```
   Check /api/mercadopago/check-payment calls
   Should see successful 200 responses
   ```

3. **Database**:
   ```sql
   SELECT id, order_number, status, payment_status, payment_confirmed_at
   FROM orders
   WHERE status = 'paid'
   ORDER BY payment_confirmed_at DESC;
   ```

## Troubleshooting

### Payment still not updating?

1. **Check environment variables**:
   - Verify `VITE_MERCADOPAGO_ACCESS_TOKEN` is set in Cloudflare Pages
   - Should start with `TEST-` for test mode

2. **Check browser console**:
   - Look for polling errors
   - Verify payment ID is correct

3. **Check Cloudflare logs**:
   - Look for check-payment API errors
   - Verify access token is working

4. **Check database**:
   - Verify `confirm_order_payment` function exists
   - Check if order status is updating

### Webhook not working?

Polling is the fallback! If webhooks fail, polling will still update the order within 5-15 seconds.

## Benefits

1. ✅ **Automatic status updates** - No manual intervention needed
2. ✅ **Dual system** - Webhook + Polling for reliability
3. ✅ **Fast updates** - 5-10 second response time
4. ✅ **WhatsApp notifications** - Automatic customer notifications
5. ✅ **Error handling** - Proper error messages and logging

## Next Steps

If you're still having issues:

1. Check that you're using **TEST credentials** from MercadoPago
2. Verify the credentials are set in **Cloudflare Pages environment variables**
3. Check the browser console for any errors during polling
4. Review Cloudflare Functions logs for API errors
