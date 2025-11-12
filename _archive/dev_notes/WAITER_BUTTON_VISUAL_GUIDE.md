# Waiter Dashboard - Visual Guide to "Novo Pedido" Button

## What You Should See

### 1. Waiter Dashboard Header
```
┌─────────────────────────────────────────────────────────────┐
│  🥥 Logo  Dashboard do Garçom              🔧  Sair         │
│           Bem-vindo, [Name] • Sistema de Vendas             │
└─────────────────────────────────────────────────────────────┘
```
- Orange/red gradient background
- Logo on left
- 🔧 (diagnostic) button and "Sair" (logout) button on right

### 2. "Criar Novo Pedido" Card (Main Feature)
```
┌─────────────────────────────────────────────────────────────┐
│  🛒  Criar Novo Pedido                    ┌──────────────┐  │
│      Comece a atender um novo cliente     │ Novo Pedido  │  │
│                                            └──────────────┘  │
│  Abra o cardápio digital para fazer um                      │
│  pedido personalizado para o cliente                        │
└─────────────────────────────────────────────────────────────┘
```
**Visual Characteristics:**
- **Background:** Green gradient (emerald to teal)
- **Text Color:** White
- **Button:** White background with green text
- **Icon:** Shopping cart (🛒)
- **Position:** First card below header
- **Size:** Full width, prominent

### 3. Stats Cards (Below "Novo Pedido")
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total Vendas │  │  Comissões   │  │ Performance  │
│   R$ X,XX    │  │   R$ X,XX    │  │   R$ X,XX    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 4. Orders History Table
```
┌─────────────────────────────────────────────────────────────┐
│  🛒 Histórico de Pedidos                                    │
├─────────────────────────────────────────────────────────────┤
│  ID  │ Cliente │ Data │ Total │ Comissão │ Status │ Ações  │
├─────────────────────────────────────────────────────────────┤
│  ... │   ...   │ ...  │  ...  │   ...    │  ...   │  ...   │
└─────────────────────────────────────────────────────────────┘
```

## Button Details

### Desktop View
- Button appears on the **right side** of the green card
- Text: "Novo Pedido"
- Icon: Shopping cart on the left of text
- Size: Large (lg)
- Colors:
  - Background: White
  - Text: Green (#059669)
  - Hover: Light gray background

### Mobile View
- Button appears **below** the description text
- Full width
- Same styling as desktop

## Color Scheme

### "Criar Novo Pedido" Card
- **Primary:** `from-green-500 via-emerald-500 to-teal-600`
- **Accent:** White with 20% opacity for icon background
- **Text:** White
- **Button Background:** White
- **Button Text:** Green-600

### Visual Hierarchy
1. **Most Prominent:** Green "Criar Novo Pedido" card
2. **Secondary:** Three stats cards
3. **Tertiary:** Orders history table

## Responsive Breakpoints

### Mobile (< 640px)
```
┌─────────────────────────┐
│  🛒  Criar Novo Pedido  │
│      Comece a atender   │
│                         │
│  Abra o cardápio...     │
│                         │
│  ┌───────────────────┐  │
│  │   Novo Pedido     │  │
│  └───────────────────┘  │
└─────────────────────────┘
```
- Button is full width
- Stacked layout

### Tablet/Desktop (≥ 640px)
```
┌─────────────────────────────────────────────┐
│  🛒  Criar Novo Pedido    ┌──────────────┐  │
│      Comece a atender     │ Novo Pedido  │  │
│                           └──────────────┘  │
│  Abra o cardápio...                         │
└─────────────────────────────────────────────┘
```
- Button on right side
- Horizontal layout

## Interactive States

### Normal State
- White button with green text
- Subtle shadow

### Hover State
- Background changes to light gray
- Shadow increases
- Slight scale up (1.05x)
- Smooth transition (300ms)

### Click State
- Console log: `🛒 Novo Pedido button clicked, navigating to /menu`
- Navigates to `/menu` page

## Diagnostic Button (🔧)

### Location
- Top right corner of header
- Next to "Sair" button

### Function
- Navigates to `/waiter-diagnostic`
- Shows system health checks

### Visual
```
┌──────────────────────────────────┐
│  Logo  Dashboard    🔧  Sair     │
└──────────────────────────────────┘
                      ↑
                   Click here
```

## Expected User Flow

1. **Login** → `/auth`
2. **Redirect** → `/waiter-dashboard`
3. **See** → Green "Criar Novo Pedido" card
4. **Click** → "Novo Pedido" button
5. **Navigate** → `/menu` page
6. **Browse** → Menu items
7. **Add** → Items to cart
8. **Checkout** → Complete order

## Troubleshooting Visual Issues

### Button Not Visible
**Check:**
1. Scroll to top of page
2. Look for green card (should be first element)
3. Check if page is fully loaded
4. Inspect element in DevTools

### Button Appears But Different
**Possible Issues:**
1. CSS not loaded properly
2. Custom browser extensions interfering
3. Zoom level affecting layout
4. Browser compatibility issue

### Card Missing Entirely
**Possible Issues:**
1. JavaScript error preventing render
2. Component not mounting
3. Authentication issue
4. Browser cache showing old version

## Browser Console Checks

### Check if Element Exists
```javascript
// Should return the button element
document.querySelector('[data-testid="new-order-button"]')
```

### Check if Element is Visible
```javascript
const btn = document.querySelector('[data-testid="new-order-button"]');
const rect = btn.getBoundingClientRect();
console.log('Button position:', rect);
console.log('Is visible:', rect.width > 0 && rect.height > 0);
```

### Check Computed Styles
```javascript
const btn = document.querySelector('[data-testid="new-order-button"]');
const styles = window.getComputedStyle(btn);
console.log('Display:', styles.display);
console.log('Visibility:', styles.visibility);
console.log('Opacity:', styles.opacity);
console.log('Z-index:', styles.zIndex);
```

## Accessibility

### Keyboard Navigation
- Button is focusable with Tab key
- Can be activated with Enter or Space

### Screen Readers
- Button has descriptive text: "Novo Pedido"
- Icon has aria-label (implicit from Lucide React)

### Touch Targets
- Button meets minimum size requirements (44x44px)
- Adequate spacing around button

## Performance

### Load Time
- Component should render within 1-2 seconds
- Button should be interactive immediately

### Animation
- Smooth hover transition (300ms)
- Scale animation on hover (1.05x)
- No janky animations

## Summary

The "Novo Pedido" button is:
- ✅ **Prominent:** Large green card at top of dashboard
- ✅ **Visible:** White button with green text
- ✅ **Accessible:** Keyboard and screen reader friendly
- ✅ **Responsive:** Works on all screen sizes
- ✅ **Interactive:** Smooth hover and click animations
- ✅ **Functional:** Navigates to menu page

If you don't see this button, follow the troubleshooting steps in `WAITER_BUTTON_TEST.md`.
