# WhatsApp Error Logging - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Interface Layer                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐         ┌──────────────────────────┐     │
│  │   Cashier Page       │         │  WhatsApp Admin Page     │     │
│  │  /cashier            │         │  /whatsapp-admin         │     │
│  ├──────────────────────┤         ├──────────────────────────┤     │
│  │                      │         │  ┌────────────────────┐  │     │
│  │  Order Cards         │         │  │ Visão Geral Tab    │  │     │
│  │  ┌────────────────┐  │         │  └────────────────────┘  │     │
│  │  │ Order #5       │  │         │  ┌────────────────────┐  │     │
│  │  │ ⚠️ Error Banner│◄─┼─────────┼─►│ Log de Erros Tab   │  │     │
│  │  │ (clickable)    │  │         │  │                    │  │     │
│  │  └────────────────┘  │         │  │ - Filters          │  │     │
│  │                      │         │  │ - Statistics       │  │     │
│  └──────────────────────┘         │  │ - Error List       │  │     │
│                                    │  │ - Detail Dialog    │  │     │
│                                    │  └────────────────────┘  │     │
│                                    └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Component Layer                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────┐    ┌──────────────────────────────┐  │
│  │ WhatsAppErrorIndicator   │    │ WhatsAppErrorLogViewer       │  │
│  │                          │    │                              │  │
│  │ - Shows error count      │    │ - Time range filter          │  │
│  │ - Displays severity      │    │ - Severity filter            │  │
│  │ - Navigates to logs      │    │ - Category filter            │  │
│  └──────────────────────────┘    │ - Statistics display         │  │
│                                   │ - Error cards                │  │
│                                   │ - Detail dialog              │  │
│                                   └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Hook Layer                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────┐    ┌──────────────────────────────┐  │
│  │ useWhatsAppErrors        │    │ useAllWhatsAppErrors         │  │
│  │                          │    │                              │  │
│  │ - Fetch errors by order  │    │ - Fetch all errors           │  │
│  │ - Real-time updates      │    │ - Apply filters              │  │
│  │ - Return error map       │    │ - Return error list          │  │
│  └──────────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Integration Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Error Logger Service                       │  │
│  │                                                               │  │
│  │  - logError(error, context)                                  │  │
│  │  - categorizeError(error)                                    │  │
│  │  - determineSeverity(category, error)                        │  │
│  │  - sanitizeContext(context)                                  │  │
│  │  - getErrorStats(since)                                      │  │
│  │  - getOrderErrors(orderId)                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────┐  ┌────────────────────┐                    │
│  │ Notification       │  │ Queue Manager      │                    │
│  │ Triggers           │  │                    │                    │
│  │                    │  │ - Process queue    │                    │
│  │ - onPaymentConfirm │  │ - Send messages    │                    │
│  │ - onOrderPreparing │  │ - Handle retries   │                    │
│  │ - onOrderReady     │  │ - Log errors ──────┼──┐                │
│  │ - Log errors ──────┼──┼────────────────────┘  │                │
│  └────────────────────┘  └────────────────────┘  │                │
│                                                    │                │
│                                                    ↓                │
│                                          ┌─────────────────┐       │
│                                          │ Error Logger    │       │
│                                          └─────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Database Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Supabase PostgreSQL                        │  │
│  │                                                               │  │
│  │  ┌────────────────────────┐  ┌────────────────────────┐     │  │
│  │  │ whatsapp_error_logs    │  │ whatsapp_alerts        │     │  │
│  │  │                        │  │                        │     │  │
│  │  │ - id                   │  │ - id                   │     │  │
│  │  │ - category             │  │ - alert_type           │     │  │
│  │  │ - severity             │  │ - category             │     │  │
│  │  │ - error_message        │  │ - message              │     │  │
│  │  │ - error_stack          │  │ - metadata             │     │  │
│  │  │ - context              │  │ - created_at           │     │  │
│  │  │ - order_id             │  │                        │     │  │
│  │  │ - customer_phone       │  │                        │     │  │
│  │  │ - notification_id      │  │                        │     │  │
│  │  │ - is_retryable         │  │                        │     │  │
│  │  │ - created_at           │  │                        │     │  │
│  │  └────────────────────────┘  └────────────────────────┘     │  │
│  │                                                               │  │
│  │  Indexes:                                                     │  │
│  │  - idx_whatsapp_error_logs_order_id                          │  │
│  │  - idx_whatsapp_error_logs_created_at                        │  │
│  │  - idx_whatsapp_error_logs_category                          │  │
│  │  - idx_whatsapp_error_logs_severity                          │  │
│  │                                                               │  │
│  │  RLS Policies:                                                │  │
│  │  - Allow authenticated users to read                          │  │
│  │  - Allow service role to insert                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Error Logging Flow

