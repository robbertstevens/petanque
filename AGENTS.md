# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

- **Project**: Petanque - Competition management web application
- **Stack**: Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Auth**: better-auth with username/password (scrypt hashing)
- **Node**: v24 (see `.nvmrc`)

## Build, Lint, and Test Commands

### Development

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
```

### Linting and Formatting

```bash
npm run lint         # Run ESLint on the entire codebase
npx eslint <file>    # Lint a specific file
npx eslint --fix     # Auto-fix linting issues
npm run format       # Format all files with Prettier
npm run format:check # Check if files are formatted
npx prettier --write <file>  # Format a specific file
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

### Database

```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Run pending migrations
npm run db:push      # Push schema changes directly (dev only)
npm run db:studio    # Open Drizzle Studio GUI
npm run db:seed      # Seed database with test data (all passwords: 'password')
```

## Project Structure

- `src/app/` - Next.js App Router pages and layouts
  - `api/auth/` - Auth API routes (better-auth)
  - `admin/` - Admin pages, `competitions/` - User-facing, `teams/` - Team management
- `src/components/` - Reusable UI components
- `src/db/` - Database layer (schema, relations, client)
- `src/lib/actions/` - Server actions (teams.ts, competitions.ts)
- `src/lib/auth.ts` - Auth server config, `auth-client.ts` - React client
- `scripts/seed.ts` - Database seed script
- `drizzle/` - Generated migrations

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

### Path Aliases

Use the `@/*` alias for imports from the `src/` directory.

### Server Actions

Place server actions in `src/lib/actions/`:

- Start with `"use server"` directive
- Use `getCurrentUser()` helper to verify auth via `auth.api.getSession({ headers: await headers() })`
- Return `{ error: string }` on failure, `{ success: true, ...data }` on success
- Call `revalidatePath()` after mutations

### Client Components with Forms

Use `useActionState` for form handling with signature:

```typescript
const [state, formAction, isPending] = useActionState<State, FormData>(
  actionFn,
  null,
);
```

### Styling

- Use Tailwind CSS utility classes
- Support dark mode via `dark:` prefix
- Use CSS custom properties for theme values (see `globals.css`)

### Naming Conventions

- **Files**: kebab-case for utilities (`auth-utils.ts`), kebab-case for components (`create-team-form.tsx`)
- **Components**: PascalCase (`CreateTeamForm`, `UserProfile`)
- **Functions/variables**: camelCase (`getUserData`, `handleSubmit`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants (`API_URL`)
- **Types/Interfaces**: PascalCase (`UserProps`, `ApiResponse`)
- **Database tables**: camelCase singular (`team`, `teamMember`, `competition`)

### Error Handling

- Server actions return `{ error: string }` on failure
- Use try-catch blocks for async operations
- Use Next.js error boundaries (`error.tsx`) for page-level errors
- Never expose sensitive data in error messages

### Database Patterns

- Use Drizzle's query API with relations for reads: `db.query.team.findFirst({ with: { members: true } })`
- Use Drizzle's insert/update/delete for writes
- Define relations in schema files alongside table definitions
- Use `crypto.randomUUID()` for primary keys

## React Compiler

This project has React Compiler enabled (`reactCompiler: true` in `next.config.ts`).
The compiler automatically optimizes components - no need for manual `useMemo`/`useCallback`.
Follow React rules of hooks and component purity for best results.

## Important Notes

- better-auth uses scrypt from `@noble/hashes` for password hashing (not bcrypt)
- Competition statuses: `draft`, `registration`, `group_stage`, `knockout`, `completed`
- Tailwind CSS v4 uses `@import "tailwindcss"` and `@theme inline` directive
