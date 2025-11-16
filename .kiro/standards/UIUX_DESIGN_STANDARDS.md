# UI/UX Design Standards
## Coco Loko Açaiteria

> **Purpose**: Establish consistent, concise, and user-friendly design patterns across the application.

---

## Core Principles

### 1. **Concise Communication**
- Use short, direct phrases
- Remove unnecessary words
- Focus on action verbs
- Avoid redundancy

**Examples:**
- ✅ "Finalizar" instead of "Finalizar Pedido"
- ✅ "Seu Pedido" instead of "Resumo do Pedido"
- ✅ "Contato" instead of "Seus Dados"
- ✅ "Criar Pedido" instead of "Finalizar Pedido"

### 2. **Objective & Informative**
- State facts clearly
- Provide necessary context only
- Use icons to reduce text
- Keep instructions actionable

**Examples:**
- ✅ "📱 Atualizações via WhatsApp" instead of "Você receberá notificações sobre seu pedido via WhatsApp"
- ✅ "🎯 Pedido será atribuído a você" instead of "O pedido será criado e atribuído ao seu ID"

### 3. **Assistive Design**
- Guide users through processes
- Show progress clearly
- Provide helpful hints
- Use visual cues (icons, colors)

---

## Text Guidelines

### Headers & Titles
```
❌ Long: "Resumo Completo do Seu Pedido"
✅ Short: "Seu Pedido"

❌ Long: "Dados Pessoais do Cliente"
✅ Short: "Cliente" or "Contato"

❌ Long: "Finalizar e Confirmar Pedido"
✅ Short: "Finalizar"
```

### Buttons
```
❌ Verbose: "Prosseguir para a Página de Pagamento"
✅ Concise: "Ir para Pagamento"

❌ Verbose: "Confirmar e Finalizar Pedido"
✅ Concise: "Criar Pedido"

❌ Verbose: "Voltar para o Cardápio Principal"
✅ Concise: "Voltar"
```

### Notifications & Hints
```
❌ Long: "Você receberá notificações sobre o status do seu pedido através do WhatsApp"
✅ Short: "📱 Atualizações via WhatsApp"

❌ Long: "O pedido será criado e automaticamente atribuído ao seu ID de garçom"
✅ Short: "🎯 Pedido será atribuído a você"
```

### Error Messages
```
❌ Verbose: "Por favor, preencha todos os campos obrigatórios do formulário"
✅ Concise: "Preencha todos os campos"

❌ Verbose: "O número de WhatsApp informado não está no formato correto"
✅ Concise: "WhatsApp inválido (use DDD + número)"
```

---

## Visual Hierarchy

### 1. **Typography Scale**
```typescript
// Headers
h1: "text-xl sm:text-2xl font-bold"
h2: "text-lg sm:text-xl font-bold"
h3: "text-base sm:text-lg font-semibold"

// Body
body: "text-sm sm:text-base"
small: "text-xs sm:text-sm"
```

### 2. **Color System**
```typescript
// Status Colors
success: "green-500/600"
warning: "yellow-400/500"
error: "red-500/600"
info: "blue-500/600"
pending: "orange-400/500"

// Brand Colors
primary: "purple-600/700"
secondary: "cyan-600/700"
accent: "indigo-600/700"
```

### 3. **Spacing**
```typescript
// Consistent spacing scale
xs: "p-2"
sm: "p-3"
md: "p-4"
lg: "p-6"
xl: "p-8"

// Responsive: "p-4 sm:p-6"
```

---

## Component Patterns

### Cards
```tsx
// Standard card structure
<Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-6">
    <h2 className="font-bold text-lg text-white">Title</h2>
  </div>
  <div className="p-4 sm:p-6">
    {/* Content */}
  </div>
</Card>
```

### Buttons
```tsx
// Primary action
<Button className="bg-gradient-to-r from-purple-600 to-indigo-700 
                   hover:from-purple-700 hover:to-indigo-800 
                   text-white font-bold py-6 rounded-xl 
                   shadow-lg hover:shadow-xl transition-all">
  Action
</Button>

// Secondary action
<Button variant="outline" className="border-2 hover:bg-gray-50">
  Secondary
</Button>
```

### Status Indicators
```tsx
// Use icons + minimal text
✅ "🟢 Confirmado"
⏳ "🟡 Pendente"
❌ "🔴 Cancelado"
📦 "📦 Pronto"
👨‍🍳 "👨‍🍳 Preparando"
```

