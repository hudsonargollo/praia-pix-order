# Design Document - Header Standardization

## Overview

This design creates a unified header component that can be used across all pages in the application. The header will feature the Coco Loko logo, action buttons, connection status, and logout functionality, replacing the inconsistent header designs currently in use.

## Current State Analysis

### Pages with Modern Header ✅
- **Cashier** (`/cashier`) - Has logo, action buttons, connection status, logout
- **WaiterDashboard** (`/waiter-dashboard`) - Has logo, action buttons, logout
- **Admin** (`/admin`) - Has logo and logout

### Pages with Legacy Header ❌
- **Gestão de Garçons** (`/waiter-management`) - Old purple/blue gradient, back arrow, centered title
- **Reports** (`/reports`) - Blue gradient with "Voltar ao Caixa" button
- **AdminProducts** (`/admin/products`) - Purple gradient with back arrow and + button

### Pages Needing Review
- **AdminWaiterReports** - Check current header
- **WhatsAppAdmin** - Check current header

## Standardized Header Design

### Desktop Layout
```
┌────────────────────────────────────────────────────────────────┐
│  [Logo]  [Reports] [Products] [WhatsApp]    [Online] [Logout]  │
│   🥥                                          🟢                 │
└────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌────────────────────────────────────────────────────────────┐
│  [Logo]                              [Online] [Logout]     │
│   🥥                                  🟢       →           │
│                                                            │
│  [📊] [📦] [💬]                                            │
└────────────────────────────────────────────────────────────┘
```

### Gestão de Garçons - Before & After

**Before (Legacy):**
```
┌────────────────────────────────────────────────────────┐
│  ←    [Logo]    Gestão de Garçons    🔄    +          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**After (Standardized):**
```
┌────────────────────────────────────────────────────────┐
│  [Logo]  [Reports] [Products] [WhatsApp]  [Online] [Logout] │
│   🥥                                       🟢              │
│                                                            │
│  [🔄 Atualizar] [+ Novo Garçom]                           │
└────────────────────────────────────────────────────────────┘

Page Content:
┌────────────────────────────────────────────────────────┐
│  Gestão de Garçons                                     │
│  Gerencie sua equipe de garçons                        │
│                                                        │
│  [Waiter cards...]                                     │
└────────────────────────────────────────────────────────┘
```

## Component Architecture

### Shared Header Component

```typescript
interface HeaderProps {
  // Page identification
  pageName?: string
  
  // Action buttons (optional)
  actions?: HeaderAction[]
  
  // Show/hide elements
  showConnectionStatus?: boolean
  showActionButtons?: boolean
  showLogout?: boolean
  
  // Custom content
  customContent?: React.ReactNode
  
  // Navigation
  onBack?: () => void
  backLabel?: string
}

interface HeaderAction {
  label: string
  icon: React.ComponentType
  onClick: () => void
  mobileOnly?: boolean
  desktopOnly?: boolean
}

