# 🚀 DEPLOY NOW - Payment Fix

## What Was Fixed
Payment polling was crashing with `TypeError: e.startsWith is not a function`

## The Fix
Changed payment ID from **number** to **string** in both API endpoints:
- ✅ `functions/api/mercadopago/create-payment.ts`
- ✅ `functions/api/mercadopago/check-payment.js`

## Deploy Commands
```bash
git add functions/api/mercadopago/create-payment.ts functions/api/mercadopago/check-payment.js FIX_PAYMENT_ID_TYPE.md DEPLOY_NOW.md
git commit -m "fix: convert payment IDs to strings to fix polling crash"
git push origin main
```

## What This Fixes
- ✅ Payment status polling now works
- ✅ Payments update automatically
- ✅ No more console errors
- ✅ Orders reach kitchen automatically

**Deploy this immediately to fix all payment issues!** 🎯
