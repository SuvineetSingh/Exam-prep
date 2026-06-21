# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js 16 (App Router) web app — a question-bank platform for CMA, CFA, and FE exam prep. Users pay per-course (one-time Stripe payment) for unlimited access to that course's questions. Also has a social "lobby" (real-time chat rooms/DMs) and a gamification layer (XP, levels, badges).

## Commands

```bash
npm run dev              # Start dev server
npm run build             # Production build
npm run lint               # ESLint
npm run type-check         # tsc --noEmit
npm run format             # Prettier write
npm run format:check       # Prettier check
npm test                   # Run all Jest tests
npm run test:watch         # Jest watch mode
npm run test:coverage      # Jest with coverage
```

Run a single test file: `npx jest path/to/file.test.tsx`
Run tests matching a name: `npx jest -t "test name"`

Jest uses `next/jest`, jsdom environment, and the same `@/*` path alias as the app (configured in `jest.config.js`). Test files live in `__tests__/` folders next to the code they cover, matched via `**/__tests__/**/*.[jt]s?(x)`.

## Architecture

### Supabase client boundary

There are three distinct ways to talk to Supabase — always use the right one, never instantiate `createBrowserClient`/`createServerClient` directly:

- `lib/supabase/client.ts` — browser-side client, for Client Components and `lib/supabase/queries/*` helpers.
- `lib/supabase/server.ts` — server-side client for Server Components/Route Handlers; reads/writes auth cookies via `next/headers`.
- `lib/supabase/service.ts` — service-role client that **bypasses RLS**. Only used in trusted server-only code (API routes, the bots cron route) — never expose this key client-side.

`lib/supabase/config.ts` centralizes env var reads (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`) and throws if missing.

### Auth gating

`middleware.ts` does a cheap cookie-presence check (looks for a `-auth-token` cookie) to redirect unauthenticated users away from protected routes (`/questions`, `/practice`, `/timed-exam`, `/dashboard`, `/lobby`, `/history`, `/courses`, `/settings`) and authenticated users away from `/login`/`/register`. This is NOT a JWT verification — it's a fast pre-check. Pages/routes that need real authorization must independently call `supabase.auth.getUser()` server-side.

### Per-course access model

Access is per-course, not a single subscription flag. `course_subscriptions` (table) / `CourseSubscription` (type in `lib/types/index.ts`) ties a `user_id` to one of `CourseName = 'CMA' | 'CFA' | 'FE'`. Pricing lives in `lib/utils/constants.ts` (`COURSE_PRICES_CENTS`). The Stripe checkout flow (`app/api/stripe/checkout/route.ts`) creates/reuses a Stripe customer per user, stores `stripe_customer_id` on `user_profiles`, and tags the checkout session metadata with `course` so the webhook (`app/api/stripe/webhook/route.ts`) knows which course to grant on payment success.

### Gamification layer (`lib/gamification/`)

XP and levels are computed client-side from constants, not stored as a lookup table: `lib/gamification/constants.ts` derives `LEVEL_THRESHOLDS` from a formula (`100 * level^1.8`) and exposes `computeLevel()`/`getXPProgress()`. `lib/gamification/xpEngine.ts` (`awardXP`, `batchAwardXP`) upserts `user_xp` and logs to `xp_transactions` — XP amounts depend on `XPSource` (`answer_correct`, `answer_wrong`, `exam_complete`, `perfect_bonus`). Badges are a static catalog (`BADGE_DEFINITIONS`) evaluated against user activity by `lib/gamification/badgeEngine.ts`. Schema is in `supabase/migrations/010_gamification.sql`.

### Lobby (real-time chat)

Real-time presence/messaging built on Supabase Realtime, modeled in `lib/types/lobby.ts`. Rooms are keyed by `slug` (not just id). `hooks/useLobbyPresence.ts`, `hooks/useLobbyMessages.ts`, `hooks/useDMMessages.ts` wrap subscriptions; `components/lobby/*` are the UI. `app/api/lobby/bots/route.ts` is a service-role cron endpoint that scripts bot accounts (`user_profiles.is_bot` + `bot_script` JSON) to post timed messages into rooms — useful for keeping rooms looking active.

### Data-access pattern

Query/mutation logic against Supabase is pulled out of components into `lib/supabase/queries/*.ts` (e.g. `userStats.ts`, `lobbyQueries.ts`, `starredQueries.ts`) and `hooks/*.ts` for stateful/subscription-based access. Components call these rather than building Supabase queries inline. `getUserStats()` in `userStats.ts` is illustrative of the defensive style used throughout: missing tables/auth degrade to zeroed defaults rather than throwing, and streaks are computed by walking backward day-by-day in UTC to avoid timezone bugs.

### Migrations

`supabase/migrations/` only contains the two most recent migrations (`009_rename_cpa_to_cma.sql`, `010_gamification.sql`) — earlier schema history was applied directly via the Supabase dashboard and isn't in this repo. Don't assume the migrations folder is a complete schema history; the live Supabase schema is the source of truth.

### Naming gotcha: CMA vs CPA

The exam track was renamed from CPA to CMA. Migration `009_rename_cpa_to_cma.sql` only updated `questions`/`user_answers`/`exam_sessions`/`course_subscriptions`/`starred_questions` — it missed `user_profiles.exam_type` and, per the migrations-folder caveat above, was never actually applied to the live dev DB until this was caught and fixed directly. All legacy `CPA` rows (including `user_profiles`) and the lingering `CPA` text in code/docs have since been cleaned up — treat `CMA` as current and don't reintroduce `CPA`.

## Conventions

- Import via the `@/*` path alias (maps to repo root), not relative paths.
- Server Components are the default; add `'use client'` only when a component needs hooks, event handlers, or browser APIs.
- ESLint warns (doesn't error) on `@typescript-eslint/no-explicit-any`, unused vars (prefixed `_` are exempt), and `console.log` (`console.warn`/`console.error` are allowed).
