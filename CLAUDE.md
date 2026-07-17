# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Authoritative documentation lives in `docs/`** — start at `docs/ALL_DOCUMENTATION.md`. `docs/20_PROJECT_CONSTITUTION.md` contains binding rules (read it before architectural changes), and `docs/AI_ARCHITECTURE_FREEZE.md` (APPROVED) is the implementation contract for all AI work. This file is a condensed orientation, not a substitute.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # next lint (ESLint, eslint-config-next)
npx tsc --noEmit # Type-check (no npm script for this)
```

There is no test runner configured. Setup: `npm install`, then `cp .env.example .env.local` and fill `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (auth won't work without them) and `OCR_SPACE_API_KEY` (image OCR).

**NEVER run `npm run build` while `next dev` is running.** They share the same `.next/` directory — the build wipes the dev server's chunks, and the still-running dev server then serves HTML pointing at CSS/JS files that no longer exist (symptom: completely unstyled pages, 404 on `/_next/static/css/...`). This actually happened (see docs/18_CHANGELOG.md). Recovery: stop the dev server, delete `.next/`, restart. To verify a build, stop dev first.

Demo login: `demo@smartstudy.app` / `password123` (the "Masuk sebagai Demo" button on the login page). Auth is real Supabase Auth — arbitrary emails/fake domains are rejected. "Confirm email" is OFF in the Supabase dashboard for now (no SMTP provider configured; revisit before production).

## Big Picture

Smart Study Planner is a Next.js 14 App Router / TypeScript / Tailwind / Zustand app with a **local-first architecture — this is final, not transitional** (Constitution Pasal 1, ADR-001/002 in `docs/21_ARCHITECTURAL_DECISIONS.md`):

- **Supabase = Authentication + `profiles` only.** A plan to migrate app data to Supabase was considered and **cancelled**. Never store app data (tasks, categories, files, OCR text, AI content) in Supabase — the one sanctioned future exception is the `ai_usage_log` rate-limit counter (AI freeze §7.4). The other 10 tables in the schema are obsolete leftovers: empty, unused by any code, kept deliberately (dropping them needs explicit approval — Pasal 4).
- **App data** lives in the Zustand store (`src/store/useAppStore.ts`; `persist` → localStorage key `smart-study-planner-store`, `version: 1` with a v0→v1 category migration; `partialize` excludes `documents`).
- **Uploaded file blobs + extraction results** live in IndexedDB (DB `smart-study-planner`, `DB_VERSION 2`: `files` + `documents` stores) via `src/lib/indexedDb.ts`.

UI copy and many domain string literals are **Bahasa Indonesia**. Path alias: `@/*` → `./src/*`.

### `lib/` vs `services/` — the security boundary
`src/lib/` = low-level infrastructure, may be **server-only**; any code that touches provider API keys (`lib/ai/`, `lib/ocr/`, `lib/document/`) MUST live here and must never be imported by client-side code. `src/services/` = client-side business logic that reaches the server only through internal API routes via `fetch`. Follow this split for anything new.

### Document Processing Pipeline (Sprint 1–3, fully working)
Upload (drag&drop, `src/hooks/useFileUpload.ts`) → validate + detect 5 categories (`lib/upload/config.ts`: image/pdf/document/spreadsheet/presentation, max 10MB) → blob saved to IndexedDB `files` → **automatic, non-blocking** `services/document/documentService.ts` → `POST /api/document/process` (server boundary, the only caller of `lib/document/getDocumentProcessor.ts`) → processor extracts text:

- `image` → OCR.Space (`lib/ocr/providers/ocrSpaceProvider.ts`, needs `OCR_SPACE_API_KEY`)
- `pdf` → `pdf-parse` (digital PDFs only; scanned PDFs return `EMPTY_RESULT`, no OCR fallback)
- `document` → `mammoth` (.docx) / `word-extractor` (.doc, best-effort)
- `spreadsheet` → `xlsx` (SheetJS, installed from the official SheetJS CDN, not npm — CVE reasons, see `docs/14_DEPENDENCIES.md`)
- `presentation` → custom `jszip`+`fast-xml-parser` parser (.pptx); legacy `.ppt` permanently rejected (`NOT_IMPLEMENTED`)

The result is a `DocumentRecord` (including extracted text) in IndexedDB `documents` — the single source of truth. The Zustand `documents` field is a **non-persisted reactive mirror**, hydrated by `useFileUpload` on mount. Failures are returned as data (`errorCode`/`errorMessage`), never thrown — same convention as `OCRResult`.

**Gotcha:** `next.config.mjs` needs `experimental.serverComponentsExternalPackages: ["pdf-parse", "@napi-rs/canvas"]` — without it the **whole** `/api/document/process` route breaks (not just PDFs), because the factory imports every processor statically.

### Supabase connection
`src/lib/supabase/client.ts` (Client Components) and `server.ts` (Route Handlers) are the two entry points; root `middleware.ts` + `src/lib/supabase/middleware.ts` only refresh the session cookie — **no route protection there**. Only `profiles` is ever read/written (in `services/auth/authService.ts`). Regenerate `src/lib/supabase/database.types.ts` manually after any schema change — it is not auto-synced.

### Auth gating happens in AppShell, not middleware
`src/components/layout/AppShell.tsx` waits for Zustand hydration (`persist.hasHydrated()`), redirects to `/auth/login` if `!isAuthenticated`, and subscribes to `supabase.auth.onAuthStateChange` as a safety net. **Any new authenticated page must render inside `<AppShell>`** (and be added to its `appRoutes` nav array). `/onboarding` is the one page that does its own hydration+auth check without AppShell. No API route checks auth server-side today — a documented gap (`docs/15_SECURITY.md`); Milestone D closes it for the new AI routes.

### "AI" today is rule-based; the real AI architecture is APPROVED but not yet built
`/api/ai/analyze` and `/api/ai/chat` return deterministic rule-based responses (analyze derives everything from `priorityScore`; chat branches on keyword `includes`). `services/ai/aiService.ts` is the thin client bridge. `lib/ai/getAIProvider.ts` + provider stubs exist but are **not wired into the live routes**.

The full AI design (Summary → Flashcard → Quiz → Recommendation, chunking, caching, auth + rate limiting) is frozen and **APPROVED** in `docs/AI_ARCHITECTURE_FREEZE.md` — implement against that contract (Milestones A–E), do not improvise. Approved decisions: quiz uses `correctIndex`; the AI output for recommendations is one polymorphic `recommendations[]` array (storage stays two typed arrays); `"Study"` items map to `AITaskSuggestion`.

**Milestones A–E are done — the full AI feature set is live.** Provider AI (Gemini) is reachable from guarded routes and triggered by the UI. Default `AI_PROVIDER=mock` keeps everything free/rule-based; set `AI_PROVIDER=gemini` + `GEMINI_API_KEY` for real AI.
- **A** — AI domain types + output contracts in `src/types/index.ts` (plus optional `sourceDocumentId`/`sourceSuggestionId` on `Task`/`StudySession`); `lib/ai/prompts/*` (Prompt Builders, pure; version constants in `prompts/versions.ts`); `lib/ai/chunking.ts`.
- **B** — IndexedDB `DB_VERSION 3` (4 `ai_*` stores); `services/ai/aiRepository.ts` (client-only gate); `lib/ai/cache.ts` (SHA-256 + cache validity); Supabase table `ai_usage_log` (rate-limit counter — the one sanctioned exception to "Supabase = auth only").
- **C** — `AIProvider` interface (`summarize`/`generateFlashcards`/`generateQuiz`/`recommend`; old `summarizeDocument` removed); `providers/mock.ts` + real `providers/gemini.ts` (raw fetch, no SDK, `GEMINI_MODEL` default `gemini-flash-latest`, needs `GEMINI_API_KEY`).
- **D** — 4 routes `app/api/ai/{summary,flashcard,quiz,recommendation}` gated by `lib/ai/guard.ts` (**auth 401 → rate-limit 429/503 fail-closed, before any provider call**); `lib/ai/{validation,generate,errors}.ts` (JSON Schema + business validation + retry-once, no retry on provider rate-limit); 4 client services `services/ai/*Service.ts` (cache-check, chunking orchestration, domain-record assembly, polymorphic→two-array mapping for recommendations). `AI_DAILY_REQUEST_LIMIT` env (default 50).
- **E** — UI in `components/ai/*` (`AIDocumentPanel` + Flashcard/Quiz/Recommendation views + `AIStates`), shown per-document in `UploadFileItem` for `completed` docs. "Add to Tasks/Calendar" → `addTask`/`addStudySession` with `sourceDocumentId`/`sourceSuggestionId`, marks suggestion `applied`. `/api/ai/chat` now calls `getAIProvider().chat()` (rule-based logic moved into `mock.chat`; real `gemini.chat`); chat route auth-only (`requireAIAuth`), not rate-limited. Store gained `addStudySession`.

Server-only rule reminder: `lib/ai/*` (providers, guard, generate, validation, prompts) must never be imported by client code; `services/ai/*` and `components/ai/*` (client) reach the routes only via `fetch`, and read cached AI results via `aiRepository`. Services import only prompt **version constants** (`prompts/versions.ts`), never the prompt builders.

The AI backend is complete. Remaining work is non-AI backlog + polish — see `docs/17_TECH_DEBT.md` (AI section) for known limitations (non-atomic usage counter, chat not rate-limited, debug panel still shown, default-heavy task mapping).

### State & core domain logic
One Zustand store holds the entire app domain. Every task mutation (`addTask`/`updateTask`/`completeTask`) runs through the internal `score()` helper which recomputes `priorityScore` + `updatedAt` — **never set `priorityScore` manually**. Pure domain logic lives in `src/utils/`: `priorityScore.ts` (weighted formula `deadline*0.40 + priority*0.25 + difficulty*0.15 + duration*0.10 + statusRisk*0.10`, clamped 0–100, `"Selesai"` forces 0 — the heart of the app), `smartSchedule.ts` (rule-based session generator), `date.ts` (`sortTasks` is the canonical ordering). All domain types live in the single file `src/types/index.ts` — do not create per-feature type files (exception by contract: `lib/ai/prompts/types.ts` holds prompt-layer types per AI freeze §5.1).

### Pages are thin wrappers
`src/app/*/page.tsx` files mostly just render a component from `src/components/` inside `<AppShell>`. Seven routes (category/widget/themes/account/achievement/premium/settings) all import from the single `src/components/feature/FeaturePage.tsx`. Exception with real logic in the page file: `src/app/tasks/[id]/page.tsx`.

## Gotchas

- **Domain string literals are load-bearing.** `TaskStatus` values are Indonesian (`"Belum Mulai"`, `"Selesai"`, `"Terlambat"`); `Priority`/`Difficulty` are English. They are keys into maps in `priorityScore.ts` and compared by equality across the app — changing one literal means updating every map and comparison.
- **"Mata Kuliah" no longer exists in the task form** — it's "Aktivitas" (options come from `categories[].activities`). The chosen activity text is stored into the legacy `task.courseId`/`task.courseName` fields (misleading names — known debt, `docs/17_TECH_DEBT.md`). The `Course` type / `courses` state is dead code kept deliberately.
- Components touching the store must be Client Components (`"use client"`), as must anything using `AppShell`.
- `resetDemoData()` reseeds domain data but preserves the auth session, and does **not** clear IndexedDB blobs/documents (known gap).
- Two localStorage layers: `smart-study-planner-store` (Zustand) and `sb-<project-ref>-auth-token` (Supabase's own session). Debug auth weirdness by checking both.
- Destructive cleanups (dropping obsolete Supabase tables, deleting "unused" code) require explicit approval first — Constitution Pasal 4.
