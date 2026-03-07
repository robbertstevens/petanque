# Petanque Competition Management

A Next.js web application for managing Petanque competitions, teams, and matches.

## Features

- **User Authentication** - Sign up, sign in, and manage your account
- **Team Management** - Create teams, invite players, manage members
- **Competition Management** - Create and organize competitions (admin only)
- **Competition Phases** - Registration → Group Stage → Knockout → Completed
- **Match Scoring** - Submit and confirm match scores (first to 13 points wins)
- **Standings & Results** - View group standings, knockout brackets, and final results
- **Role-Based Access** - Super admins can manage other admins

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Authentication**: better-auth with username/password
- **Styling**: Tailwind CSS v4 with dark mode
- **Password Hashing**: scrypt (via @noble/hashes)

## Getting Started

### Prerequisites

- Node.js v24 (see `.nvmrc`)
- Turso database (or local SQLite for development)

### Environment Variables

Create a `.env` file with:

```bash
# Auth secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-here

# Turso database (for production)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Or SQLite for local development
DATABASE_URL=file:./local.db
```

### Setup

```bash
# Install dependencies
npm install

# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# Seed with test data (optional)
npm run db:seed

# Start development server
npm run dev
```

### Test Accounts (after seeding)

All passwords are `password`:

- `superadmin` - Super admin (can manage other admins)
- `admin` - Admin (can manage competitions)
- `alice`, `bob`, `eve` - Team captains
- `charlie`, `diana`, `frank`, `grace` - Team members

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npx tsc --noEmit     # Type check
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Drizzle Studio
```

## Project Structure

- `src/app/` - Next.js App Router pages
  - `api/auth/` - Auth API routes
  - `admin/` - Admin pages
  - `competitions/` - Competition pages
  - `dashboard/` - User dashboard
  - `matches/` - Match pages
  - `teams/` - Team pages
- `src/components/` - Reusable UI components
- `src/db/` - Database schema and client
- `src/lib/actions/` - Server actions
- `scripts/` - Utility scripts (seed, etc.)

## Petanque Rules

- Teams of 2-3 players
- First to 13 points wins a match
- Competition formats: Group stage → Knockout bracket