---

## Mobile-First Approach

### Responsive Text
```tsx
// Always provide mobile and desktop sizes
className="text-sm sm:text-base"
className="text-base sm:text-lg"
className="text-lg sm:text-xl"
```

### Touch Targets
```tsx
// Minimum 44x44px for touch
className="min-h-[44px] min-w-[44px]"
className="py-3 px-4" // Adequate padding
```

### Responsive Layout
```tsx
// Stack on mobile, row on desktop
className="flex flex-col sm:flex-row gap-3"

// Full width on mobile, auto on desktop
className="w-full sm:w-auto"
```

---

## Accessibility

### ARIA Labels
```tsx
// Always provide aria-label for icon-only buttons
<button aria-label="Remover item">
  <Minus />
</button>
```

### Color Contrast
- Ensure 4.5:1 contrast ratio for text
- Use both color AND icons for status
- Don't rely on color alone

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order
- Visible focus states

---

## Loading States

### Buttons
```tsx
{loading ? (
  <span className="flex items-center gap-2">
    <span className="animate-spin">⏳</span>
    Processando...
  </span>
) : (
  "Confirmar"
)}
```

### Pages
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
<p className="text-muted-foreground">Carregando...</p>
```

---

## Error Handling

### Inline Validation
```tsx
// Show errors immediately
{error && (
  <p className="text-xs text-red-600 mt-1">
    {error}
  </p>
)}
```

### Toast Notifications
```tsx
// Success
toast.success("Pedido criado!");

// Error
toast.error("Erro ao processar");

// Info
toast.info("Aguarde...");
```

---

## Form Design

### Labels
```tsx
// Clear, concise labels
<Label className="text-xs font-medium text-gray-600 uppercase">
  Nome
</Label>
```

### Input Fields
```tsx
<Input 
  placeholder="Digite seu nome"
  className="text-base"
  aria-label="Nome completo"
/>
```

### Validation
- Real-time validation
- Clear error messages
- Visual feedback (red border)

---

## Animation Guidelines

### Transitions
```tsx
// Smooth, subtle transitions
className="transition-all duration-300"
className="hover:scale-105 transition-transform"
```

### Loading Animations
```tsx
// Pulse for status indicators
className="animate-pulse"

// Spin for loading
className="animate-spin"
```

### Micro-interactions
```tsx
// Button press feedback
className="active:scale-95"

// Hover effects
className="hover:shadow-xl"
```

---

## Icon Usage

### Consistent Icon Set
- Use Lucide React icons
- 16px (w-4 h-4) for inline
- 20px (w-5 h-5) for buttons
- 24px (w-6 h-6) for headers

### Icon + Text Pattern
```tsx
<span className="flex items-center gap-2">
  <Icon className="w-5 h-5" />
  Text
</span>
```

---

## Progress Indicators

### Order Status
```tsx
// Visual progress with dots
<div className="flex items-center gap-2">
  <div className="w-4 h-4 rounded-full bg-green-500" />
  <div className="h-1 flex-1 bg-green-500" />
  <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
  <div className="h-1 flex-1 bg-gray-300" />
  <div className="w-4 h-4 rounded-full bg-gray-300" />
</div>
```

### Payment Status
```tsx
// Color-coded with icons
🔴 Pendente
🟢 Confirmado via PIX
🔵 Confirmado via Cartão
```

---

## Implementation Checklist

When creating or updating UI components:

- [ ] Text is concise and objective
- [ ] Mobile-first responsive design
- [ ] Adequate touch targets (44x44px min)
- [ ] ARIA labels for accessibility
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Consistent color scheme
- [ ] Smooth transitions
- [ ] Icons used appropriately
- [ ] Clear visual hierarchy

---

## Quick Reference

### Do's ✅
- Use short, action-oriented text
- Provide visual feedback
- Show progress clearly
- Use icons to reduce text
- Maintain consistent spacing
- Ensure mobile usability

### Don'ts ❌
- Avoid long explanatory text
- Don't use jargon
- Don't hide important actions
- Don't rely on color alone
- Don't use tiny touch targets
- Don't skip loading states

---

## Version History

- **v1.0** (2024-11-17): Initial design standards document
  - Established core principles
  - Defined text guidelines
  - Created component patterns
  - Set accessibility standards

---

**Last Updated**: November 17, 2024
**Maintained By**: Development Team
**Review Cycle**: Quarterly
