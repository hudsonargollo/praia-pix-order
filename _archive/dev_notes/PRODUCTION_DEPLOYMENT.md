# WhatsApp Notifications Production Deployment Guide

## Overview

This guide covers the deployment and configuration of the WhatsApp notification system for production use with Cloudflare Pages and Functions.

## Prerequisites

- Cloudflare account with Pages enabled
- Supabase project with production database
- WhatsApp Business account (optional, using Baileys for WhatsApp Web)
- Node.js 18+ installed locally

## Environment Variables

### Required Environment Variables

The following environment variables must be configured in Cloudflare Pages settings:

#### Supabase Configuration
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### WhatsApp Encryption Key
```bash
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WHATSAPP_ENCRYPTION_KEY=your-64-character-hex-encryption-key
```

#### WhatsApp Session Configuration
```bash
WHATSAPP_SESSION_ID=coco-loko-main
```

### Setting Environment Variables in Cloudflare

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Navigate to Settings → Environment Variables
3. Add each variable for the Production environment
4. Click "Save" after adding all variables

### Local Development Environment Variables

For local development, create a `.env` file with:

```bash
# Supabase (already configured)
VITE_SUPABASE_URL=https://sntxekdwdllwkszclpiq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Server-side variables for Cloudflare Functions
SUPABASE_URL=https://sntxekdwdllwkszclpiq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WHATSAPP_ENCRYPTION_KEY=your-encryption-key
WHATSAPP_SESSION_ID=coco-loko-main
```

## Generating Encryption Key

The WhatsApp session data is encrypted at rest. Generate a secure encryption key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

Save this key securely and add it to your Cloudflare environment variables.

## Database Setup

### Run Migrations

Ensure all WhatsApp-related migrations are applied to your production database:

```bash
# Connect to your Supabase project
npx supabase link --project-ref your-project-ref

# Push migrations to production
npx supabase db push
```

### Verify Tables

Confirm these tables exist in production:
- `whatsapp_sessions` - Stores encrypted WhatsApp session data
- `whatsapp_notifications` - Notification queue and history
- `notification_templates` - Message templates
- `whatsapp_error_logs` - Error tracking
- `whatsapp_opt_out` - Customer opt-out preferences

## Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Deploy to Cloudflare Pages

#### Option A: Automatic Deployment (Recommended)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
3. Add environment variables in Cloudflare dashboard
4. Trigger deployment

#### Option B: Manual Deployment

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

### 3. Configure Cloudflare Functions

The WhatsApp service functions are automatically deployed with your Pages project from the `functions/` directory:

- `/api/whatsapp/connection` - WhatsApp connection management
- `/api/whatsapp/session-manager` - Session persistence

No additional configuration needed - functions are deployed automatically.

### 4. Verify Deployment

After deployment, verify the functions are working:

```bash
# Check connection status
curl https://your-domain.pages.dev/api/whatsapp/connection?action=status

# Expected response:
# {
#   "isConnected": false,
#   "connectionState": "disconnected",
#   "qrCode": null,
#   ...
# }
```

## WhatsApp Connection Setup

### Initial Connection

1. Navigate to the WhatsApp Admin page: `https://your-domain.pages.dev/whatsapp-admin`
2. Click "Connect WhatsApp"
3. Scan the QR code with your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code displayed
4. Wait for connection confirmation

### Session Persistence

Once connected, the session is:
- Encrypted using AES-256-GCM
- Stored in the `whatsapp_sessions` table
- Automatically restored on reconnection
- Valid until you log out from WhatsApp

## Monitoring and Logging

### Connection Monitoring

The system includes automatic monitoring:
- Health checks every 30 seconds
- Automatic reconnection with exponential backoff
- Connection status tracking
- Heartbeat monitoring

### Error Logging

All errors are logged to:
- `whatsapp_error_logs` table in Supabase
- Cloudflare Functions logs (Dashboard → Pages → Functions → Logs)

### Delivery Monitoring

Track notification delivery:
- View delivery rates in WhatsApp Admin dashboard
- Monitor failed notifications in Cashier dashboard
- Check `whatsapp_notifications` table for detailed history

## Security Considerations

### Encryption

- Session data encrypted with AES-256-GCM
- Phone numbers encrypted in database
- Encryption key stored securely in environment variables

### Access Control

- WhatsApp Admin page requires authentication
- Cashier dashboard requires staff role
- Service role key used for server-side operations only

### Rate Limiting

- Implement rate limiting at Cloudflare level if needed
- Monitor for unusual activity patterns
- Respect WhatsApp's usage policies

## Troubleshooting

### Connection Issues

**Problem**: QR code not appearing
- Check Cloudflare Functions logs for errors
- Verify environment variables are set correctly
- Ensure Supabase connection is working

**Problem**: Connection keeps disconnecting
- Check health monitoring logs
- Verify encryption key is consistent
- Review WhatsApp Web connection status on mobile

### Message Delivery Issues

**Problem**: Messages not sending
- Verify WhatsApp connection is active
- Check phone number formatting (must be +55XXXXXXXXXXX)
- Review error logs in `whatsapp_error_logs` table

**Problem**: High failure rate
- Check delivery monitor in admin dashboard
- Verify phone numbers have WhatsApp accounts
- Review error categories in logs

### Database Issues

**Problem**: Session not persisting
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check database connection in Cloudflare logs
- Ensure `whatsapp_sessions` table exists

## Maintenance

### Regular Tasks

1. **Monitor delivery rates** - Check admin dashboard weekly
2. **Review error logs** - Investigate recurring errors
3. **Update templates** - Adjust message templates as needed
4. **Check connection health** - Verify automatic reconnection works

### Backup and Recovery

1. **Session backup**: Sessions are automatically backed up in database
2. **Re-authentication**: If session is lost, simply scan QR code again
3. **Message queue**: Failed messages are automatically retried

## Performance Optimization

### Cloudflare Configuration

- Enable caching for static assets
- Use Cloudflare's CDN for global distribution
- Configure appropriate timeout settings for Functions

### Database Optimization

- Regularly clean old notification records
- Index frequently queried columns
- Monitor query performance

### Scaling Considerations

- Current setup handles ~100 messages/minute
- For higher volume, consider:
  - Multiple WhatsApp sessions
  - Queue partitioning
  - Dedicated worker processes

## Support and Resources

### Documentation
- [Baileys API Documentation](https://github.com/WhiskeySockets/Baileys)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Supabase Documentation](https://supabase.com/docs)

### Monitoring URLs
- Cloudflare Dashboard: https://dash.cloudflare.com
- Supabase Dashboard: https://app.supabase.com
- Application: https://your-domain.pages.dev

## Rollback Procedure

If issues occur after deployment:

1. **Revert deployment** in Cloudflare Pages dashboard
2. **Check logs** to identify the issue
3. **Fix and redeploy** once issue is resolved

## Next Steps

After successful deployment:

1. ✅ Test end-to-end notification flow
2. ✅ Configure message templates
3. ✅ Train staff on manual notification controls
4. ✅ Set up monitoring alerts
5. ✅ Document any custom configurations
