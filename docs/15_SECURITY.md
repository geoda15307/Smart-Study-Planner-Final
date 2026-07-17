# Security

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

## Authentication

- Password divalidasi Supabase Auth (bukan lagi validasi mock yang menerima apapun).
- Domain email divalidasi sungguhan oleh Supabase — mengurangi akun spam/palsu.
- Setiap tabel Supabase yang ada (termasuk 10 tabel obsolete di [05_DATABASE](./05_DATABASE.md)) sudah punya **Row Level Security** aktif dengan kebijakan `(select auth.uid()) = user_id` — kalaupun suatu saat dipakai kembali, sudah aman secara desain, tidak perlu ditambah proteksi dari nol.
- **`Confirm email` saat ini DIMATIKAN** di dashboard Supabase — akun baru langsung aktif tanpa verifikasi email. Ini keputusan sadar untuk tahap development (menghindari quota email yang sangat terbatas), **tapi perlu ditinjau ulang sebelum aplikasi dipakai pengguna sungguhan** — tanpa verifikasi email, siapapun bisa mendaftar dengan email siapapun (selama formatnya valid) tanpa membuktikan kepemilikan email tersebut.
- **Catatan riwayat (transparansi):** pernah ada tindakan mengubah `email_confirmed_at` langsung lewat SQL untuk membuka blokir login satu akun demo saat troubleshooting — ini melewati kontrol keamanan konfirmasi email. Dilakukan hanya ke satu akun test, dilaporkan terbuka saat itu terjadi, dan sempat memicu automated safety check. Dicatat di sini supaya tidak terulang tanpa sepengetahuan tim. Detail: [18_CHANGELOG](./18_CHANGELOG.md).

## API Security — celah yang perlu diketahui

**Ketiga route API (`/api/ai/analyze`, `/api/ai/chat`, `/api/document/process`) tidak punya pengecekan autentikasi di sisi server.** Proteksi login yang ada (`AppShell`, lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md)) hanya berlaku untuk **halaman yang dirender**, bukan untuk API route itu sendiri — `middleware.ts` cuma me-refresh cookie session, tidak memblokir request tanpa session. Artinya, secara teknis, siapapun yang tahu URL endpoint-nya bisa mengirim POST request langsung tanpa login.

Ini berlaku untuk route AI **lama** (`/api/ai/analyze`, `/api/ai/chat`, masih rule-based — dampak rendah) dan `/api/document/process` (kategori `image` memicu OCR.Space memakai `OCR_SPACE_API_KEY`, jadi request tanpa login bisa ikut menghabiskan kuota OCR).

**Update Milestone D — celah ini SUDAH DITUTUP untuk empat route AI baru** (`/api/ai/{summary,flashcard,quiz,recommendation}`, satu-satunya yang bisa memicu biaya token AI berbayar). Keempatnya melewati `guardAIRoute()` (`src/lib/ai/guard.ts`) sebelum menyentuh provider: **(1) Auth check** — tanpa sesi Supabase valid → 401, provider tidak pernah dipanggil (diverifikasi end-to-end: 401 untuk request tanpa cookie di keempat route, sebelum validasi body); **(2) Rate-limit fail-closed** — counter harian per user di `ai_usage_log` (§7.4), lewat batas → 429, dan kalau pengecekannya sendiri gagal → 503 (ditolak, bukan diloloskan). Route AI lama + `/api/document/process` **belum** ditutup (masih gap terdokumentasi — bukan pemicu biaya AI berbayar; kandidat ditutup dengan pola guard yang sama bila diperlukan).

## Storage (client-side)

- **IndexedDB dan localStorage tidak terenkripsi** dan bisa diakses oleh script apapun yang berjalan di origin yang sama — risiko standar untuk arsitektur local-first, relevan kalau suatu saat ada celah XSS di aplikasi.
- Catatan privasi (diperbarui Sprint 3): file yang diupload tetap tersimpan lokal, **tapi tidak lagi sepenuhnya tinggal di browser** — untuk diproses, blob dikirim ke route server aplikasi ini (`/api/document/process`), dan khusus kategori `image` diteruskan ke **OCR.Space (pihak ketiga)** untuk ekstraksi teks. Kategori lain (PDF/Word/spreadsheet/PPTX) diparsing di server aplikasi sendiri, tidak dikirim ke pihak ketiga manapun. Hasil ekstraksi hanya disimpan di IndexedDB browser pengguna, tidak di server.
- Tidak ada batas kuota storage browser yang ditangani secara eksplisit — kalau IndexedDB penuh (jarang terjadi untuk pemakaian wajar), belum ada penanganan error khusus di kode.

## Environment Variables

- `.env.local` (nilai asli) di-gitignore dengan benar — tidak pernah ter-commit.
- Hanya kunci **publishable/anon** Supabase yang dipakai di client (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) — kunci `service_role` (akses penuh, bypass RLS) **tidak pernah** dipakai di kode aplikasi, cuma dipakai lewat tool MCP saat development untuk mengelola skema.
- `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` masih placeholder kosong — belum ada risiko kebocoran karena belum ada kode yang membacanya. Saat diisi nanti, abstraksi provider AI sengaja ditaruh di `src/lib/ai/` (server-only) — **jangan pernah** pindahkan pemanggilan provider ke kode yang bisa jalan di client, itu akan membocorkan API key ke browser. Lihat [11_SERVICES](./11_SERVICES.md).

## Ringkasan risiko yang perlu ditindaklanjuti sebelum production

1. Nyalakan kembali `Confirm email` di Supabase (butuh provider email/SMTP sungguhan dulu — lihat [16_ROADMAP](./16_ROADMAP.md)).
2. ✅ **Selesai (Milestone D):** auth check di empat route AI baru (`/api/ai/{summary,flashcard,quiz,recommendation}`) — satu-satunya pemicu biaya token AI. Route AI lama (`analyze`/`chat`, rule-based) + `/api/document/process` belum ditutup (kandidat, bukan pemicu biaya AI).
3. ✅ **Selesai (Milestone D):** rate limiting per user (`ai_usage_log`, fail-closed 429/503) di empat route AI baru — §7.3–7.4.
4. Ganti `OCR_SPACE_API_KEY` demo publik (`"helloworld"`) dengan API key pribadi (lihat [13_CONFIGURATION](./13_CONFIGURATION.md)).
5. Pertimbangkan increment counter `ai_usage_log` yang atomik (saat ini read-then-upsert — race kecil, diterima untuk MVP single-user; lihat [11_SERVICES](./11_SERVICES.md)).
