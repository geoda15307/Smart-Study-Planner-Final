# Roadmap

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Perbandingan status setiap item yang pernah direncanakan untuk project ini, berdasarkan kondisi repository saat ini — bukan asumsi.

## ✅ Selesai

| Item | Catatan |
|---|---|
| Refactor Task Card (hapus lalu kembalikan sebagian field) | Progress bar + Priority Score dikembalikan setelah sempat dihapus, atas permintaan |
| Perbaikan bug icon kategori | Kemudian dikembangkan lebih jauh (collaborator) jadi sistem Lucide icon + "Aktivitas" per kategori |
| Perbaikan sistem tema (real-time, persisten, dark mode) | Root cause: state tersimpan tapi tidak pernah diterapkan ke DOM — sudah diperbaiki dengan CSS variable |
| Redesign halaman detail task | Accent border prioritas, skor berwarna sesuai risiko, subtask progress bar |
| Penyederhanaan status task | Dari 5 status jadi 3 (`Belum Mulai`/`Selesai`/`Terlambat`) |
| CRUD subtask checklist (tambah/edit/hapus/centang) | Di form tambah task **dan** halaman detail task |
| Setup koneksi Supabase (client/server/middleware) | |
| Desain & penerapan skema database Supabase | 11 tabel — lihat status pakai/obsolete di [05_DATABASE](./05_DATABASE.md) |
| Migrasi autentikasi dari mock ke Supabase Auth sungguhan | Diverifikasi end-to-end (register → trigger DB → login → dashboard) |
| Sistem upload file lokal (drag&drop, validasi, preview, progress) | Lihat [07_UPLOAD_SYSTEM](./07_UPLOAD_SYSTEM.md) |
| Scaffolding abstraksi OCR & AI Provider (interface saja) | Lihat [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md), [11_SERVICES](./11_SERVICES.md) |
| Riset & rekomendasi provider AI (dokumentasi) | Rekomendasi: Google Gemini — lihat di bawah |
| **AI Summary / Flashcard / Quiz / Recommendation** (dari teks hasil ekstraksi) | ✅ Milestone A–E — panel UI per-dokumen di halaman Dokumen, memanggil AI Service ber-cache + rate-limit. Lihat `AI_ARCHITECTURE_FREEZE.md` |
| **Tambahkan saran AI ke Tugas/Kalender** (`sourceDocumentId`/`sourceSuggestionId`) | ✅ Milestone E |
| Document Processing Pipeline (Strategy Pattern, Factory, IndexedDB Document Record) | Sprint 1, lihat `docs/SPRINT_1_ARCHITECTURE_FREEZE.md` |
| OCR sungguhan (kategori `image`, via OCR.Space) | Sprint 3, diverifikasi end-to-end dengan API key sungguhan — lihat [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md) |
| Parser lokal — PDF digital, DOCX, DOC (best-effort), XLS/XLSX/CSV, PPTX | Sprint 2, lihat [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md) bagian "Local Parser" |

## 🔄 Sedang Berjalan / Sebagian

| Item | Status |
|---|---|
| AI Assistant | **Sudah bisa LLM sungguhan** (Milestone E): `/api/ai/chat` → `getAIProvider().chat()`. `AI_PROVIDER=gemini` → jawaban LLM nyata; `AI_PROVIDER=mock` (default) → tetap rule-based keyword (dipindah ke `mock.chat`, tanpa biaya) |
| Achievement / gamifikasi | UI dan data ada, belum ada logika unlock otomatis berdasar aktivitas pengguna |
| Widget dashboard | Ada halaman pengaturan (`WidgetPage`), tapi dashboard belum membaca pengaturan `enabled`/`size` — evaluasi widget sendiri masih **ditunda** atas permintaan eksplisit |

## ❌ Belum Dibuat

