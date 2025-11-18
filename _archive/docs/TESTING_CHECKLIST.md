# WhatsApp Error Logging - Testing Checklist

## Pre-Testing Setup

- [ ] Database migration has been run successfully
  ```bash
  npx supabase db reset
  ```
- [ ] Application is running on `http://localhost:8080`
- [ ] You have admin credentials to access `/whatsapp-admin`
- [ ] You have cashier credentials to access `/cashier`

## Database Tests

### 1. Verify Tables Created
- [ ] Open Supabase Studio
- [ ] Check `whatsapp_error_logs` table exists
- [ ] Check `whatsapp_alerts` table exists
- [ ] Verify indexes are created
- [ ] Verify RLS policies are enabled

### 2. Test RLS Policies
- [ ] Authenticated users can read error logs
- [ ] Service role can insert error logs
- [ ] Unauthenticated users cannot access logs

## Component Tests

### 3. WhatsApp Admin Page
- [ ] Navigate to `/whatsapp-admin`
- [ ] Page loads without errors
- [ ] Two tabs are visible: "Visão Geral" and "Log de Erros"
- [ ] Can switch between tabs
- [ ] "Log de Erros" tab shows error log viewer

### 4. Error Log Viewer
- [ ] Time range filter works (1h, 24h, 7d, 30d)
- [ ] Severity filter works (All, Critical, High, Medium, Low)
- [ ] Category filter works (All categories)
- [ ] Statistics display correctly (Total, Critical, High, Retryable)
- [ ] Error cards display with correct styling
- [ ] Clicking error card opens detail dialog
- [ ] Detail dialog shows all error information
- [ ] Refresh button works

### 5. Error Detail Dialog
- [ ] Shows severity badge
- [ ] Shows category badge
- [ ] Shows "Retentável" badge if applicable
- [ ] Displays error message
- [ ] Shows timestamp
- [ ] Shows order ID (if available)
- [ ] Shows customer phone (if available)
- [ ] Shows context JSON
- [ ] Shows stack trace (if available)
- [ ] Can close dialog

### 6. Cashier Page Integration
- [ ] Navigate to `/cashier`
- [ ] Page loads without errors
- [ ] Orders display normally
- [ ] No errors shown when no WhatsApp errors exist

### 7. Error Indicator on Orders
**Note**: This requires an order with WhatsApp errors

- [ ] Red warning banner appears on orders with errors
- [ ] Banner shows "⚠️ Erro na Notificação WhatsApp"
- [ ] Banner shows error count
- [ ] Banner shows "Clique para ver detalhes"
- [ ] Banner is clickable
- [ ] Clicking banner navigates to `/whatsapp-admin?orderId=XXX`
- [ ] Error log viewer filters by order ID
- [ ] Can clear order filter

## Integration Tests

### 8. Error Logging from Notification Triggers
- [ ] Create a test order
- [ ] Trigger payment confirmation notification
- [ ] If error occurs, check it's logged in database
- [ ] Error appears in error log viewer
- [ ] Error shows on order card in cashier page

### 9. Error Logging from Queue Manager
- [ ] Queue a notification with invalid phone number
- [ ] Check error is logged in database
- [ ] Error appears in error log viewer
- [ ] Error context includes order ID and phone

### 10. Error Categories
Test that errors are correctly categorized:
- [ ] Connection errors → `connection` category
- [ ] Authentication errors → `authentication` category
- [ ] Phone validation errors → `phone_validation` category
- [ ] Message delivery errors → `message_delivery` category
- [ ] Rate limit errors → `rate_limit` category

### 11. Severity Levels
Test that errors are correctly assigned severity:
- [ ] Authentication errors → `critical` severity
- [ ] Configuration errors → `critical` severity
- [ ] Connection errors → `high` severity
- [ ] Message delivery errors → `medium` severity
- [ ] Phone validation errors → `low` severity

## User Experience Tests

### 12. Cashier Workflow
- [ ] Cashier can see orders with errors
- [ ] Error indicator is clear and noticeable
- [ ] Clicking error is intuitive
- [ ] Navigation to error log is smooth
- [ ] Can return to cashier page easily

### 13. Admin Workflow
- [ ] Admin can access error log viewer
- [ ] Filters are easy to use
- [ ] Error details are comprehensive
- [ ] Can identify patterns in errors
- [ ] Statistics help understand error trends

### 14. Mobile Responsiveness
- [ ] Error log viewer works on mobile
- [ ] Filters are accessible on mobile
- [ ] Error cards are readable on mobile
- [ ] Detail dialog works on mobile
- [ ] Error indicator on cashier page works on mobile

## Performance Tests

### 15. Load Testing
- [ ] Error log viewer loads quickly with 0 errors
- [ ] Error log viewer loads quickly with 10 errors
- [ ] Error log viewer loads quickly with 100 errors
- [ ] Filtering is responsive
- [ ] No lag when switching tabs

### 16. Real-time Updates
- [ ] New errors appear without refresh (if real-time enabled)
- [ ] Error count updates correctly
- [ ] Statistics update correctly

## Edge Cases

### 17. Empty States
- [ ] Shows "Nenhum erro encontrado" when no errors
- [ ] Shows appropriate message when filters return no results
- [ ] Shows loading state while fetching errors

### 18. Error Handling
- [ ] Handles database connection errors gracefully
- [ ] Shows error message if error log fetch fails
- [ ] Doesn't break page if error detail fetch fails

### 19. Data Validation
- [ ] Handles missing order ID gracefully
- [ ] Handles missing customer phone gracefully
- [ ] Handles missing error stack gracefully
- [ ] Handles malformed context JSON gracefully

## Security Tests

### 20. Access Control
- [ ] Unauthenticated users cannot access `/whatsapp-admin`
- [ ] Non-admin users cannot access error logs
- [ ] Error logs don't expose sensitive data
- [ ] Message content is never logged

### 21. Privacy Compliance
- [ ] Customer phone numbers are displayed but not exposed in URLs
- [ ] No message content in error logs
- [ ] Context is sanitized properly
- [ ] Stack traces don't contain sensitive data

## Documentation Tests

### 22. Documentation Accuracy
- [ ] `WHATSAPP_ERROR_LOGGING.md` is accurate
- [ ] `QUICK_START_GUIDE.md` steps work
- [ ] `IMPLEMENTATION_SUMMARY.md` is complete
- [ ] Code comments are clear

## Cleanup Tests

### 23. Data Management
- [ ] Old error logs can be cleaned up (30+ days)
- [ ] Cleanup doesn't affect recent logs
- [ ] Database performance remains good with many logs

## Final Checks

- [ ] No console errors in browser
- [ ] No TypeScript errors in code
- [ ] All diagnostics pass
- [ ] Feature works end-to-end
- [ ] User experience is smooth
- [ ] Documentation is complete

## Test Results

**Date Tested**: _______________
**Tested By**: _______________
**Environment**: _______________

**Overall Result**: 
- [ ] ✅ All tests passed
- [ ] ⚠️ Some tests failed (document below)
- [ ] ❌ Major issues found (document below)

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
