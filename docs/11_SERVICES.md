# Services

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

`src/services/` = logika bisnis yang bicara ke "dunia luar" (network, browser storage API) atas nama fitur tertentu. Beda dengan `src/lib/` (klien/infrastruktur tingkat rendah tanpa pengetahuan domain) — lihat [02_FOLDER_STRUCTURE](./02_FOLDER_STRUCTURE.md) untuk perbandingan langsungnya.

## `services/auth/authService.ts` — satu-satunya pintu ke Supabase Auth

**Tanggung jawab:** `login`, `register`, `logout`. Tidak lebih — sesuai batasan Supabase-hanya-untuk-auth ([04_AUTHENTICATION](./04_AUTHENTICATION.md)). Memakai `lib/supabase/client.ts` untuk komunikasi sebenarnya, plus menerjemahkan pesan error Supabase (bahasa Inggris) ke Bahasa Indonesia untuk kasus umum.

**Hubungan:** dipanggil dari `src/app/auth/login/page.tsx` dan `src/app/auth/register/page.tsx`. Hasil sukses diteruskan ke `useAppStore().authenticate()` untuk mengisi state Zustand.

## `services/storage/storageService.ts` — dua tanggung jawab berbeda dalam satu file

File ini punya dua kelompok fungsi yang **tidak saling bergantung**, cuma kebetulan berada di file yang sama karena sama-sama "urusan storage":

1. **Export (lama):** `downloadJSON`, `downloadCSV` — generate `Blob` lalu trigger download lewat `<a download>`. Dipakai di halaman Settings untuk backup data.
2. **File upload (baru):** `saveFileToStorage`, `getFileFromStorage`, `deleteFileFromStorage`, `listStoredFileIds` — wrapper tipis di atas `lib/indexedDb.ts`. Dipakai oleh `useFileUpload` hook.

Kalau file ini terus bertambah fungsi yang tidak berhubungan, pertimbangkan dipecah jadi `exportService.ts` dan `fileStorageService.ts` — belum dilakukan karena ukurannya masih kecil.

## `services/ai/aiService.ts` — client tipis ke API route

Cuma dua fungsi (`analyzeTask`, `askAI`), masing-masing `fetch` ke `/api/ai/analyze` dan `/api/ai/chat` (lihat [09_API](./09_API.md)). Tidak ada logika AI di sini sama sekali — semuanya di server (route handler). File ini murni jembatan network dari komponen ke API.

## Abstraksi OCR Provider — pindah dari `services/ocr/` ke `lib/ocr/` (Sprint 1)

Semula interface `OCRProvider`/`OCRResult` ditaruh di `services/ocr/types.ts` — waktu itu wajar karena belum ada implementasi apa pun (murni kontrak, tidak ada risiko). Begitu implementasi sungguhan (`OCRSpaceProvider`) ditulis dan butuh membawa `OCR_SPACE_API_KEY`, lokasinya dipindah ke `src/lib/ocr/` supaya konsisten dengan alasan yang sama persis seperti abstraksi AI Provider di bawah — kode pemegang API key tidak boleh tinggal di `services/`. `services/ocr/` sudah tidak ada lagi.

**Isi `lib/ocr/`:**

- `types.ts` — interface `OCRProvider` (`extractText(file, meta): Promise<OCRResult>`) dan `OCRResult`. `OCRResult` diperluas dari desain awal (`text`, `confidence`, `pageCount`) menjadi `success`, `extractedText`, `confidence?`, `pageCount?`, `provider`, `processingTimeMs?`, `errorCode?`, `errorMessage?`, `rawResponse?` — supaya kegagalan operasional (rate limit, HTTP error, dst.) bisa direpresentasikan sebagai data yang di-*resolve*, bukan exception yang dilempar. **Konvensi:** `extractText()` selalu resolve; cek `result.success`, jangan andalkan try/catch untuk kegagalan OCR yang wajar.
- `config.ts` — `OCR_SUPPORTED_MIME_TYPES` + `isSupportedForOCR()`, validasi tipe file sebelum memanggil provider apa pun (provider-agnostic, dipakai lintas provider OCR).
- `getOCRProvider.ts` — factory, baca env var `OCR_PROVIDER` (default `"ocrspace"`), pilih implementasi. Pola identik `getAIProvider.ts`.
- `providers/ocrSpaceProvider.ts` — implementasi pertama dan satu-satunya saat ini. Endpoint resmi `https://api.ocr.space/parse/image`, `multipart/form-data`, timeout 30 detik lewat `AbortController`. Menangani: API key kosong, tipe file tak didukung, HTTP error, rate limit (HTTP 429), timeout, kegagalan jaringan, `IsErroredOnProcessing`/`OCRExitCode` gagal, dan hasil kosong — semuanya dipetakan ke `errorCode` yang konsisten, tidak pernah meneruskan JSON mentah OCR.Space ke pemanggil di luar `rawResponse` (field debug eksplisit).