| Item | Kenapa belum |
|---|---|
| Provider AI lain (OpenAI/Anthropic/OpenRouter) | Masih stub `notConfigured` — Gemini sudah cukup untuk kebutuhan saat ini; provider lain tinggal isi mengikuti interface `AIProvider` bila diperlukan |
| Evaluasi widget (keep/simplify/remove) | Ditunda atas permintaan eksplisit, bukan lupa dikerjakan |
| Parsing `.ppt` (PowerPoint format lama, biner) | **Bukan sekadar "belum"** — tidak ada library JS yang layak untuk format ini, ditolak permanen (`NOT_IMPLEMENTED`) kecuali ada opsi baru muncul di masa depan |

## 🚫 Dibatalkan

| Item | Kenapa dibatalkan | Diganti dengan |
|---|---|---|
| Migrasi seluruh data aplikasi (task, kategori, jadwal, dll) ke Supabase | Menghindari limit Supabase Free tier, jaga aplikasi tetap ringan dan bisa offline | Tetap Zustand + localStorage (+ IndexedDB untuk file) — lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md), [06_STATE_MANAGEMENT](./06_STATE_MANAGEMENT.md) |
| Fitur upload pakai Supabase Storage | Konsisten dengan pembatalan di atas — Supabase hanya untuk auth | Upload lokal berbasis IndexedDB — lihat [07_UPLOAD_SYSTEM](./07_UPLOAD_SYSTEM.md) |

**Catatan penting:** migrasi data ke Supabase yang dibatalkan ini **belum pernah benar-benar dieksekusi** — baru sebatas rencana yang sempat direkomendasikan. Jadi pembatalannya tidak memerlukan "rollback" kode apapun, cuma memastikan tidak dilanjutkan.

## Rekomendasi Provider AI (riset, belum diimplementasikan)

Riset Juli 2026 (harga/limit real, bukan dari data training) untuk kebutuhan OCR + AI Summary:

| Provider | Free tier | Vision/OCR | Cocok untuk |
|---|---|---|---|
| **Google Gemini** (Gemini 3 Flash) | 1.500 req/hari, semua modalitas gratis | Native, sangat baik, PDF langsung | **Rekomendasi utama** — satu provider untuk OCR + Summary sekaligus |
| Mistral (OCR 3) | ~1B token/bulan (evaluasi) | Terbaik di kelasnya, tapi khusus OCR | Perlu dipasangkan provider lain untuk summary |
| OpenRouter | Beberapa model vision gratis, terbatas | Baik | Fleksibilitas ganti-ganti provider |
| Groq | Gratis selamanya, limit tinggi | Vision masih preview | Kecepatan, bukan OCR |
| OpenAI / Anthropic | Tidak ada free tier API berarti | Baik | Didukung di abstraksi, bukan default (karena free tier) |

Detail lengkap perbandingan: lihat riwayat di [18_CHANGELOG](./18_CHANGELOG.md) atau `Dokumentasi_yuyud27.MD` (dokumentasi sesi sebelumnya, di root project).

## Urutan Prioritas Selanjutnya (per arahan 17 Juli 2026)

`docs/AI_ARCHITECTURE_FREEZE.md` sudah **APPROVED** sebagai baseline implementasi — tiga keputusan terbuka §17.12 final (`correctIndex`; output rekomendasi satu array polymorphic, penyimpanan tetap dua array bertipe; kategori `Study` → `AITaskSuggestion`). Urutan aktif mengikuti Milestone A–E di freeze tersebut (§16):

