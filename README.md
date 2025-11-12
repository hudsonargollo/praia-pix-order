# Coco Loko Açaiteria - Digital Ordering System

A complete digital ordering and payment system for an açaí shop. This application provides a seamless experience for customers to order via QR codes at tables, make payments through PIX, and receive WhatsApp notifications.

## 🌴 Product Overview

Coco Loko Açaiteria streamlines operations for a açaí shop while providing a modern, mobile-first customer experience. The system handles the complete order lifecycle from menu browsing to payment confirmation and kitchen preparation.

### Key Features

- **Customer Flow**: QR code menu access, digital ordering, PIX payments, WhatsApp notifications
- **Kitchen Dashboard**: Real-time view of paid orders, order status management
- **Cashier Panel**: Order monitoring and customer notification system
- **Admin Panel**: Product management, waiter management, sales reports, WhatsApp administration
- **Waiter Module**: Table-side order placement and order tracking
- **Role-based Access**: Protected routes for kitchen, cashier, admin, and waiter staff

### Target Users

- **Customers**: People ordering açaí and refreshments
- **Kitchen Staff**: Food preparation team managing order queue
- **Cashier Staff**: Front-of-house team handling customer service and notifications
- **Admin Staff**: Management team overseeing products, staff, and reports
- **Waiter Staff**: Service team taking orders and managing customer interactions

## 🚀 Technology Stack

### Core Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC plugin for fast compilation
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **Payment Integration**: Mercado Pago PIX
- **Messaging**: WhatsApp notifications via Evolution API

### Key Libraries

- **Icons**: Lucide React
- **Notifications**: Sonner toasts
- **Charts**: Recharts for analytics and reports
- **Date Handling**: date-fns
- **Styling Utilities**: clsx, tailwind-merge, class-variance-authority
- **Theming**: next-themes for dark/light mode support
- **Carousel**: embla-carousel-react for image/content carousels
- **Command Palette**: cmdk for search interfaces
- **QR Codes**: qrcode for generating payment QR codes

### Development Tools

- **Linting**: ESLint with TypeScript support
- **Testing**: Vitest with React Testing Library
- **Package Manager**: npm
- **Environment**: Node.js with ES modules

## 📁 Project Structure

The project follows a clean, role-based organization pattern for improved maintainability and navigation:

```
praia-pix-order/
├── _archive/              # Historical development files (archived)
│   ├── dev_notes/        # Development markdown files
│   ├── sql_fixes/        # One-off SQL scripts
│   └── test_scripts/     # Test shell scripts
├── src/
│   ├── assets/           # Static assets (logos, images)
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui component library
│   │   └── ...          # Business logic components
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # External service integrations
│   │   ├── supabase/   # Database client and types
│   │   ├── mercadopago/ # Payment integration
│   │   └── whatsapp/   # WhatsApp messaging
│   ├── lib/             # Utility functions
│   ├── pages/           # Route components (role-based organization)
│   │   ├── customer/   # Customer-facing pages (Menu, Checkout, Payment, etc.)
│   │   ├── admin/      # Admin panel pages (Products, Waiters, Reports, etc.)
│   │   ├── staff/      # Kitchen/Cashier pages
│   │   ├── waiter/     # Waiter-specific pages
│   │   ├── public/     # Public/auth pages (Index, Auth, NotFound)
│   │   └── debug/      # Debug/diagnostic pages
│   ├── App.tsx         # Main application component with routing
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database schema migrations
├── functions/           # Cloudflare functions (API endpoints)
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Build configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Styling configuration
└── README.md            # This file
```

### Role-Based Page Organization

Pages are organized by user role for better code navigation:

- **customer/**: Menu browsing, checkout, payment, order status
- **admin/**: Product management, waiter management, reports, WhatsApp admin
- **staff/**: Kitchen dashboard, cashier panel
- **waiter/**: Order placement, waiter dashboard, order tracking
- **public/**: Landing page, authentication, error pages
- **debug/**: Diagnostic and monitoring tools

### Archive Directory

The `_archive/` directory contains historical development files that are no longer actively used but preserved for reference:

- **dev_notes/**: Development notes, planning documents, and fix summaries
- **sql_fixes/**: One-off SQL scripts and database fixes
- **test_scripts/**: Historical test scripts and validation tools

These files have been archived to keep the root directory clean and focused on essential project files.

## 🛠️ Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js)
- **Supabase CLI** - [Installation guide](https://supabase.com/docs/guides/cli)

### Installation

1. **Clone the repository**

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Mercado Pago Configuration (optional for development)
VITE_MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_token

# WhatsApp Configuration (optional for development)
VITE_WHATSAPP_API_URL=your_whatsapp_api_url
```

4. **Start local Supabase instance**

```bash
npx supabase start
```

This will start a local Supabase instance and apply all database migrations. Note the API URL and anon key provided in the output.

5. **Update .env with local Supabase credentials**

Update your `.env` file with the local Supabase credentials from the previous step.

6. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### First-Time Setup

After starting the application for the first time:

1. **Create admin account**: Use the Supabase dashboard to create your first admin user
2. **Add products**: Log in as admin and add products to the menu
3. **Configure WhatsApp** (optional): Set up WhatsApp integration for notifications
4. **Test customer flow**: Scan a QR code or navigate to `/menu` to test the ordering process

## 💻 Development

### Common Commands

```bash
# Development
npm run dev              # Start development server on port 8080
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Run tests with UI

# Database (Supabase)
npx supabase start       # Start local Supabase
npx supabase stop        # Stop local Supabase
npx supabase db reset    # Reset local database
npx supabase migration new <name>  # Create new migration

# Deployment
npm run deploy           # Deploy to production
npm run deploy:full      # Full production deployment
npm run test:production  # Test production deployment
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the role-based page organization
   - Place new pages in the appropriate directory (customer/, admin/, staff/, waiter/, public/, debug/)
   - Use TypeScript for type safety
   - Follow existing code patterns and conventions

3. **Test your changes**
   ```bash
   npm run lint          # Check for linting errors
   npm run test:run      # Run tests
   npm run build         # Ensure production build works
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

### Code Organization Guidelines

- **Components**: Place reusable components in `src/components/`, UI components in `src/components/ui/`
- **Pages**: Place page components in the appropriate role directory under `src/pages/`
- **Hooks**: Custom hooks go in `src/hooks/`
- **Utilities**: Helper functions go in `src/lib/`
- **Integrations**: External service code goes in `src/integrations/`
- **Types**: TypeScript types are co-located with their usage or in integration directories

### Styling Conventions

- Use Tailwind CSS utility classes for styling
- Follow the custom design system (purple theme, ocean/sunset/acai gradients)
- Use CSS custom properties for colors and shadows
- Ensure responsive design (mobile-first approach)
- Test on multiple screen sizes

### Configuration Notes

- Uses `@` alias for src directory imports (e.g., `@/components/ui/button`)
- Vite configured for IPv6 host (`::`) on port 8080
- Tailwind configured with custom color system, gradients, and animations
- Component tagging enabled in development mode via lovable-tagger

## 🏗️ Architecture

### Key Architectural Patterns

**Page-Based Routing**
- Each route has a dedicated component in `src/pages/`
- Route definitions centralized in `App.tsx`
- Protected routes use `ProtectedRoute` wrapper for role-based access
- Lazy loading implemented for improved performance

**Component Organization**
- UI components follow shadcn/ui patterns in `components/ui/`
- Business logic components at `components/` root level
- Consistent export patterns with default exports

**Integration Layer**
- External services isolated in `integrations/` directory
- Supabase client configured with TypeScript types
- Environment variables for service configuration

**State Management**
- TanStack Query for server state and caching
- React Context for cart and table state
- Local state with React hooks

### User Flows

**Customer Flow**
1. Scan QR code at table → Welcome page
2. Browse menu → Add items to cart
3. Proceed to checkout → Enter name and WhatsApp
4. Generate PIX payment → Display QR code
5. Payment confirmation → Order sent to kitchen
6. Order status tracking → WhatsApp notifications

**Kitchen Flow**
1. Login with kitchen credentials
2. View real-time list of paid orders
3. Mark orders as "preparing" or "ready"
4. Orders update in real-time across all dashboards

**Cashier Flow**
1. Login with cashier credentials
2. Monitor all orders with status
3. Send WhatsApp notifications to customers
4. View order history and details

**Admin Flow**
1. Login with admin credentials
2. Manage products (add, edit, delete, upload images)
3. Manage waiters (create, update, view reports)
4. View sales reports and analytics
5. Configure WhatsApp settings

**Waiter Flow**
1. Login with waiter credentials
2. Place orders for customers at tables
3. View personal order history and dashboard
4. Track order status

## 🧪 Testing

The project uses Vitest and React Testing Library for testing:

```bash
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
```

Tests are located in `__tests__` directories alongside the components they test.

## 🚢 Deployment

The application is configured for deployment on Cloudflare Pages with Supabase as the backend.

### Production Deployment

```bash
npm run deploy:full
```

This will:
1. Build the production bundle
2. Deploy to Cloudflare Pages
3. Deploy Supabase Edge Functions

### Environment Variables for Production

Ensure the following environment variables are set in your production environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_MERCADOPAGO_ACCESS_TOKEN`
- `VITE_WHATSAPP_API_URL`

## 📝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code organization guidelines and the process for submitting pull requests.

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues, questions, or contributions, please contact the development team.

---

Built with ❤️ for Coco Loko Açaiteria 🥥