```
┌─────────────────┐
│ WhatsApp Error  │
│ Occurs          │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ Error Caught in:                    │
│ - Notification Triggers             │
│ - Queue Manager                     │
│ - Evolution Client                  │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ errorLogger.logError()              │
│                                     │
│ 1. Categorize error                 │
│ 2. Determine severity               │
│ 3. Sanitize context                 │
│ 4. Check if retryable               │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ Store in Database                   │
│ - whatsapp_error_logs table         │
│ - Indexed for fast queries          │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ Display in UI                       │
│ - Cashier page (error indicator)    │
│ - Admin page (error log viewer)     │
└─────────────────────────────────────┘
```

### User Interaction Flow

```
┌─────────────────┐
│ Cashier views   │
│ order with      │
│ error           │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ Red warning banner displayed        │
│ "⚠️ Erro na Notificação WhatsApp"  │
│ "2 erros detectados"                │
│ "Clique para ver detalhes"          │
└────────┬────────────────────────────┘
         │
         ↓ (click)
┌─────────────────────────────────────┐
│ Navigate to:                        │
│ /whatsapp-admin?orderId=XXX         │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ Error Log Viewer                    │
│ - Filtered by order ID              │
│ - Shows all errors for order        │
└────────┬────────────────────────────┘
         │
         ↓ (click error)
┌─────────────────────────────────────┐
│ Error Detail Dialog                 │
│ - Full error message                │
│ - Stack trace                       │
│ - Context                           │
│ - Metadata                          │
└─────────────────────────────────────┘
```

## Component Relationships

```
WhatsAppAdmin
├── Tabs
│   ├── Overview Tab
│   │   ├── Connection Status
│   │   ├── Statistics Cards
│   │   └── Action Buttons
│   └── Error Log Tab
│       └── WhatsAppErrorLogViewer
│           ├── Filters
│           │   ├── Time Range Select
│           │   ├── Severity Select
│           │   └── Category Select
│           ├── Statistics Card
│           ├── Error List
│           │   └── Error Cards (clickable)
│           └── Error Detail Dialog
│               ├── Severity Badge
│               ├── Category Badge
│               ├── Error Message
│               ├── Metadata
│               ├── Context JSON
│               └── Stack Trace

Cashier
├── Order Tabs
│   ├── Pending Tab
│   ├── In Progress Tab
│   │   └── Order Cards
│   │       ├── Order Info
│   │       ├── WhatsAppErrorIndicator (if errors)
│   │       └── Action Buttons
│   ├── Ready Tab
│   │   └── Order Cards
│   │       ├── Order Info
│   │       ├── WhatsAppErrorIndicator (if errors)
│   │       └── Action Buttons
│   ├── Completed Tab
│   └── Cancelled Tab
```

## Security & Privacy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Authentication                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Supabase Auth                                    │     │
│  │ - Protected Routes (admin, cashier)                │     │
│  │ - JWT tokens                                       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 2: Authorization (RLS)                                │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Authenticated users can read error logs          │     │
│  │ - Service role can insert error logs               │     │
│  │ - No public access                                 │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 3: Data Sanitization                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Message content NEVER logged                     │     │
│  │ - Context sanitized before storage                 │     │
│  │ - Sensitive fields removed                         │     │
│  │ - Phone numbers encrypted in transit               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 4: UI Protection                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - No sensitive data in URLs                        │     │
│  │ - Error details in dialogs (not exposed)           │     │
│  │ - Stack traces only for admins                     │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Optimizations                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Database Level:                                             │
│  - Indexes on frequently queried columns                     │
│  - Limit queries to 100 results                              │
│  - Time-based filtering reduces dataset                      │
│                                                               │
│  Application Level:                                          │
│  - React hooks with proper dependencies                      │
│  - Lazy loading of error details                             │
│  - Debounced filter changes                                  │
│  - Memoized components                                       │
│                                                               │
│  UI Level:                                                   │
│  - Virtualized lists for large datasets (future)            │
│  - Pagination (future enhancement)                           │
│  - Loading states for better UX                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```