const AppHeader: React.FC<HeaderProps> = ({
  pageName,
  actions = [],
  showConnectionStatus = true,
  showActionButtons = true,
  showLogout = true,
  customContent,
  onBack,
  backLabel
}) => {
  const navigate = useNavigate()
  const { connectionStatus, reconnect } = useConnectionMonitor()
  
  const defaultActions: HeaderAction[] = [
    {
      label: 'Relatórios',
      icon: BarChart3,
      onClick: () => navigate('/reports')
    },
    {
      label: 'Produtos',
      icon: Package,
      onClick: () => navigate('/admin/products')
    },
    {
      label: 'WhatsApp',
      icon: Bell,
      onClick: () => navigate('/whatsapp-admin')
    }
  ]
  
  const allActions = [...defaultActions, ...actions]
  
  return (
    <header className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 lg:bg-orange-500 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            {/* Left: Logo */}
            <div className="flex items-center">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Coco Loko" 
                  className="h-20 w-auto"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Center: Action Buttons */}
            {showActionButtons && (
              <div className="flex gap-2">
                {allActions.filter(a => !a.mobileOnly).map((action, idx) => (
                  <Button
                    key={idx}
                    onClick={action.onClick}
                    className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    size="sm"
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Right: Connection Status & Logout */}
            <div className="flex items-center gap-3">
              {showConnectionStatus && (
                <ConnectionStatusBadge 
                  status={connectionStatus} 
                  onReconnect={reconnect} 
                />
              )}
              {showLogout && (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 transition-all duration-300 hover:scale-105"
                  size="sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              )}
            </div>
          </div>

          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden">
            {/* Top row: Logo, Connection, Logout */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="Coco Loko" 
                    className="h-12 sm:h-16 w-auto drop-shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {showConnectionStatus && (
                  <ConnectionStatusBadge 
                    status={connectionStatus} 
                    onReconnect={reconnect}
                    compact 
                  />
                )}
                {showLogout && (
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Bottom row: Action Buttons */}
            {showActionButtons && (
              <div className="flex flex-wrap gap-2">
                {allActions.filter(a => !a.desktopOnly).map((action, idx) => (
                  <Button
                    key={idx}
                    onClick={action.onClick}
                    className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm"
                    size="sm"
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{action.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Content */}
          {customContent}
        </div>
      </div>
    </header>
  )
}
```

### Connection Status Badge Component

```typescript
interface ConnectionStatusBadgeProps {
  status: 'connected' | 'connecting' | 'disconnected'
  onReconnect: () => void
  compact?: boolean
}

const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  status,
  onReconnect,
  compact = false
}) => {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
        <Wifi className="h-4 w-4 text-green-200" />
        {!compact && <span className="text-sm text-green-200 font-medium">Online</span>}
      </div>
    )
  }
  
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
        <Wifi className="h-4 w-4 animate-pulse text-yellow-200" />
        {!compact && (
          <span className="text-sm text-yellow-200 font-medium hidden sm:inline">
            Conectando...
          </span>
        )}
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
        <WifiOff className="h-4 w-4 text-red-200" />
        {!compact && <span className="text-sm text-red-200 font-medium">Offline</span>}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReconnect}
        className="text-xs text-white border-white/30 hover:bg-white/10 backdrop-blur-sm"
      >
        Reconectar
      </Button>
    </div>
  )
}
```

## Page-Specific Implementations

### Gestão de Garçons (Waiter Management)

```typescript
const WaiterManagement = () => {
  const [waiters, setWaiters] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  const loadWaiters = async () => {
    // Load waiters logic
  }
  
  const pageActions: HeaderAction[] = [
    {
      label: 'Atualizar',
      icon: RefreshCw,
      onClick: loadWaiters
    },
    {
      label: 'Novo Garçom',
      icon: Plus,
      onClick: () => setIsAddDialogOpen(true)
    }
  ]
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        pageName="Gestão de Garçons"
        actions={pageActions}
        showConnectionStatus={false}
      />
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestão de Garçons
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie sua equipe de garçons
          </p>
        </div>
        
        {/* Waiter cards */}
      </div>
    </div>
  )
}
```

### Reports Page

```typescript
const Reports = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        pageName="Relatórios"
        showConnectionStatus={false}
      />
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Relatórios
          </h1>
          <p className="text-gray-600 mt-2">
            Análise de Vendas e Pedidos
          </p>
        </div>
        
        {/* Reports content */}
      </div>
    </div>
  )
}
```

### Admin Products Page

```typescript
const AdminProducts = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  const pageActions: HeaderAction[] = [
    {
      label: 'Novo Produto',
      icon: Plus,
      onClick: () => setIsAddDialogOpen(true)
    }
  ]
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        pageName="Gerenciar Produtos"
        actions={pageActions}
        showConnectionStatus={false}
      />
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gerenciar Produtos
          </h1>
          <p className="text-gray-600 mt-2">
            Edite descrições, fotos e preços • Cardápio Digital
          </p>
        </div>
        
        {/* Products grid */}
      </div>
    </div>
  )
}
```

## Styling Specifications

### Colors
```css
/* Gradient (Mobile) */
background: linear-gradient(to right, #f97316, #ef4444, #ec4899);

/* Solid (Desktop) */
background: #f97316; /* orange-500 */

/* Button Backgrounds */
background: rgba(255, 255, 255, 0.15);
hover: rgba(255, 255, 255, 0.25);
border: rgba(255, 255, 255, 0.3);
```

### Spacing
```css
/* Header Padding */
padding: 1rem 1rem; /* mobile */
padding: 1.5rem 1.5rem; /* desktop */

/* Logo Size */
height: 3rem; /* mobile */
height: 5rem; /* desktop */

/* Button Gap */
gap: 0.5rem;

/* Section Gap */
gap: 0.75rem;
```

### Responsive Breakpoints
```css
/* Mobile: < 768px */
- Stack action buttons
- Icon-only buttons
- Compact connection status

/* Tablet: 768px - 1024px */
- Show button labels
- Side-by-side layout

/* Desktop: > 1024px */
- Full horizontal layout
- All labels visible
- Larger logo
```

## Migration Strategy

### Phase 1: Create Shared Component
1. Create `src/components/AppHeader.tsx`
2. Create `src/components/ConnectionStatusBadge.tsx`
3. Add TypeScript interfaces
4. Implement responsive logic

### Phase 2: Update Pages
1. Update Gestão de Garçons
2. Update Reports
3. Update AdminProducts
4. Update any other legacy headers

### Phase 3: Cleanup
1. Remove old header code
2. Remove duplicate styles
3. Update tests
4. Document usage

## Benefits

1. **Consistency** - All pages look and feel the same
2. **Maintainability** - Single component to update
3. **Responsive** - Works on all screen sizes
4. **Accessible** - Proper ARIA labels and keyboard navigation
5. **Professional** - Modern, polished appearance
