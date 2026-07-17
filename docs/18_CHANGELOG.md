# Changelog

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Ringkasan perubahan besar, berdasarkan riwayat commit sungguhan (`git log`) di branch `feat/supabase-setup` — bukan rekonstruksi dari ingatan. Untuk detail teknis tiap perubahan, lihat dokumen topik yang ditautkan.

## Frontend-only MVP (titik awal)

Project dimulai sebagai aplikasi frontend murni: Next.js + Zustand + localStorage, tanpa backend/database sama sekali. Login memakai token palsu, "AI" sepenuhnya rule-based. Struktur dasar (routing, komponen, domain logic seperti `priorityScore`) yang dibangun di tahap ini masih jadi fondasi aplikasi sampai sekarang.

## Perbaikan UI & bug awal

- Refactor Task Card (hapus beberapa field, lalu sebagian dikembalikan atas permintaan lanjutan).
- Perbaikan bug icon kategori (root cause: `categoryId` tidak pernah di-resolve jadi tampilan icon) dan sistem tema (root cause: state tersimpan tapi tidak pernah diterapkan ke DOM).
- Redesign halaman detail task, penyederhanaan status task (5 → 3 status).
- Fitur CRUD subtask checklist (tambah/edit/hapus/centang).

## Kontribusi Collaborator (lewat GitHub)

Beberapa perubahan signifikan berasal dari collaborator lain di repo ini (`AbubakarRhafly`, dan kontributor dengan commit sebagai "Lord-of-Melon"), digabungkan lewat beberapa Pull Request ke `main` dan `feat/supabase-setup`:

- Penyederhanaan form registrasi (field `university`/`major`/`semester` dihapus dari form, meski kolomnya masih ada di database — lihat [17_TECH_DEBT](./17_TECH_DEBT.md)).
- Sistem icon kategori dirombak total: dari emoji ke Lucide React icon dengan picker UI, plus fitur "Aktivitas" per kategori yang menggantikan konsep "Mata Kuliah" di form task.
- Priority Score sempat disembunyikan dari UI oleh salah satu perubahan ini, lalu dikembalikan lagi atas permintaan lanjutan.
- Beberapa PR tambahan tergabung lewat `rizalBranch` dan sinkronisasi ulang dengan `main` — isinya belum diverifikasi mendalam satu-per-satu dalam dokumentasi ini (di luar cakupan audit kali ini).

## Setup Backend: Supabase untuk Auth

- Koneksi Supabase (client/server/middleware) disiapkan.
- Skema database 11 tabel didesain & diterapkan (awalnya untuk rencana "semua data ke Supabase").
- Autentikasi dimigrasi total dari mock ke Supabase Auth sungguhan: register/login/logout, trigger auto-isi `profiles`, RLS di semua tabel, hardening security & performance (lihat [05_DATABASE](./05_DATABASE.md), [15_SECURITY](./15_SECURITY.md)).
- **Insiden yang tercatat:** saat troubleshooting login yang terblokir status "email belum dikonfirmasi", sempat dilakukan pengubahan langsung lewat SQL (`email_confirmed_at`) ke satu akun demo untuk membuka blokir — tindakan ini melewati kontrol keamanan konfirmasi email, dilaporkan terbuka saat itu terjadi, dan sempat memicu automated safety check. Root cause sebenarnya (`Confirm email` yang belum benar-benar tersimpan mati di dashboard) baru ditemukan dan diperbaiki setelahnya lewat pengecekan log Supabase langsung. Detail: [15_SECURITY](./15_SECURITY.md).
- Ditemukan (dan diperbaiki) insiden `package.json` dengan key `"next"` duplikat, hasil percobaan upgrade Next.js 16 yang tidak sengaja ter-commit sebagian — dikembalikan ke Next.js 14. Detail: [17_TECH_DEBT](./17_TECH_DEBT.md).

## Perubahan Roadmap Besar: Supabase Dibatasi Hanya untuk Auth

