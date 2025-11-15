# 🥥 Coco Loko Açaiteria - Digital Ordering System

A complete digital ordering and payment system for an açaí shop by the beach. This modern, mobile-first application streamlines the entire order lifecycle from menu browsing to payment confirmation and kitchen preparation, providing a seamless experience for customers to order via QR codes at tables, make payments through PIX, and receive WhatsApp notifications.

## 🌴 Overview

Coco Loko Açaiteria is a comprehensive digital ordering platform designed specifically for beachside açaí shops. The system eliminates traditional paper menus and manual payment processes, replacing them with a streamlined digital experience that benefits both customers and staff.

**Problem Solved**: Traditional ordering at beach kiosks involves paper menus, manual order taking, and cash/card payments that slow down service during peak hours.

**Solution**: QR code-based digital ordering with instant PIX payments, real-time kitchen notifications, and automated WhatsApp updates that keep customers informed while they enjoy the beach.

### Key Features

- **Customer Flow**: QR code menu access, digital ordering, PIX payments, WhatsApp notifications
- **Kitchen Dashboard**: Real-time view of paid orders, order status management
- **Cashier Panel**: Order monitoring and customer notification system
- **Admin Panel**: Product management, waiter management, sales reports, WhatsApp administration
- **Waiter Module**: Table-side order placement, manual PIX generation, commission tracking
- **Waiter Payment Workflow**: Separate order and payment status, pending vs confirmed commissions
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
- Custom purple theme with ocean, sunset, and açaí gradient variants
- Responsive design with mobile-first approach

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
2. Place orders for customers at tables (orders go directly to kitchen)
3. Generate PIX QR code when customer is ready to pay
4. View personal order history and dashboard
5. Track order status and payment status separately
6. Add items to orders in preparation
7. Monitor pending vs confirmed commissions

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

## 🎯 Recent Improvements

### Waiter Payment Workflow (November 2024)
- ✅ Independent order and payment status tracking
- ✅ Manual PIX generation for waiter-created orders
- ✅ Dual status display (order status + payment status)
- ✅ Pending vs confirmed commission tracking
- ✅ Add items to orders in preparation
- ✅ Real-time payment status updates
- ✅ Comprehensive documentation and troubleshooting guides

### WhatsApp Admin UX (November 2025)
- ✅ Responsive mobile layout with 19.5% space savings
- ✅ 2-column stats grid on mobile devices
- ✅ Optimized typography and spacing
- ✅ Scannable QR codes at reduced size
- ✅ Professional desktop appearance preserved

### Payment Page UX (November 2025)
- ✅ Compact header layout (50% height reduction)
- ✅ Prominent copy button for PIX codes
- ✅ Responsive spacing for small devices
- ✅ Full WCAG AA accessibility compliance
- ✅ Purple pulsing badge for pending payments

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment information and [WAITER_PAYMENT_WORKFLOW_DOCS.md](./WAITER_PAYMENT_WORKFLOW_DOCS.md) for complete feature documentation.

## 📊 Key Metrics

- **Mobile-First**: 19.5% space savings on mobile devices
- **Accessibility**: WCAG AA compliant with 44px+ touch targets
- **Performance**: 3.06s build time, ~200KB gzipped bundle
- **Test Coverage**: 100% of critical user flows validated
- **Responsive**: Optimized for devices from 375px to 1920px

## 📚 Documentation

### Core Documentation

- **[README.md](./README.md)** - This file, project overview and getting started
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide with troubleshooting
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

### Feature Documentation

- **[WAITER_PAYMENT_WORKFLOW_DOCS.md](./WAITER_PAYMENT_WORKFLOW_DOCS.md)** - Complete waiter payment workflow documentation index
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema and structure
- **[COMMISSION_CALCULATION.md](./COMMISSION_CALCULATION.md)** - Commission calculation logic and formulas
- **[TROUBLESHOOTING_PAYMENT.md](./TROUBLESHOOTING_PAYMENT.md)** - Payment system troubleshooting guide

### Specification Documents

Located in `.kiro/specs/`:
- **waiter-payment-workflow/** - Requirements, design, and implementation tasks
- **admin-desktop-layout/** - Admin interface specifications
- **customer-order-flow/** - Customer ordering specifications
- And more...

### Test Documentation

Located in `src/test/`:
- E2E test reports and summaries
- Integration test documentation
- Real-time verification reports
- Commission verification reports

## 📝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Follow the role-based page organization structure
2. Use TypeScript for all new code
3. Ensure responsive design (test on mobile first)
4. Write tests for critical functionality
5. Update documentation as needed
6. Review [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines

For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For issues, questions, or contributions:
- Check existing documentation in `_archive/dev_notes/`
- Review test guides in `src/test/`
- Contact the development team

## 🙏 Acknowledgments

- Built with React, TypeScript, and Tailwind CSS
- UI components from shadcn/ui
- Backend powered by Supabase
- Payments via Mercado Pago
- Messaging via Evolution API

---

Built with ❤️ for Coco Loko Açaiteria 🥥🌴

**Making beach ordering simple, fast, and delightful!**
