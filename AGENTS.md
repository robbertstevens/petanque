# AGENTS.md

This file provides guidance for AI coding agents working in this repository.

## Project Overview

- **Project**: Petanque
- **Type**: Next.js 16 application with App Router
- **Language**: TypeScript (strict mode)
- **UI**: React 19 with Tailwind CSS v4
- **Node Version**: v24 (see `.nvmrc`)

## Build, Lint, and Test Commands

### Development

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
```

### Linting

```bash
npm run lint         # Run ESLint on the entire codebase
npx eslint <file>    # Lint a specific file
npx eslint --fix     # Auto-fix linting issues
```

### Testing

No test framework is currently configured. When adding tests:

- Recommended: Vitest for unit/integration tests
- For E2E: Playwright or Cypress
- Test file convention: `*.test.ts` or `*.spec.ts`
- Run single test (once configured): `npx vitest run path/to/file.test.ts`

### Type Checking

```bash
npx tsc --noEmit     # Run TypeScript type checking without emitting files
```

## Project Structure

```
petanque/
├── src/
│   └── app/              # Next.js App Router pages and layouts
│       ├── layout.tsx    # Root layout (fonts, metadata)
│       ├── page.tsx      # Home page
│       └── globals.css   # Global styles (Tailwind CSS v4)
├── public/               # Static assets (images, icons)
├── eslint.config.mjs     # ESLint flat config (v9)
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── postcss.config.mjs    # PostCSS config (Tailwind)
└── package.json          # Project manifest
```

## Code Style Guidelines

### TypeScript

- **Strict mode is enabled** - all code must pass strict type checking
- Use explicit types for function parameters and return values
- Use `Readonly<>` wrapper for component props
- Avoid `any` type - use `unknown` with type guards when type is uncertain
- Use type imports: `import type { Foo } from "module"`

### Imports

Order imports as follows (with blank lines between groups):

1. React/Next.js imports
2. Third-party libraries
3. Internal modules using `@/*` path alias
4. Relative imports
5. Style imports

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { someUtil } from "@/lib/utils";

import "./globals.css";
```

### Path Aliases

Use the `@/*` alias for imports from the `src/` directory:

```typescript
// Good
import { Button } from "@/components/Button";

// Avoid
import { Button } from "../../../components/Button";
```

### React Components

- Use functional components with TypeScript
- Export components as default for pages, named exports for reusable components
- Use Next.js `Image` component for images (automatic optimization)
- Use `next/font` for font optimization

```typescript
// Page component (default export)
export default function HomePage() {
  return <div>...</div>;
}

// Reusable component (named export)
export function Button({ children }: Readonly<{ children: React.ReactNode }>) {
  return <button>{children}</button>;
}
```

### Styling

- Use Tailwind CSS utility classes for styling
- Tailwind CSS v4 with `@import "tailwindcss"` syntax
- Support dark mode via `dark:` prefix and `prefers-color-scheme`
- Use CSS custom properties for theme values (see `globals.css`)
- Use `@theme inline` directive for Tailwind CSS v4 theme customization

```tsx
<div className="flex items-center bg-white dark:bg-black">
```

### Naming Conventions

- **Files**: kebab-case for utilities (`auth-utils.ts`), PascalCase for components (`Button.tsx`)
- **Components**: PascalCase (`HomePage`, `UserProfile`)
- **Functions**: camelCase (`getUserData`, `handleSubmit`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants (`API_URL`)
- **Types/Interfaces**: PascalCase (`UserProps`, `ApiResponse`)

### Error Handling

- Use try-catch blocks for async operations
- Provide meaningful error messages
- Use Next.js error boundaries (`error.tsx`) for page-level errors
- Log errors appropriately (avoid exposing sensitive data)

### Next.js Specific

- Place pages in `src/app/` using App Router conventions
- Use `page.tsx` for page components
- Use `layout.tsx` for layouts
- Use `loading.tsx` for loading states
- Use `error.tsx` for error handling
- Use `not-found.tsx` for 404 pages
- Metadata export for SEO: `export const metadata: Metadata = { ... }`

### React Compiler

This project has React Compiler enabled (`reactCompiler: true` in `next.config.ts`).
The compiler automatically optimizes React components. Follow React rules of hooks
and component purity for best results.

## ESLint Configuration

Uses ESLint v9 with flat config:

- `eslint-config-next/core-web-vitals` - Next.js rules with Core Web Vitals
- `eslint-config-next/typescript` - TypeScript-specific rules

Ignored paths: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Common Tasks

### Adding a New Page

Create a new directory in `src/app/` with a `page.tsx` file:

```bash
mkdir -p src/app/about
# Create src/app/about/page.tsx
```

### Adding a New Component

Create components in `src/components/` (create directory if needed):

```bash
mkdir -p src/components
# Create src/components/Button.tsx
```

### Adding API Routes

Create API routes in `src/app/api/`:

```bash
mkdir -p src/app/api/hello
# Create src/app/api/hello/route.ts
```

## Important Notes

- No Prettier is configured - rely on ESLint for formatting
- No CI/CD is configured yet
- React 19 features are available (use, Server Components, etc.)
- Tailwind CSS v4 uses the new `@tailwindcss/postcss` plugin