Keputusan sebelumnya untuk memindahkan seluruh data aplikasi ke Supabase **dibatalkan**. Ditemukan saat audit ulang bahwa migrasi itu belum pernah benar-benar dieksekusi, jadi pembatalan ini tidak memerlukan perubahan kode. Detail lengkap alasan & dampaknya: [16_ROADMAP](./16_ROADMAP.md).

## Sistem Upload File Lokal

Dibangun bertahap (6 tahap, masing-masing commit terpisah): infrastruktur IndexedDB, state Zustand untuk metadata, UI drag&drop/multi-file/preview/progress/validasi, halaman + navigasi, scaffolding abstraksi OCR & AI Provider (interface saja), dan dokumentasi riset provider AI. Setiap tahap diverifikasi langsung di browser sebelum lanjut ke tahap berikutnya. Detail: [07_UPLOAD_SYSTEM](./07_UPLOAD_SYSTEM.md), [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md).

## Dokumentasi Ini

Set dokumentasi modular (`docs/`) dibuat berdasarkan audit menyeluruh kondisi repository saat dokumen ini ditulis — bukan dari roadmap lama atau asumsi. Riwayat naratif yang lebih detail turn-by-turn (termasuk before/after kode untuk perubahan-perubahan awal) ada di `Dokumentasi_yuyud27.MD` di root project — dokumen `docs/` ini menggantikannya sebagai referensi utama yang lebih terstruktur untuk pengembangan ke depan, tanpa menghapus dokumen lama tersebut.

## Audit Menyeluruh, Sinkronisasi Dokumentasi, AI Freeze APPROVED & Milestone A (17 Juli 2026)

- **Audit penuh dokumentasi-vs-kode** (onboarding arsitek baru): dokumentasi `docs/01–21` terbukti sangat akurat; ~15 titik usang/inkonsisten teridentifikasi dan diperbaiki tanpa mengubah perilaku kode:
  - `README.md` dan `CLAUDE.md` ditulis ulang total — sebelumnya masih mendeskripsikan MVP mock-auth / "mid-migration ke Supabase" yang bertentangan dengan keputusan final (Pasal 1).
  - `09_API.md` + `11_SERVICES.md`: 4 processor non-image bukan lagi stub (parser lokal Sprint 2 sudah nyata).
  - `15_SECURITY.md`: dicatat bahwa file kategori `image` kini dikirim ke OCR.Space (pihak ketiga), dan `/api/document/process` ikut dalam daftar route tanpa auth check.
  - `02_FOLDER_STRUCTURE.md` (onboarding punya auth check sendiri), `12_STORES.md` (pola action aktual).
  - `SPRINT_1_ARCHITECTURE_FREEZE.md`: status DRAFT → DIIMPLEMENTASIKAN; catatan audit di §4 (field `summary?` tidak pernah ada di kode), §7 (field UI-state yang tidak jadi dibuat; mirror menyimpan record penuh), §8 (versi persist aktual `1`, backup `__backup_v0`).