1. ✅ Sinkronisasi dokumentasi usang hasil audit (README, CLAUDE.md, 02/09/11/12/15, status kedua freeze doc) — selesai 17 Juli 2026.
2. ✅ **Milestone A** — tipe domain AI di `src/types/index.ts` (+ `sourceDocumentId`/`sourceSuggestionId` pada `Task`/`StudySession`), `src/lib/ai/prompts/*` (PromptSpec, shared fragments/schemas, summary 3-mode, flashcard, quiz, fragmen task/calendar, recommendation), `src/lib/ai/chunking.ts` — murni additive, **belum dipanggil kode manapun**. Selesai 17 Juli 2026 (`tsc`/`lint`/`next build` bersih; `splitIntoChunks` lulus uji standalone Node).
3. ✅ **Milestone B** — IndexedDB `DB_VERSION` 2→3 (4 store `ai_*` + CRUD low-level di `lib/indexedDb.ts`), `services/ai/aiRepository.ts` (+ interface `AIRepository`), `lib/ai/cache.ts` (hashing SHA-256 Web Crypto + `isSummaryCacheValid`/`isDerivedCacheValid`, §9.1), migrasi Supabase `add_ai_usage_log` (+ RLS, advisor bersih) + regenerasi `database.types.ts`. Murni additive, **belum dipanggil kode manapun**. Selesai 17 Juli 2026 (`tsc`/`lint`/`next build` bersih; `cache.ts` lulus 15 uji standalone Node termasuk vektor SHA-256 terkenal).
4. ✅ **Milestone C** — interface `AIProvider` diperluas (`summarize`/`generateFlashcards`/`generateQuiz`/`recommend` + tipe `GenerateOptions`/`AIGenerationResult`); `summarizeDocument`/`DocumentSummary` lama dihapus (superseded); `providers/mock.ts` lengkap (JSON valid sesuai schema); `providers/gemini.ts` sungguhan (raw fetch REST, tanpa SDK); stub openai/anthropic/openrouter disesuaikan; `GEMINI_API_KEY`/`GEMINI_MODEL` ditambah ke `.env.example`. Belum "live" (tidak dipanggil route sampai D). Selesai 17 Juli 2026 (`tsc`/`lint`/`next build` bersih; mock lulus 9 uji validasi-schema standalone Node). **Gemini diverifikasi live** dengan API key sungguhan: `summarize()` menghasilkan JSON valid sesuai schema + `tokenUsage` nyata, structured output bekerja. Default model diganti ke `gemini-flash-latest` (versi ter-pin `gemini-2.5-flash` ditolak untuk project baru).
5. ✅ **Milestone D** — 4 service `services/ai/*` (summary termasuk orkestrasi chunking §6.3; flashcard/quiz/recommendation berbasis AISummary) + 4 route `/api/ai/{summary,flashcard,quiz,recommendation}` dengan gerbang wajib Auth (401) → Rate-limit fail-closed (429/503, `ai_usage_log`) → validasi input → Prompt Builder → provider → Validation Pipeline + retry. Modul server: `guard`/`validation`/`generate`/`errors`. Belum dipakai UI (Milestone E). Selesai 17 Juli 2026 (`tsc`/`lint`/`next build` bersih; 27 unit test validation+generate lulus; keempat route diverifikasi 401 end-to-end tanpa sesi + `ai_usage_log` terkonfirmasi tidak tertulis pada 401). Happy-path ber-sesi & 429 diverifikasi lewat komponen (belum via sesi login penuh — lihat catatan verifikasi).
6. ✅ **Milestone E** — panel UI per-dokumen Summary/Flashcard/Quiz/Recommendation (di halaman Dokumen), tombol "Tambahkan ke Tugas/Kalender" (mengisi `sourceDocumentId`/`sourceSuggestionId`), dan `/api/ai/chat` disambungkan ke `getAIProvider().chat()` sungguhan (logika rule-based dipindah ke `mock.chat`). Loading/empty/error/retry/stale state di tiap panel. Selesai 17 Juli 2026 (`tsc`/`lint`/`next build` bersih; chat route 401 tanpa sesi terverifikasi; app boot tanpa error konsol). **Seluruh roadmap AI (A–E) SELESAI.**
7. ⬜ Di luar jalur AI: keputusan drop 10 tabel Supabase obsolete atau biarkan (destruktif — butuh persetujuan eksplisit, lihat [05_DATABASE](./05_DATABASE.md)); evaluasi widget (masih ditunda atas permintaan); ganti `OCR_SPACE_API_KEY` demo publik dengan key pribadi; lihat backlog di [17_TECH_DEBT](./17_TECH_DEBT.md).
