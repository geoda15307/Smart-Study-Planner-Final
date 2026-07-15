# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # next lint (ESLint, eslint-config-next)
```

There is no test runner configured. Setup: `npm install`, then `cp .env.example .env.local`.

Demo login: `demo@student.com` / `password123` (any email works; password just needs 8+ chars — see `authService.login`).

## Big Picture

Smart Study Planner is a Next.js 14 App Router / TypeScript / Tailwind / Zustand app that is **mid-migration from a frontend-only MVP to a Supabase backend**. A Supabase project (`smart-study-planner-web`, ref `wktyqplwjfikdmgzufna`) is connected — see "Supabase connection" below — but the app's actual data layer (tasks/courses/categories/etc.) still runs entirely on the Zustand store described next; nothing reads/writes Supabase tables yet. That migration is tracked separately. UI copy and many domain string-literals are in **Bahasa Indonesia**.

Path alias: `@/*` → `./src/*`.

### Supabase connection
`src/lib/supabase/client.ts` (Client Components, via `createBrowserClient`) and `src/lib/supabase/server.ts` (Server Components/Route Handlers, via `createServerClient` + `next/headers` cookies) are the two entry points, following Supabase's standard `@supabase/ssr` pattern. Both read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the environment — real values live in the gitignored `.env.local`, `.env.example` only has placeholders. There is no `middleware.ts` yet since Supabase Auth isn't wired up (the app still uses the mock `authService.ts` below); add the session-refresh middleware when that migration happens. The `public` schema is currently empty — no migrations have been applied.

### State & persistence (the single source of truth)
`src/store/useAppStore.ts` is a Zustand store with `persist` middleware. It holds the entire app domain (user, tasks, courses, categories, schedules, preferences, widgets, achievements, chat). It seeds from dummy data in `src/lib/data.ts` on first load. Two independent LocalStorage keys exist:
- `smart-study-planner-store` — the Zustand store (persist middleware)
- `smart-study-planner-token` — the mock JWT, written directly by `src/services/auth/authService.ts`

When debugging auth/state weirdness, clearing **both** keys is usually the fix.

Every task mutation (`addTask`/`updateTask`/`completeTask`) runs through the local `score()` helper, which **recomputes `priorityScore` and `updatedAt`**. Don't set `priorityScore` manually — go through the store actions so it stays consistent.

### Auth gating happens in the layout component, not middleware
`src/components/layout/AppShell.tsx` is the gate. It waits for Zustand hydration (`persist.hasHydrated()`), then `router.replace("/auth/login")` if `!isAuthenticated`. **Any new authenticated page must render its content inside `<AppShell>`** or it won't be protected. The root `/` (`src/app/page.tsx`) simply `redirect`s to `/auth/login`. `AppShell` also owns the nav: `appRoutes` (desktop sidebar + mobile drawer) and `mobileQuickRoutes` (bottom bar) — add new pages to these arrays to make them reachable.

### Pages are thin wrappers
Files under `src/app/*/page.tsx` are mostly one-liners that render a component from `src/components/`. Notably, several distinct routes (category, widget, themes, account, achievement, premium, settings) all import their component from the single **`src/components/feature/FeaturePage.tsx`** — look there, not for a per-feature folder.

### "AI" is rule-based mock behind internal API routes
The frontend never calls an AI provider. `src/services/ai/aiService.ts` POSTs to internal routes `src/app/api/ai/analyze/route.ts` and `.../chat/route.ts`, which return **deterministic rule-based responses** (chat branches on keyword `includes`; analyze derives everything from `priorityScore`). To make AI real, implement the provider call inside these route handlers — the client contract stays the same.

### Core domain logic (pure functions in `src/utils/`)
- **`priorityScore.ts`** — the weighted scoring formula: `deadline*0.40 + priority*0.25 + difficulty*0.15 + duration*0.10 + statusRisk*0.10`, clamped 0–100. `status === "Selesai"` forces score 0. `scoreToPriority` and `riskLevel` bucket the score. This is the heart of the app; the store, both API routes, and sorting all depend on it.
- **`smartSchedule.ts`** — rule-based session generator: sorts active tasks by score, splits into 45–90 min sessions, respects `preference.maxStudyHoursPerDay` and `productiveTime` start hour.
- **`date.ts`** — all date handling (date-fns, `id` locale). `sortTasks` (score desc, then deadline asc) is the canonical task ordering used everywhere.

## Gotchas

- **Domain string literals are load-bearing.** `TaskStatus` values are Indonesian (`"Belum Mulai"`, `"Selesai"`, `"Terlambat"`) while `Priority`/`Difficulty` are English. These strings are keys into the maps in `priorityScore.ts` and are matched by equality across the app (e.g. `status === "Selesai"`). Changing a literal means updating every map and comparison. Types live in `src/types/index.ts`.
- Components touching the store must be Client Components (`"use client"`), as must anything using `AppShell`.
- `resetDemoData()` reseeds domain data from `src/lib/data.ts` but preserves the current auth session.
