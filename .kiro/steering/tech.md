# Technology Stack

## Core Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC plugin for fast compilation
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation

## Key Libraries

- **Icons**: Lucide React
- **Notifications**: Sonner toasts
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Styling Utilities**: clsx, tailwind-merge, class-variance-authority
- **Theming**: next-themes for dark/light mode support
- **Carousel**: embla-carousel-react for image/content carousels
- **Command Palette**: cmdk for search interfaces

## Development Tools

- **Linting**: ESLint with TypeScript support
- **Package Manager**: npm (with bun.lockb present)
- **Environment**: Node.js with ES modules

## Common Commands

```bash
# Development
npm run dev          # Start development server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Database (Supabase)
npx supabase start   # Start local Supabase
npx supabase db reset # Reset local database
```

## Configuration Notes

- Uses `@` alias for src directory imports
- Vite configured for IPv6 host (`::`) on port 8080
- Tailwind configured with custom color system, gradients, and animations
- Custom CSS variables for colors, shadows, and gradients (ocean, sunset, acai themes)
- Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Component tagging enabled in development mode via lovable-tagger