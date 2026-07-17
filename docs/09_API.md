# API

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

## Ringkasan

Aplikasi ini punya 7 API route internal: 6 di `src/app/api/ai/` dan 1 di `src/app/api/document/`. Tidak ada endpoint lain (tidak ada `/api/tasks`, dll — karena semua data aplikasi diakses langsung dari Zustand di sisi klien, tanpa lewat API, kecuali yang memang butuh eksekusi server-side untuk menyembunyikan API key: AI dan OCR).

Dua route AI lama (`/api/ai/analyze`, `/api/ai/chat`) masih **rule-based**. Empat route AI baru (`/api/ai/{summary,flashcard,quiz,recommendation}`, Milestone D) **memanggil provider AI sungguhan** lewat `getAIProvider()` (mock default; Gemini bila `AI_PROVIDER=gemini`). `/api/document/process` memanggil OCR.Space sungguhan (kategori `image`).

## `POST /api/ai/analyze`

**Tujuan:** menghasilkan "analisis AI" untuk satu task (dipanggil dari tombol "Analisis AI" di halaman detail task dan form tambah task).

| | |
|---|---|
| **Input** | `{ task: Task }` (task lengkap dari klien, termasuk `priorityScore` yang sudah dihitung) |
| **Output** | `AIAnalysis` — `{ id, taskId, summary, recommendedPriority, reason, steps[], tips[], estimatedDurationMinutes, riskLevel, warning?, createdAt }` |
| **Validasi** | Tolak (400) kalau `task.title` atau `task.deadlineDate` kosong |
| **Logika** | `riskLevel()` dan `scoreToPriority()` dari `utils/priorityScore.ts` — **bukan** panggilan AI, murni turunan dari `priorityScore` yang sudah ada. `steps`/`tips` adalah teks statis yang sama untuk semua task. `warning` hanya muncul kalau `riskLevel === "high"`. |
| **Dependensi** | `utils/id.ts` (`createId`), `utils/date.ts` (`nowISO`), `utils/priorityScore.ts` |

## `POST /api/ai/chat`

**Tujuan:** balasan chat untuk AI Assistant.

| | |
|---|---|
| **Input** | `{ message?: string, tasks?: Task[], history?: ChatMessage[] }` |
| **Output** | `{ reply: string }` |
| **Auth** | **Wajib login** (Milestone E) — `requireAIAuth()` → 401 tanpa sesi. **Tanpa** rate-limit harian (chat murah & sering; hanya route dokumen yang di-rate-limit — §16 E). |
| **Logika** | Milestone E: memanggil `getAIProvider().chat(message, tasks, history)`. `AI_PROVIDER=gemini` → jawaban LLM sungguhan (konteks tugas + riwayat disuntik ke prompt). `AI_PROVIDER=mock` (default) → logika keyword rule-based yang **dipindah dari route ini ke `mock.chat`** (perilaku lama dipertahankan, tanpa biaya). |
| **Dependensi** | `lib/ai/guard.ts` (`requireAIAuth`), `lib/ai/getAIProvider.ts` |

## `POST /api/document/process`

**Tujuan:** batas server untuk `DocumentProcessor` (Strategy Pattern Document Pipeline) — satu-satunya tempat processor (khususnya `imageProcessor`, yang memanggil OCR.Space) boleh dieksekusi, karena butuh `OCR_SPACE_API_KEY` yang tidak boleh sampai ke browser. Detail lengkap alurnya: `docs/SPRINT_1_ARCHITECTURE_FREEZE.md` §13 "OCR Pipeline".

| | |
|---|---|
| **Input** | `multipart/form-data` — field `file` (Blob), `meta` (JSON string dari `UploadedFileMeta`), `category` (`DocumentCategory`) |
| **Output** | `ProcessorResult` — `{ status: "extracted"\|"needs_ocr"\|"failed", rawText?, pageCount?, confidence?, provider?, processingTimeMs?, errorCode?, errorMessage? }` |
| **Validasi** | Tolak (400) kalau `file`/`meta`/`category` tidak lengkap, `category` bukan salah satu dari 5 `DocumentCategory`, atau `meta` bukan JSON valid |
| **Logika** | `getDocumentProcessor(category).process(file, meta)` — untuk `image`, ini memanggil `getOCRProvider().extractText()` (OCR.Space) sungguhan; untuk `pdf`/`document`/`spreadsheet`/`presentation` memanggil parser lokal sungguhan (Sprint 2: `pdf-parse`, `mammoth`/`word-extractor`, `xlsx`, `jszip`+`fast-xml-parser`) — hanya `.ppt` legacy yang ditolak permanen (`NOT_IMPLEMENTED`), lihat [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md) |
| **Dependensi** | `lib/document/getDocumentProcessor.ts`, `lib/document/processors/*`, transitif `lib/ocr/*` |
| **Pemanggil** | `services/document/documentService.ts` (client) — **bukan** komponen UI langsung, sama pola dengan `services/ai/aiService.ts` |

