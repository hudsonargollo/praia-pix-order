# Project Structure

## Root Directory

- **Configuration Files**: Standard Vite/React setup with TypeScript, Tailwind, ESLint
- **Environment**: `.env` for local variables, `.gitignore` for version control
- **Package Management**: `package.json` with npm, `bun.lockb` present

## Source Structure (`src/`)

```
src/
├── assets/           # Static assets (logos, images)
├── components/       # React components
│   ├── ui/          # shadcn/ui component library
│   └── ProtectedRoute.tsx  # Authentication wrapper
├── hooks/           # Custom React hooks
├── integrations/    # External service integrations
│   └── supabase/   # Database client and types
├── lib/            # Utility functions
├── pages/          # Route components (one per page)
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles
```

## Key Architectural Patterns

### Page-Based Routing
- Each route has a dedicated component in `src/pages/`
- Route definitions centralized in `App.tsx`
- Protected routes use `ProtectedRoute` wrapper for role-based access

### Component Organization
- UI components follow shadcn/ui patterns in `components/ui/`
- Business logic components at `components/` root level
- Consistent export patterns with default exports

### Integration Layer
- External services isolated in `integrations/` directory
- Supabase client configured with TypeScript types
- Environment variables for service configuration

### Styling Conventions
- Tailwind CSS with custom design system
- CSS custom properties for colors and shadows
- Responsive-first approach with mobile optimization

## Database Structure (`supabase/`)

- **Migrations**: Versioned SQL files for database schema
- **Configuration**: `config.toml` for local development setup

## Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: Default exports, descriptive names
- **Routes**: Kebab-case URLs, PascalCase component names
- **Database**: Snake_case for tables and columns