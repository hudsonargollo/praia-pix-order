# Environment Variables Setup Guide

## Required Environment Variables for Cloudflare Pages

Configure these in your Cloudflare Pages dashboard under **Settings → Environment Variables**.

---

## 1. Supabase Configuration (Required for Waiters Management)

### SUPABASE_URL
**Value:** Your Supabase project URL
**Example:** `https://abcdefghijklmnop.supabase.co`
**Where to find:**
1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon)
3. Go to **API** section
4. Copy the **Project URL**

### SUPABASE_SERVICE_KEY
**Value:** Your Supabase service role key (NOT the anon key!)
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)
**Where to find:**
1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon)
3. Go to **API** section
4. Under **Project API keys**, find **service_role** key
5. Click **Reveal** and copy the entire key

⚠️ **IMPORTANT:** 
- Use the `service_role` key, NOT the `anon` key
- This key has admin privileges - keep it secret!
- Never commit this key to your repository

---

## 2. WhatsApp Configuration (Optional - for WhatsApp notifications)

### WHATSAPP_ENCRYPTION_KEY
**Value:** A 64-character hexadecimal string (32 bytes)
**Example:** `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

**How to generate:**
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use this online tool: https://www.random.org/bytes/

**Purpose:** Encrypts WhatsApp session data stored in the database for security.

---

## 3. MercadoPago Configuration (Optional - for payments)

### MERCADOPAGO_ACCESS_TOKEN
**Value:** Your MercadoPago access token
**Where to find:**
1. Go to https://www.mercadopago.com.br/developers
2. Navigate to **Your integrations**
3. Select your application
4. Copy the **Access Token** (Production or Test)

---

## How to Add Environment Variables in Cloudflare Pages

### Step 1: Access Cloudflare Dashboard
1. Go to https://dash.cloudflare.com/
2. Select your account
3. Click on **Pages** in the left sidebar
4. Select your project (e.g., `coco-loko-acaiteria`)

### Step 2: Navigate to Settings
1. Click on **Settings** tab
2. Scroll down to **Environment variables** section

### Step 3: Add Variables
1. Click **Add variable**
2. Enter the **Variable name** (e.g., `SUPABASE_URL`)
3. Enter the **Value**
4. Select the environment:
   - **Production** - for live site
   - **Preview** - for preview deployments
   - Both (recommended for most variables)
5. Click **Save**

### Step 4: Redeploy
After adding/changing environment variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **...** menu
4. Select **Retry deployment**

Or simply push a new commit to trigger a deployment.

---

## Verification Checklist

### For Waiters Management:
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_KEY` is set (service_role, not anon)
- [ ] Redeployed after adding variables
- [ ] Can access `/admin-waiters` page
- [ ] Can create a new waiter successfully

### For WhatsApp:
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_KEY` is set
- [ ] `WHATSAPP_ENCRYPTION_KEY` is generated and set
- [ ] WhatsApp sessions table created in Supabase
- [ ] Can access `/whatsapp-admin` page
- [ ] Can generate QR code for connection

### For Payments:
- [ ] `MERCADOPAGO_ACCESS_TOKEN` is set
- [ ] Payment flow works in checkout

---

## Troubleshooting

### Error: "Supabase environment variables not set"
**Solution:** 
1. Verify variables are added in Cloudflare Pages settings
2. Check spelling (case-sensitive!)
3. Redeploy the site after adding variables
4. Check browser console for specific error messages

### Error: "Failed to create waiter"
**Solution:**
1. Verify you're using `service_role` key, not `anon` key
2. Check Supabase logs for detailed error
3. Verify the key hasn't expired or been revoked

### Error: "Session encryption failed"
**Solution:**
1. Verify `WHATSAPP_ENCRYPTION_KEY` is exactly 64 hex characters
2. Regenerate the key if needed
3. Redeploy after setting the key

### Variables not taking effect
**Solution:**
1. Clear browser cache
2. Force a new deployment (don't just retry)
3. Wait 2-3 minutes after deployment
4. Check the deployment logs for errors

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables for all secrets

2. **Use different keys for production and preview**
   - Set up separate Supabase projects if needed
   - Use test credentials for preview deployments

3. **Rotate keys periodically**
   - Change `WHATSAPP_ENCRYPTION_KEY` every 6 months
   - Regenerate MercadoPago tokens annually

4. **Monitor access logs**
   - Check Supabase logs regularly
   - Set up alerts for suspicious activity

5. **Limit key permissions**
   - Use service_role only where absolutely necessary
   - Consider creating custom roles with limited permissions

---

## Quick Setup Commands

### Generate WhatsApp Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Supabase Connection
```bash
curl -X GET "https://YOUR-PROJECT.supabase.co/rest/v1/" \
  -H "apikey: YOUR-SERVICE-ROLE-KEY" \
  -H "Authorization: Bearer YOUR-SERVICE-ROLE-KEY"
```

### Verify Environment Variables (in Cloudflare Worker)
Add this temporarily to a function:
```javascript
console.log('Environment check:', {
  hasSupabaseUrl: !!context.env.SUPABASE_URL,
  hasSupabaseKey: !!context.env.SUPABASE_SERVICE_KEY,
  hasWhatsAppKey: !!context.env.WHATSAPP_ENCRYPTION_KEY
});
```

---

## Summary

**Minimum required for basic functionality:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

**For full functionality:**
- All Supabase variables
- `WHATSAPP_ENCRYPTION_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`

After setting up all variables, redeploy and test each feature:
1. ✅ Create a waiter
2. ✅ Connect WhatsApp
3. ✅ Process a payment
4. ✅ Send a notification
