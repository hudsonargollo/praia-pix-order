# UI/UX Improvements Specification

## Issues to Fix

### 1. Kitchen - "Finalizar Pedido" Button
**Current**: Button stays enabled after clicking
**Expected**: 
- Button disabled after click
- Text changes to "PEDIDO FINALIZADO"
- Visual indication (different color/style)

### 2. Real-time Updates
**Current**: Page needs refresh to see status changes
**Expected**:
- Kitchen sees orders move between columns automatically
- Cashier sees orders move between tabs automatically
- No page refresh needed

### 3. Custom WhatsApp Message
**Current**: Not working
**Expected**:
- Cashier can send custom message
- Message sends via Evolution API
- Success/error feedback

### 4. Cross-Panel Status Sync
**Current**: Kitchen and Cashier don't sync
**Expected**:
- Kitchen marks ready → Cashier sees it in "Prontos" tab
- Cashier marks completed → Kitchen sees "FINALIZADO"
- Real-time sync via Supabase subscriptions

### 5. Action Button States
**Current**: Buttons stay enabled after action
**Expected**:
- "Marcar como Pronto" → Disabled, shows "PRONTO"
- "Notificar Pronto" → Disabled after sending
- "Marcar como Entregue" → Disabled, shows "ENTREGUE"

## Implementation Plan

### Phase 1: Fix Real-time Subscriptions
- Ensure Kitchen useRealtimeOrders is working
- Ensure Cashier useRealtimeOrders is working
- Test cross-panel updates

### Phase 2: Update Kitchen UI
- Add loading states to buttons
- Disable buttons after actions
- Show completion status
- Update button text based on order status

### Phase 3: Update Cashier UI
- Add loading states
- Disable buttons after actions
- Show status labels
- Fix custom message dialog

### Phase 4: Fix Custom WhatsApp
- Debug why custom message isn't sending
- Ensure it uses Evolution API proxy
- Add proper error handling

## Files to Modify

1. `src/pages/Kitchen.tsx` - Button states and real-time updates
2. `src/pages/Cashier.tsx` - Button states and custom message
3. `src/components/NotificationControls.tsx` - Custom message component
4. `src/integrations/whatsapp/service.ts` - Custom message sending

## Testing Checklist

- [ ] Kitchen: Mark as ready → Order moves to "Prontos"
- [ ] Kitchen: Order shows "PRONTO" after marking
- [ ] Cashier: Sees order in "Prontos" tab immediately
- [ ] Cashier: Can send custom message
- [ ] Cashier: Mark as delivered → Order shows "ENTREGUE"
- [ ] Kitchen: Sees "FINALIZADO" for completed orders
- [ ] No page refresh needed for any updates