**Tidak ada auth check server-side** di route ini — sama seperti `/api/ai/analyze` & `/api/ai/chat` (route AI baru Milestone D **sudah** ber-auth, lihat bawah). Ini gap keamanan yang sudah didokumentasikan ([15_SECURITY](./15_SECURITY.md)), bukan regresi baru.

## Route AI baru (Milestone D) — `POST /api/ai/{summary,flashcard,quiz,recommendation}`

Empat route batas-server untuk fitur AI berbasis dokumen (`AI_ARCHITECTURE_FREEZE.md` §7.3). **Berbeda dari route lama, keempatnya WAJIB melewati dua gerbang sebelum menyentuh Prompt Builder/provider**, lewat `guardAIRoute()` (`src/lib/ai/guard.ts`):

1. **Auth check** — `lib/supabase/server.ts` → `supabase.auth.getUser()`. Tanpa sesi valid → **401** (`UNAUTHORIZED`). Provider tidak pernah dipanggil tanpa sesi (diverifikasi: keempat route mengembalikan 401 untuk request tanpa cookie, bahkan sebelum validasi body).
2. **Rate-limit / Cost Control** — baca+naikkan counter harian di tabel Supabase `ai_usage_log` untuk `(user_id, hari ini)`. Lewat batas (`AI_DAILY_REQUEST_LIMIT`, default 50) → **429** (`DAILY_LIMIT`). Kalau pengecekan rate-limit **sendiri gagal** (Supabase bermasalah) → **fail-closed 503** (`RATE_LIMIT_UNAVAILABLE`), bukan diloloskan. Counter dinaikkan **sebelum** provider dipanggil, sekali per permintaan (tiap chunk dokumen panjang = 1).

Setelah kedua gerbang lolos: validasi input (400) → Prompt Builder → `getAIProvider().{summarize,generateFlashcards,generateQuiz,recommend}()` → **Validation Pipeline** (parse toleran code-fence → JSON Schema → Business Validation, dengan **retry 1×** untuk kegagalan format/transient, **tanpa** retry untuk provider rate-limit — §17.4/§17.6) → response JSON.

| Route | Input | Output |
|---|---|---|
| `POST /api/ai/summary` | `{ documentId, mode: "direct"\|"chunk"\|"merge", text?, partials?, index?, total?, meta? }` | `AISummaryOutput` + `{provider, model, tokenUsage}` (mode chunk: `{summary, ...}`) |
| `POST /api/ai/flashcard` | `{ documentId, summary: AISummary, count? }` | `AIFlashcardSetOutput` + generation meta |
| `POST /api/ai/quiz` | `{ documentId, summary: AISummary, count? }` | `AIQuizSetOutput` + generation meta |
| `POST /api/ai/recommendation` | `{ documentId, summary: AISummary }` | `AIRecommendationOutput` (polymorphic) + generation meta |

Response route **hanya** membawa AI Output Contract + metadata generasi (`provider`/`model`/`tokenUsage`). Field storage (`id`, `documentId`, `sourceTextHash`, `promptVersion`, `generationStrategy`, timestamps) ditambahkan oleh Service client (`services/ai/*`), bukan dikembalikan route — server tidak pernah menyimpan hasil AI (§7.2). Semua error dikembalikan sebagai `{ error: true, errorCode, message }` dengan pesan Bahasa Indonesia ramah, tidak pernah JSON mentah/stack trace (§17.5). Pemanggil: `services/ai/{documentSummary,flashcard,quiz,recommendation}Service.ts` — **bukan** komponen UI langsung.

## Kontrak yang harus dijaga kalau AI diaktifkan sungguhan

Client (`src/services/ai/aiService.ts`) memanggil kedua route ini lewat `fetch` biasa dan mengharapkan bentuk response persis seperti di atas. Rencana mengaktifkan AI sungguhan (lihat `src/lib/ai/types.ts`, dijelaskan di [11_SERVICES](./11_SERVICES.md)) sengaja dirancang supaya **kontrak input/output route ini tidak berubah** — hanya logika di dalam route yang diganti dari rule-based menjadi pemanggilan provider AI sungguhan.

## Kenapa tidak ada API route untuk data lain (task, kategori, dll)

Karena data aplikasi tidak melewati server sama sekali — komponen React langsung baca/tulis ke Zustand store (yang persist ke localStorage). Ini konsisten dengan keputusan arsitektur "local-first" di [03_ARCHITECTURE](./03_ARCHITECTURE.md). Kalau data-layer suatu saat dipindah ke backend sungguhan, di sinilah API route baru (`/api/tasks`, dst.) akan ditambahkan — belum ada rencana konkret untuk ini (lihat [16_ROADMAP](./16_ROADMAP.md), keputusan saat ini justru sebaliknya: tetap lokal).