**Update Sprint 3:** provider ini **sudah tersambung** — dipanggil oleh `imageProcessor` (`lib/document/processors/imageProcessor.ts`) lewat route `/api/document/process`, diverifikasi end-to-end dengan API key sungguhan (bukan cuma mock `fetch`). Detail alur lengkap: `docs/SPRINT_1_ARCHITECTURE_FREEZE.md` §13.

## `services/document/` — orchestrator client + repository IndexedDB

- `documentService.ts` — `processDocument(meta)`, orchestrator **client-only**. Tidak pernah mengimpor `lib/document/*` (yang server-only) — berkomunikasi dengan processor lewat `fetch("/api/document/process")`, pola identik `services/ai/aiService.ts`. Menulis `DocumentRecord` lewat `documentRepository`.
- `documentRepository.ts` — `IndexedDbDocumentRepository`, satu-satunya pintu baca/tulis store IndexedDB `documents`. Wajib client-only (IndexedDB tidak ada di runtime server), sehingga tetap di `services/` meskipun `lib/document/` (processor) sudah pindah ke server-only — dua alasan yang berlawanan, kebetulan sama-sama membuat sebuah modul tidak boleh dipakai lintas boundary client/server.
- `types.ts` — hanya interface `DocumentRepository`. `DocumentProcessor` **tidak lagi di sini**, lihat `lib/document/` di bawah.

## `lib/document/` — Strategy Pattern processor, server-only sejak OCR tersambung

Awalnya (`Milestone 2`) seluruh `DocumentProcessor`/`getDocumentProcessor.ts`/`processors/*` ada di `services/document/`, karena saat itu semua processor cuma stub tanpa secret. Begitu `imageProcessor` memanggil `getOCRProvider()` (Sprint 3), seluruh grup ini pindah ke `lib/document/` — alasan sama persis dengan `lib/ai/`/`lib/ocr/`: kode yang *mungkin* menyentuh API key tidak boleh tinggal di `services/`, dan karena factory memilih processor lewat satu `Record` yang sama, lebih aman memindahkan seluruh grup daripada mencoba menjaga sebagian processor "aman" dan sebagian tidak dalam satu modul.

- `types.ts` — interface `DocumentProcessor`.
- `getDocumentProcessor.ts` — factory, `Record<DocumentCategory, DocumentProcessor>`, dipanggil **hanya** dari `src/app/api/document/process/route.ts`.
- `processors/imageProcessor.ts` — memanggil `getOCRProvider().extractText()` (OCR.Space, Sprint 3).
- `processors/{pdf,documentFile,spreadsheet,presentation}Processor.ts` — implementasi nyata sejak Sprint 2 (`pdf-parse`, `mammoth`/`word-extractor`, `xlsx`, `jszip`+`fast-xml-parser`); hanya `.ppt` legacy yang ditolak permanen (`NOT_IMPLEMENTED`). Detail: [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md) bagian "Local Parser".

## Abstraksi AI Provider — kenapa di `lib/`, bukan `services/`

`src/lib/ai/` (`types.ts`, `getAIProvider.ts`, `providers/*.ts`) sengaja **tidak** ditaruh di `services/` meskipun secara konsep mirip "layanan AI". Alasannya: kode ini **harus** jalan di server (Route Handler), tidak boleh pernah diimpor oleh kode client-side, karena akan memuat API key provider AI (`OPENAI_API_KEY`, dst.) yang tidak boleh sampai ke browser. Menaruhnya di `lib/` (yang secara konvensi project ini dipahami sebagai "infrastruktur tingkat rendah") membantu mengingatkan batasan ini. Detail keamanan: [15_SECURITY](./15_SECURITY.md).

**Isi abstraksi ini:**

