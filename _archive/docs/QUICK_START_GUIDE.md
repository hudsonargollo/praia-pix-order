# WhatsApp Error Logging - Quick Start Guide

## Overview
This feature adds comprehensive error tracking for WhatsApp notifications, making it easy to identify and troubleshoot notification failures.

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Cashier Page                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Pedido #5                                              │ │
│  │ 👤 Garçom • 📱 (73) 99999-9999                        │ │
│  │                                                        │ │
│  │ ⚠️ Erro na Notificação WhatsApp                       │ │
│  │    2 erros detectados                                 │ │
│  │    Clique para ver detalhes  ←─────────────┐         │ │
│  │                                             │         │ │
│  │ [Editar] [Cancelar]                        │         │ │
│  └────────────────────────────────────────────┼─────────┘ │
└─────────────────────────────────────────────────┼───────────┘
                                                  │
                                                  │ Click
                                                  ↓
┌─────────────────────────────────────────────────────────────┐
│              WhatsApp Admin - Log de Erros                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Filtros:                                               │ │
│  │ [Últimas 24h ▼] [Todas ▼] [Todas ▼]                  │ │
│  │                                                        │ │
│  │ Estatísticas:                                         │ │
│  │ Total: 5  |  Críticos: 2  |  Altos: 1  |  Retentáveis: 3│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⚠️ [Alto] [Entrega de Mensagem] [Retentável]         │ │
│  │                                                        │ │
│  │ Phone number does not have WhatsApp                   │ │
│  │                                                        │ │
│  │ 16/11/2025, 09:47:22 • Pedido: #5 • Tel: (73) 99999  │ │
│  │                                              [👁️ Ver] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔴 [Crítico] [Autenticação]                           │ │
│  │                                                        │ │
│  │ WhatsApp session expired                              │ │
│  │                                                        │ │
│  │ 16/11/2025, 09:30:15                         [👁️ Ver] │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Setup Steps

### 1. Run Database Migration
```bash
cd /path/to/project
npx supabase db reset
```

This creates the necessary tables:
- `whatsapp_error_logs` - Stores all error logs
- `whatsapp_alerts` - Stores system alerts

### 2. Verify Installation
Navigate to: `http://localhost:8080/whatsapp-admin`

You should see two tabs:
- **Visão Geral** - Connection status and stats
- **Log de Erros** - Error log viewer (NEW!)

### 3. Test the Feature

#### Option A: Trigger a Real Error
1. Go to Cashier page
2. Try to send a notification to an invalid phone number
3. Check for red error banner on the order card
4. Click the banner to view error details

#### Option B: Simulate an Error (for testing)
```typescript
// In browser console on any page
import { errorLogger } from '@/integrations/whatsapp/error-logger';

await errorLogger.logError(
  new Error('Test error message'),
  {
    operation: 'test_notification',
    orderId: 'test-order-id',
    customerPhone: '+5511999999999',
    additionalData: { test: true }
  }
);
```

## Using the Feature

### For Cashiers

**When you see an error:**
1. Look for red warning banner on order cards
2. Banner shows: "⚠️ Erro na Notificação WhatsApp"
3. Click anywhere on the banner
4. You'll be taken to the error log viewer

**What to do:**
- Check if it's a critical error (red badge)
- If retryable, the system will auto-retry
- If persistent, notify admin

### For Administrators

**Accessing Error Logs:**
1. Navigate to `/whatsapp-admin`
2. Click "Log de Erros" tab
3. Use filters to narrow down errors

**Filter Options:**
- **Time Range**: 1h, 24h, 7d, 30d
- **Severity**: Critical, High, Medium, Low
- **Category**: Connection, Authentication, Message Delivery, etc.

**Viewing Error Details:**
1. Click on any error card
2. View full error message
3. See stack trace (if available)
4. Check context and metadata

**Understanding Severity:**
- 🔴 **Critical**: Requires immediate attention (auth, config)
- 🟠 **High**: Affects service (connection issues)
- 🟡 **Medium**: Individual failures (delivery, rate limits)
- 🔵 **Low**: Expected errors (phone validation)

## Common Error Scenarios

### 1. Phone Number Invalid
- **Category**: phone_validation
- **Severity**: Low
- **Action**: Verify customer phone number format

### 2. WhatsApp Not Connected
- **Category**: connection
- **Severity**: High
- **Action**: Reconnect WhatsApp in admin panel

### 3. Session Expired
- **Category**: authentication
- **Severity**: Critical
- **Action**: Scan QR code again to reconnect

### 4. Rate Limit Exceeded
- **Category**: rate_limit
- **Severity**: Medium
- **Action**: Wait and retry, system will auto-retry

### 5. Message Delivery Failed
- **Category**: message_delivery
- **Severity**: Medium
- **Action**: Check if customer has WhatsApp, verify number

## Troubleshooting

### Error logs not showing?
1. Check database migration ran successfully
2. Verify RLS policies are enabled
3. Check browser console for errors

### Errors not being logged?
1. Verify error logger is imported in notification triggers
2. Check Supabase connection
3. Review service role permissions

### Can't click error banner?
1. Clear browser cache
2. Check for JavaScript errors in console
3. Verify route `/whatsapp-admin` is accessible

## Privacy & Security

✅ **What IS logged:**
- Error messages and stack traces
- Order IDs and phone numbers
- Error categories and severity
- Timestamps and attempt counts

❌ **What is NOT logged:**
- Message content
- Customer personal data (beyond phone)
- Sensitive authentication tokens
- Payment information

## Support

For issues or questions:
1. Check error log viewer for patterns
2. Review `WHATSAPP_ERROR_LOGGING.md` for details
3. Check browser console for client-side errors
4. Review Supabase logs for server-side errors
