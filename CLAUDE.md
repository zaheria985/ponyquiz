# PonyQuiz — Claude Code Guide

## Overview

PonyQuiz is an educational quiz app for young horse riders (ages 9-12). Built with Next.js 14 App Router, raw PostgreSQL, and NextAuth. Self-hosted via Docker Compose.

## Quick Start

```bash
# Development
cp .env.example .env  # Fill in values
npm install
npm run dev

# Production
docker compose up -d
```

## Project Structure

```
app/                        # Next.js App Router pages
  admin/                    # Admin section (badges, images, import, questions, students, topics)
  api/                      # API routes (auth, flashcards, quiz, uploads)
  dashboard/                # Student dashboard
  flashcards/               # Flashcard study mode
  practice/                 # Practice quiz (immediate feedback)
  quiz/                     # Graded quiz (score at end)
  profile/                  # Student profile, badges, unlockables
  leaderboard/              # Student rankings
components/
  admin/                    # Admin CRUD components
  dashboard/                # Dashboard widgets
  flashcards/               # Flashcard components
  leaderboard/              # Leaderboard table
  profile/                  # Badge/unlockable grids, avatar selector
  quiz/                     # Question renderers, setup, results
  ui/                       # Primitives (Badge, Card, EmptyState, Modal, PageHeader, ProgressBar)
lib/
  actions/                  # Server actions (mutations)
  queries/                  # Database read queries
  server/                   # Server-only utilities (badge-engine, document-parser, uploads)
  auth.ts                   # NextAuth configuration
  db.ts                     # PostgreSQL connection pool
  session.ts                # Auth helpers (getCurrentUser, requireAuth, requireAdmin)
db/
  schema.sql                # Full database schema (11 tables)
  bootstrap.js              # Creates schema if not exists
  migrate.js                # Runs numbered migrations from db/migrations/
  seed.ts                   # Default badges and unlockables
```

## Key Conventions

### Database
- **Raw SQL only** — use `pool.query()` with `$1` parameterized queries. No ORM.
- **Migrations** — numbered SQL files in `db/migrations/`. Run via `node db/migrate.js`.
- **`force-dynamic`** — ALL pages that query the database must export `export const dynamic = "force-dynamic"`.

### Server Actions
- Pattern: `"use server"` → Zod `safeParse()` → parameterized SQL → `revalidatePath()`.
- Return type: `Promise<{ success: true; data?: ... } | { error: string }>`.
- Use `parsed.error.issues[0]?.message` (NOT `.errors` — Zod v4).

### Styling
- **CSS variables only** — never hardcode hex/rgb colors. Use tokens like `var(--text-primary)`, `var(--surface)`, `var(--interactive)`.
- **Tailwind** for layout utilities. Colors always via CSS vars.
- Design tokens defined in `app/globals.css`.

### Components
- `"use client"` only when needed (useState, onClick, event handlers).
- Use `@/` alias imports.
- Reuse UI primitives from `components/ui/`.

### Auth
- NextAuth 4 with JWT strategy and CredentialsProvider.
- Middleware protects `/admin/*` routes (admin role required).
- Use `getCurrentUser()`, `requireAuth()`, `requireAdmin()` from `lib/session.ts`.

### API Routes
- Pattern: auth check → JSON parse with try/catch → Zod validate → query → `NextResponse.json()`.
- Always handle unauthorized (401) and validation errors (400).

## Common Gotchas

1. **Zod v4** — `.uuid()` and `.email()` show deprecation warnings but work. Use `parsed.error.issues` not `.errors`. Don't pass `errorMap` to `z.enum()`.
2. **Next.js 14.2** — use `experimental.serverComponentsExternalPackages` (NOT top-level `serverExternalPackages`).
3. **CJS packages** — `pdf-parse` and `mammoth` have no ESM exports. Use `require()`.
4. **FormEvent** — use `React.FormEvent<HTMLFormElement>` (generic form deprecated).
5. **ESLint** — config is just `next/core-web-vitals`. Don't add `@typescript-eslint/*` disable comments.
6. **User role in NextAuth** — cast with `(user as unknown as Record<string, unknown>).role`.

## Build & Deploy

```bash
npm run build          # Verify TypeScript + build
docker compose build   # Build production image
docker compose up -d   # Start production stack
npx tsx db/seed.ts     # Seed default badges/unlockables (run once)
```

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Random secret for JWT
- `NEXTAUTH_URL` — App URL
- `ANTHROPIC_API_KEY` — For AI document import feature
