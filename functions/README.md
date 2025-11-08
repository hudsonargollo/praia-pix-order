# Cloudflare Functions for WhatsApp Integration

This directory contains Cloudflare Pages Functions that handle WhatsApp integration using the Baileys API.

## Structure

```
functions/
├── api/
│   ├── whatsapp/
│   │   ├── connection.js       # Main WhatsApp connection handler
│   │   └── session-manager.js  # Session persistence and encryption
│   └── mercadopago/
│       ├── create-payment.js   # Payment creation
│       └── check-payment.js    # Payment status checking
├── package.json                # Function dependencies
└── README.md                   # This file
```

## WhatsApp Functions

### `/api/whatsapp/connection`

Main endpoint for WhatsApp connection management and message sending.

#### Endpoints

**GET `/api/whatsapp/connection?action=status`**
- Returns current connection status
- Response: `{ isConnected, connectionState, qrCode, phoneNumber, monitoring }`

**GET `/api/whatsapp/connection?action=connect`**
- Initiates WhatsApp connection
- Generates QR code if not authenticated
- Response: Connection status with QR code if needed

**POST `/api/whatsapp/connection?action=disconnect`**
- Disconnects WhatsApp session
- Response: `{ success: true }`

**POST `/api/whatsapp/connection?action=send`**
- Sends a WhatsApp message
- Body: `{ to: "+5511999999999", message: "Hello" }`
- Response: `{ success: true, messageId: "..." }`

**GET `/api/whatsapp/connection?action=health`**
- Performs health check on connection
- Response: `{ status: "healthy", monitoring: {...} }`

**GET `/api/whatsapp/connection?action=retry`**
- Manually triggers reconnection attempt
- Response: `{ success: true, message: "..." }`

**POST `/api/whatsapp/connection?action=reset`**
- Resets connection and clears session
- Requires re-authentication with QR code
- Response: `{ success: true, message: "..." }`

### `/api/whatsapp/session-manager`

Internal module for session persistence and encryption. Not directly accessible as an endpoint.

#### Features
- AES-256-GCM encryption for session data
- Database persistence in Supabase
- Automatic session restoration
- Secure key management

## Dependencies

The functions require these npm packages:

- `@whiskeysockets/baileys` - WhatsApp Web API
- `@supabase/supabase-js` - Database client
- `@hapi/boom` - Error handling

These are automatically installed during deployment.

## Environment Variables

Required environment variables (set in Cloudflare Dashboard):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WHATSAPP_ENCRYPTION_KEY=your-64-char-hex-key
WHATSAPP_SESSION_ID=coco-loko-main
```

## Local Development

### Setup

1. Install dependencies:
```bash
cd functions
npm install
```

2. Set environment variables in root `.env` file

3. Run Cloudflare Pages locally:
```bash
cd ..
npm run dev
```

The functions will be available at:
- `http://localhost:8080/api/whatsapp/connection`

### Testing Functions Locally

Test connection status:
```bash
curl http://localhost:8080/api/whatsapp/connection?action=status
```

Test message sending:
```bash
curl -X POST http://localhost:8080/api/whatsapp/connection?action=send \
  -H "Content-Type: application/json" \
  -d '{"to": "+5511999999999", "message": "Test message"}'
```

## Deployment

Functions are automatically deployed with your Cloudflare Pages project.

### Automatic Deployment

1. Push code to GitHub
2. Cloudflare automatically builds and deploys
3. Functions are available at your Pages URL

### Manual Deployment

```bash
# From project root
npm run build
wrangler pages deploy dist --project-name=coco-loko-acaiteria
```

## Monitoring

### Connection Monitoring

The connection manager includes:
- Automatic health checks every 30 seconds
- Heartbeat tracking
- Automatic reconnection with exponential backoff
- Connection state tracking

### Logs

View logs in Cloudflare Dashboard:
1. Go to Pages → Your Project
2. Click on "Functions" tab
3. View real-time logs and errors

### Error Handling

All errors are:
- Logged to console (visible in Cloudflare logs)
- Stored in `whatsapp_error_logs` table
- Returned in API responses with appropriate status codes

## Security

### Session Encryption

- Session data encrypted with AES-256-GCM
- Encryption key stored in environment variables
- IV (Initialization Vector) generated per encryption
- Authentication tag included for integrity

### Access Control

- Functions use Supabase service role key for database access
- No authentication required for status endpoint (read-only)
- Send/disconnect/reset actions should be protected by frontend auth

### Best Practices

1. Never commit encryption keys to version control
2. Rotate encryption keys periodically
3. Monitor for unusual activity patterns
4. Implement rate limiting if needed
5. Keep dependencies updated

## Troubleshooting

### Connection Issues

**Problem**: QR code not generating
- Check Baileys version is compatible
- Verify environment variables are set
- Check Cloudflare Functions logs

**Problem**: Connection keeps disconnecting
- Review health check logs
- Verify encryption key is consistent
- Check database connectivity

### Message Sending Issues

**Problem**: Messages not sending
- Verify connection is active (check status endpoint)
- Validate phone number format (+55XXXXXXXXXXX)
- Check recipient has WhatsApp account

**Problem**: High latency
- Check Cloudflare Functions performance metrics
- Review database query performance
- Consider connection pooling

### Database Issues

**Problem**: Session not persisting
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check `whatsapp_sessions` table exists
- Review database logs for errors

## Performance

### Metrics

- Average response time: <500ms
- Message sending: <2s
- Health check: <100ms
- Session save: <300ms

### Optimization

- Session data cached in memory
- Database queries optimized with indexes
- Connection reused across requests
- Minimal encryption overhead

## Support

For issues or questions:
1. Check Cloudflare Functions logs
2. Review `whatsapp_error_logs` table
3. Consult main documentation: `PRODUCTION_DEPLOYMENT.md`
4. Check Baileys documentation: https://github.com/WhiskeySockets/Baileys