- **`AI_ARCHITECTURE_FREEZE.md` disetujui → APPROVED** sebagai baseline implementasi. Tiga keputusan terbuka §17.12 final (Riwayat Revisi #10): quiz memakai `correctIndex`; output rekomendasi satu array polymorphic `recommendations[]` + `type` (penyimpanan tetap dua array bertipe); kategori `Study` dipetakan ke `AITaskSuggestion`. §3.1 direvisi mengikuti resolusi §17.2.
- **Milestone A diimplementasikan** (murni additive, belum dipanggil kode manapun): tipe domain AI + kontrak output di `src/types/index.ts` (plus `sourceDocumentId`/`sourceSuggestionId` opsional pada `Task`/`StudySession`), `src/lib/ai/prompts/` (`types.ts`, `shared/formatting.ts`, `shared/schemas.ts`, `summaryPrompt.ts` 3-mode, `flashcardPrompt.ts`, `quizPrompt.ts`, fragmen `taskPrompt.ts`/`calendarPrompt.ts`, `recommendationPrompt.ts`), dan `src/lib/ai/chunking.ts` (`splitIntoChunks` + konstanta tier §6.1). Verifikasi: `tsc --noEmit`, `next lint`, dan `next build` bersih; `splitIntoChunks` lulus 17 uji standalone di Node (batas paragraf/kalimat/kata, konten utuh, kasus patologis token raksasa).

## Milestone B — AI Storage, Cache, Repository (17 Juli 2026)

Lapisan penyimpanan & cache AI (AI_ARCHITECTURE_FREEZE §7.1/§8.3/§9), murni additive dan **belum dipanggil kode manapun** (pemakainya = 4 AI service di Milestone D):

- **IndexedDB `DB_VERSION` 2→3** (`src/lib/indexedDb.ts`): 4 store baru `ai_summaries`/`ai_flashcards`/`ai_quizzes`/`ai_recommendations` (key = `documentId`) + fungsi CRUD low-level per store. Bump additive — store `files`/`documents` tidak disentuh.
- **`services/ai/aiRepository.ts`** (`IndexedDbAIRepository`) + interface `services/ai/types.ts` (`AIRepository`) — satu-satunya pintu baca/tulis keempat store AI, pola identik `documentRepository`, client-only. Plus `deleteAllForDocument()` untuk cleanup saat dokumen dihapus.
- **`src/lib/ai/cache.ts`** — `computeSourceTextHash()` (SHA-256 via Web Crypto atas teks ter-normalize, tanpa dependency baru), `isSummaryCacheValid()` (hash + `promptVersion`), `isDerivedCacheValid()` (transitif via `summaryId`). §9.1.
- **Supabase:** migrasi `add_ai_usage_log` — tabel counter rate-limit (`user_id`, `usage_date`, `request_count`; PK gabungan; RLS `select`/`insert`/`update` own, tanpa `DELETE` untuk cegah evasi). Pengecualian sempit & terdokumentasi dari "Supabase hanya untuk auth" (§7.4) — hanya angka penghitung, bukan konten AI. `database.types.ts` diregenerasi. Advisor security & performance diverifikasi bersih untuk tabel ini.
- Verifikasi: `tsc --noEmit`, `next lint`, `next build` semua bersih; `cache.ts` lulus 15 uji standalone Node (SHA-256 cocok vektor uji `sha256("abc")`, konsistensi Web Crypto vs Node crypto, normalize, semua cabang validity).

## Milestone C — AI Provider Interface, Gemini, Mock (17 Juli 2026)

Lapisan provider AI (AI_ARCHITECTURE_FREEZE §4.2/§17.8), belum "live" (tidak ada route/UI yang memanggil `getAIProvider()` sampai Milestone D/E — perilaku aplikasi belum berubah):

- **Interface `AIProvider` diperluas** (`src/lib/ai/types.ts`): tambah `summarize`/`generateFlashcards`/`generateQuiz`/`recommend` (menerima `PromptSpec` + `GenerateOptions`, mengembalikan `AIGenerationResult`). Method lama `summarizeDocument()` + tipe `DocumentSummary` **dihapus** (superseded, disetujui di Lampiran #4 freeze — dulu menerima `imageBlob` yang melanggar aturan "AI hanya menerima teks").
- **`providers/mock.ts`** — berfungsi penuh: keempat method mengembalikan JSON valid sesuai schema §17.3 (memungkinkan Milestone D diuji tanpa API key).
- **`providers/gemini.ts`** — implementasi sungguhan via raw `fetch` ke REST API Generative Language (**tanpa menambah SDK**, konsisten gaya OCR.Space): key lewat `x-goog-api-key` header (bukan URL), JSON mode + `responseSchema` disanitasi ke subset Gemini (`toGeminiSchema`), timeout 60 dtk, `usageMetadata` → `tokenUsage`, best-effort parse code-fence. Model via `GEMINI_MODEL` (default `gemini-flash-latest`, alias selalu-terkini). `analyzeTask`/`chat` melempar error "Milestone E" (di luar cakupan C).
- **Stub `openai`/`anthropic`/`openrouter`** — disesuaikan ke interface baru (empat method `notConfigured`).
- **`.env.example`** — `GEMINI_API_KEY` + `GEMINI_MODEL` ditambahkan. Key pribadi TIDAK ditulis ke repo — pemilik project mengisinya sendiri ke `.env.local` (gitignored).
- **Default model diganti `gemini-2.5-flash` → `gemini-flash-latest`** setelah verifikasi live: versi ter-pin `gemini-2.5-flash` ditolak untuk project baru ("no longer available to new users"); alias `-latest` menghindari masalah pinning ini.
- Verifikasi: `tsc --noEmit`, `next lint`, `next build` bersih; mock lulus 9 uji standalone Node (bentuk `AIGenerationResult` + validasi output keempat method terhadap JSON Schema §17.3, termasuk `correctIndex` dalam rentang `options`). **Gemini diverifikasi live** dengan API key sungguhan: `summarize()` atas teks contoh → JSON valid sesuai schema, shape benar (difficulty/language/confidence), `finishReason: STOP`, `tokenUsage` nyata (~2178 total token). Structured output (`responseSchema` disanitasi) bekerja.

## Milestone D — AI Services, Route, Auth & Cost Control (17 Juli 2026)

Lapisan Service + route AI aktif (AI_ARCHITECTURE_FREEZE §6/§7/§17). Pertama kalinya provider AI bisa terpanggil dari route — masih **belum dipakai UI** (Milestone E). Milestone paling sensitif keamanan/biaya:

- **4 route** `src/app/api/ai/{summary,flashcard,quiz,recommendation}/route.ts` — tiap route: `guardAIRoute()` (Auth 401 → Rate-limit 429/503 fail-closed) → validasi input (400) → Prompt Builder → `getAIProvider().{summarize,generateFlashcards,generateQuiz,recommend}()` → Validation Pipeline → JSON. Summary menangani 3 mode chunking (direct/chunk/merge).
- **4 service** `src/services/ai/{documentSummary,flashcard,quiz,recommendation}Service.ts` (+ `aiApi.ts`) — client-only orchestrator: cache-check §9 (SHA-256 di client → cache-hit nol network), orkestrasi chunking §6.3 di `documentSummaryService`, perakitan record domain (provenance/storage ditambahkan di sini, bukan di route), pemetaan output rekomendasi polymorphic → dua-array §17.2.
- **Modul server** `src/lib/ai/`: `guard.ts` (gerbang Auth+Rate-limit, tabel `ai_usage_log` aktif dipakai), `validation.ts` (validator JSON Schema subset + business validators — `correctIndex` dalam rentang, flashcard tanpa duplikat, keyPoints non-kosong — tanpa dependency), `generate.ts` (retry 1× untuk kegagalan format/transient, **tanpa** retry untuk provider rate-limit, akumulasi token §17.6), `errors.ts` (`AIProviderError` bertipe). Provider Gemini/stub diperbarui melempar `AIProviderError`. Version constant prompt dipindah ke `lib/ai/prompts/versions.ts` (dipakai Service tanpa menarik isi Prompt Builder ke bundle client).
- **`.env.example`** — `AI_DAILY_REQUEST_LIMIT` (default 50) ditambahkan.
- **`summarizeDocument`/`DocumentSummary`** peninggalan sudah dihapus di Milestone C — tidak ada regresi.
- Verifikasi: `tsc`/`lint`/`next build` bersih; **27 unit test** (Validation Pipeline + generate-orchestrator: retry, rate-limit tanpa retry, akumulasi token, kegagalan validasi) lulus standalone Node; **keempat route diverifikasi 401 end-to-end** (tanpa cookie, bahkan sebelum validasi body — membuktikan auth gerbang pertama) di runtime Next.js sungguhan; `ai_usage_log` dikonfirmasi **tidak** tertulis pada request 401 (increment hanya setelah auth lolos). Happy-path ber-sesi + 429 tidak diuji lewat login penuh (tidak melakukan autentikasi sendiri — aturan keamanan); komponennya sudah terverifikasi terpisah, dan akan tereksekusi di Milestone E.

## Milestone E — UI Fitur AI & Integrasi End-to-End (17 Juli 2026)

Lapisan UI (AI_ARCHITECTURE_FREEZE §11) — **satu-satunya milestone yang mengubah apa yang dilihat/dilakukan pengguna**. Menutup seluruh roadmap AI (A–E). Memanfaatkan backend Milestone A–D tanpa menduplikasi logika bisnis:

- **Panel AI per-dokumen** (`src/components/ai/`): `AIDocumentPanel` (kontainer: tombol "Buat Ringkasan AI" on-demand → summary + tab), `AIFlashcardView` (kartu flip), `AIQuizView` (interaktif: pilih opsi → benar/salah + penjelasan + skor), `AIRecommendationView` (saran Task/Study/Calendar + tombol tambah), `AIStates` (loading/error/stale bersama). Muncul di halaman Dokumen hanya untuk dokumen `status === "completed"` (teks terekstrak). Semua state: loading, empty, error+retry, dan **stale** (badge kalau `summaryId` tak cocok summary aktif).
- **Tambahkan ke Tugas/Kalender**: saran → `addTask`/`addStudySession` (store) dengan `sourceDocumentId`+`sourceSuggestionId` terisi; saran ditandai `applied` dan dipersist balik ke `aiRepository`. Task memakai `addTask` (priorityScore dihitung otomatis).
- **AI Assistant nyata**: `/api/ai/chat` disambungkan ke `getAIProvider().chat()`. Logika rule-based keyword **dipindah dari route ke `mock.chat`** (default tetap membantu, tanpa biaya); `gemini.chat()` diimplementasikan (teks bebas, konteks tugas + riwayat). Route chat kini ber-auth (`requireAIAuth`, 401 tanpa sesi) — tanpa rate-limit harian (chat murah & sering). `gemini.ts` di-refactor internal (helper `geminiRequest` dipakai bersama JSON call + chat). `ChatWindow` **tidak berubah** (kontrak route dijaga).
- **Store**: tambah action `addStudySession` (append satu sesi, pola `addX`). Tidak ada perubahan persist/skema.
- Verifikasi: `tsc --noEmit`, `next lint`, `next build` semua bersih; route `/api/ai/chat` diverifikasi **401 tanpa sesi** (gerbang auth utuh setelah rewrite) dan `/api/ai/analyze` tetap **200** (rule-based, tanpa regresi); app boot bersih di browser (login render, **nol error konsol**) — mengonfirmasi client bundle dengan komponen AI baru memuat tanpa masalah. Happy-path visual penuh (generate + tambah ke tugas/kalender) belum diuji via login (tidak autentikasi sendiri — aturan keamanan); komponen sudah terverifikasi terpisah + build sukses.

## Insiden: UI tampil tanpa styling Tailwind pasca-Milestone E (17 Juli 2026) — diperbaiki

**Gejala:** setelah Milestone E dinyatakan selesai, pengguna menemukan UI dev server tampil sebagai HTML polos tanpa styling (komponen ter-render, CSS tidak termuat).

**Akar masalah (hasil audit):** BUKAN bug kode — `git status` mengonfirmasi keempat file styling (`layout.tsx`, `globals.css`, `tailwind.config.ts`, `postcss.config.mjs`) tidak pernah tersentuh sepanjang Milestone A–E. Penyebabnya prosedur verifikasi: `npm run build` dijalankan berkali-kali **saat `next dev` masih hidup di port 3000**. Keduanya berbagi folder `.next/` — build production menimpa chunk dev, dev server yang masih hidup lalu mereferensikan `/_next/static/css/app/layout.css` yang sudah tidak ada (**HTTP 404**, diverifikasi langsung) → halaman polos.

**Perbaikan:** hentikan dev server lama → hapus `.next/` → `npm run build` bersih dari nol (sukses, exit 0, tanpa dev server hidup) → `npm run dev` baru. **Verifikasi ulang:** CSS asset kembali HTTP 200 (37KB, berisi utilitas Tailwind), halaman login ter-render penuh sesuai desain (screenshot), nol error konsol, gerbang auth `/api/ai/chat` + `/api/ai/summary` tetap 401 tanpa sesi.

**Pencegahan:** aturan "jangan jalankan `next build` selagi dev server hidup" ditambahkan ke `CLAUDE.md` dan [19_DEVELOPER_GUIDE](./19_DEVELOPER_GUIDE.md) (Troubleshooting).