- `types.ts` — interface `AIProvider` + tipe generik `GenerateOptions`/`AIGenerationResult`. **Update Milestone C:** method lama `summarizeDocument()` (dan tipe `DocumentSummary`) **dihapus** (superseded, Lampiran #4 freeze), diganti empat method eksplisit per fitur: `summarize`/`generateFlashcards`/`generateQuiz`/`recommend`, masing-masing menerima `PromptSpec` (dari `lib/ai/prompts/*`) + `GenerateOptions` dan mengembalikan `AIGenerationResult` (`{ raw, parsed?, tokenUsage?, provider, model, finishReason? }`). `analyzeTask`/`chat` dipertahankan (dipakai route rule-based yang ada; `chat` disambungkan sungguhan di Milestone E).
- `getAIProvider.ts` — factory, baca env var `AI_PROVIDER`, pilih implementasi. Belum dipanggil route manapun sampai Milestone D.
- `providers/mock.ts` — provider default, **berfungsi penuh**: keempat method dokumen mengembalikan JSON valid sesuai schema §17.3 (dibangun duluan supaya Milestone D bisa diuji tanpa API key).
- `providers/gemini.ts` — **implementasi sungguhan (Milestone C)**: raw `fetch` ke REST API Generative Language (`x-goog-api-key` header, `responseMimeType: application/json` + `responseSchema` yang disanitasi ke subset Gemini via `toGeminiSchema`, timeout 60 dtk `AbortController`, mapping `usageMetadata` → `tokenUsage`). Model dari `GEMINI_MODEL` (default `gemini-flash-latest`, alias selalu-terkini). `analyzeTask`/`chat`-nya sengaja melempar error "Milestone E" (di luar cakupan C). **Diverifikasi live end-to-end** (Milestone C, 17 Juli 2026) dengan API key sungguhan: `summarize()` menghasilkan JSON valid sesuai schema + `tokenUsage` nyata. Tetap belum "live" di aplikasi — tidak ada route yang memanggilnya sampai Milestone D.
- `providers/{openai,anthropic,openrouter}.ts` — stub, keempat method melempar error jelas ("belum dikonfigurasi"). Belum ada logika API sungguhan.

**Penting:** factory ini **belum dipanggil** oleh route `/api/ai/*` yang hidup — route itu masih 100% rule-based seperti sebelumnya (dikonfirmasi tidak berubah perilakunya). Meski provider `gemini` sekarang nyata (Milestone C), tidak ada route/UI yang memicunya sampai Milestone D/E — jadi perilaku aplikasi bagi pengguna belum berubah sama sekali.

**Update Milestone A (Juli 2026):** `lib/ai/` kini juga berisi `prompts/` (Prompt Builder — `PromptSpec` pure function per fitur AI: summary 3-mode, flashcard, quiz, fragmen task/calendar, recommendation — lihat `AI_ARCHITECTURE_FREEZE.md` §5/§17) dan `chunking.ts` (pemecah teks dokumen panjang, §6). Keduanya murni additive dan **belum dipanggil kode manapun** — pemakainya menyusul di Milestone C–D. Tipe domain AI (`AISummary`, `AIFlashcardSet`, dst.) ada di `src/types/index.ts` sesuai konvensi satu-file-tipe; tipe lapisan prompt (`PromptSpec`, `JSONSchema`) di `lib/ai/prompts/types.ts` sesuai kontrak freeze §5.1.

**Update Milestone B (Juli 2026):** lapisan penyimpanan AI ditambahkan, semuanya masih **belum dipanggil kode manapun** (pemakainya = 4 AI service di Milestone D):
- `lib/indexedDb.ts` — `DB_VERSION` 2→3, 4 store `ai_*` (key = `documentId`) + fungsi CRUD low-level (`put/get/delete` per store).
- `services/ai/aiRepository.ts` (`IndexedDbAIRepository` + interface `services/ai/types.ts`) — satu-satunya pintu baca/tulis keempat store AI, pola identik `documentRepository`. Client-only (IndexedDB tidak ada di server). Termasuk `deleteAllForDocument()` untuk bersih-bersih saat dokumen dihapus (Milestone E).
- `lib/ai/cache.ts` — `computeSourceTextHash()` (SHA-256 Web Crypto atas teks yang di-normalize whitespace, tanpa dependency baru), `isSummaryCacheValid()` (cocok `sourceTextHash` + `promptVersion`), `isDerivedCacheValid()` (cocok `summaryId` — validitas transitif untuk flashcard/quiz/recommendation). Pure, §9.1.
- Supabase: tabel `ai_usage_log` (counter rate-limit, lihat [05_DATABASE](./05_DATABASE.md)/[04_AUTHENTICATION](./04_AUTHENTICATION.md)) + `database.types.ts` diregenerasi.

**Update Milestone D (Juli 2026):** lapisan Service AI + route + guard aktif — pertama kalinya provider AI benar-benar terpanggil dari route (masih belum ada UI yang memicunya sampai Milestone E). Semua **client-only** di `services/ai/`:
- `documentSummaryService.ts` — `generateSummary(documentId, options?)`, orchestrator termasuk cache-check (§9), hitung SHA-256 di client, dan orkestrasi chunking §6.3 (direct / chunked / hierarchical). SATU-SATUNYA tempat teks mentah dikirim ke AI.
- `flashcardService.ts` / `quizService.ts` / `recommendationService.ts` — `generateX(documentId, options?)`, memakai `AISummary` (bukan teks mentah), cache transitif via `summaryId`. `recommendationService` memetakan output polymorphic → dua array penyimpanan (`taskSuggestions`/`calendarSuggestions`, §17.2).
- `aiApi.ts` — jembatan `fetch` tipis ke route sendiri (pola `services/ai/aiService.ts`).

Modul server-only pendukung route (di `lib/ai/`, tidak boleh diimpor client): `guard.ts` (Auth 401 + Rate-limit 429/503 fail-closed, §7.3), `validation.ts` (validator JSON Schema subset + business validators, tanpa dependency), `generate.ts` (Validation Pipeline + retry 1× + akumulasi token, §17.4/§17.6), `errors.ts` (`AIProviderError` bertipe supaya rate-limit vendor tidak di-retry). Route di `src/app/api/ai/{summary,flashcard,quiz,recommendation}/route.ts` — detail kontrak: [09_API](./09_API.md).

**Catatan known-gap:** increment `ai_usage_log` di `guard.ts` memakai read-then-upsert (bukan atomik) — ada race kecil kalau dua request bersamaan; diterima untuk MVP single-user, dicatat di [15_SECURITY](./15_SECURITY.md).
