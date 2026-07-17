# Architectural Decisions

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Catatan keputusan arsitektur (ADR) — **kenapa** sesuatu dibangun seperti sekarang, alternatif apa yang dipertimbangkan, dan konsekuensinya. Beda dengan [18_CHANGELOG](./18_CHANGELOG.md) (urutan kejadian) atau [16_ROADMAP](./16_ROADMAP.md) (status selesai/belum) — dokumen ini fokus ke **alasan di balik keputusan**, supaya tidak diulang-tanya atau tidak sengaja dibalik di masa depan.

---

### ADR-001 — Data aplikasi tetap lokal (Zustand + localStorage), bukan backend

**Status:** Diterima (final, setelah sempat dipertimbangkan sebaliknya)

**Konteks:** Aplikasi awalnya dibangun sebagai frontend-only MVP. Muncul rencana memindahkan seluruh data (task, kategori, dll) ke Supabase untuk membuatnya jadi "aplikasi sungguhan" dengan backend nyata.

**Keputusan:** Rencana itu dibatalkan. Data aplikasi tetap di Zustand + localStorage (+ IndexedDB untuk file besar).

**Alasan:** Menghindari limit Supabase free tier, aplikasi tetap ringan, tidak bergantung koneksi internet untuk fitur inti, bisa dipakai offline.

**Konsekuensi:** Data tidak tersinkron antar-perangkat (localStorage per-browser). Tidak ada backup otomatis di sisi server untuk data aplikasi — kalau localStorage/IndexedDB pengguna hilang, datanya hilang (mitigasi yang sudah ada: fitur export JSON/CSV manual di Settings). Lihat [20_PROJECT_CONSTITUTION](./20_PROJECT_CONSTITUTION.md) Pasal 1.

---

### ADR-002 — Supabase dibatasi untuk Authentication saja

**Status:** Diterima (konsekuensi langsung dari ADR-001)

**Konteks:** Supabase sudah terlanjur disiapkan lengkap dengan 11 tabel untuk seluruh domain aplikasi sebelum ADR-001 dibuat.

**Keputusan:** Pertahankan Supabase, tapi persempit perannya jadi Authentication + profil dasar saja.

**Alasan:** Autentikasi butuh verifikasi identitas yang secara alami tidak bisa sepenuhnya lokal/offline — beda dengan data aplikasi lain. Supabase Auth sudah matang untuk kebutuhan ini, tidak masuk akal dibangun sendiri.

**Konsekuensi:** 10 dari 11 tabel yang sudah dibuat jadi tidak terpakai (lihat [05_DATABASE](./05_DATABASE.md), [17_TECH_DEBT](./17_TECH_DEBT.md)) — sengaja dibiarkan, bukan dihapus (lihat [20_PROJECT_CONSTITUTION](./20_PROJECT_CONSTITUTION.md) Pasal 4).

---

### ADR-003 — File upload disimpan di IndexedDB, bukan localStorage atau Supabase Storage

**Status:** Diterima

**Konteks:** Butuh tempat menyimpan blob file (gambar, PDF, spreadsheet) untuk fitur upload.

**Alternatif yang dipertimbangkan:** (a) localStorage — ditolak, batas ukuran ~5-10MB dan hanya bisa string, tidak cocok untuk blob. (b) Supabase Storage — ditolak, melanggar ADR-002.

**Keputusan:** IndexedDB, lewat wrapper `idb`, khusus untuk blob. Metadata file (nama, ukuran, status) tetap di Zustand/localStorage seperti data lain.

**Konsekuensi:** Perlu dua sistem penyimpanan berbeda untuk satu fitur (lihat [06_STATE_MANAGEMENT](./06_STATE_MANAGEMENT.md)) — kompleksitas tambahan yang dianggap sepadan dibanding melanggar ADR-001/002.

---

### ADR-004 — Progress upload adalah state lokal, tidak masuk Zustand store

**Status:** Diterima

**Konteks:** Progress upload berubah sangat cepat (banyak event per detik dari `FileReader.onprogress`).

**Keputusan:** Progress disimpan sebagai state lokal di dalam hook `useFileUpload`, bukan di `useAppStore`.

**Alasan:** Zustand `persist` middleware serialize seluruh state ke localStorage setiap `set()` — kalau progress ikut masuk, itu berarti tulis-ulang localStorage berkali-kali per detik saat upload file besar, boros dan berpotensi bikin UI lag.

**Konsekuensi:** Progress upload hilang kalau halaman di-refresh di tengah proses (dianggap dapat diterima — file besar biasanya selesai dalam hitungan detik untuk batas ukuran 10MB yang berlaku).

---

### ADR-005 — Abstraksi OCR dan AI Provider dipisah, meski satu provider (Gemini) bisa keduanya

**Status:** Diterima

**Konteks:** Provider yang direkomendasikan ([16_ROADMAP](./16_ROADMAP.md), Google Gemini) bisa melakukan OCR *dan* ringkasan dalam satu pemanggilan (native vision + long-context). Godaan alaminya: gabung jadi satu interface saja.

**Keputusan:** Tetap dua interface terpisah — `OCRProvider` (`src/lib/ocr/types.ts`, dipindah dari `src/services/ocr/` saat implementasi pertama/`OCRSpaceProvider` ditulis — lihat [11_SERVICES](./11_SERVICES.md)) dan `AIProvider.summarizeDocument` (`src/lib/ai/types.ts`).

**Alasan:** Memisahkan concern memungkinkan kombinasi provider yang berbeda (misal: Mistral OCR — kualitas ekstraksi teks terbaik di kelasnya — dipasangkan dengan provider lain untuk ringkasan) tanpa terkunci ke satu provider yang kebetulan bisa keduanya. Optimasi "satu provider untuk semua" bisa jadi kasus khusus yang mengimplementasikan kedua interface, bukan alasan menggabungkan kontraknya.

**Konsekuensi:** Sedikit lebih banyak boilerplate interface saat ini (tidak masalah, karena keduanya masih sebatas interface, belum ada implementasi nyata).

---

### ADR-006 — Field domain (`status`, `priority`, dll) pakai `text` + `CHECK`, bukan enum native Postgres

**Status:** Diterima

**Konteks:** Perlu constraint di level database untuk nilai seperti `TaskStatus` di tabel `tasks` (meski tabel ini sendiri obsolete, lihat ADR-002 — keputusan ini tetap relevan kalau skema serupa dibuat lagi nanti).

**Keputusan:** `text` dengan `CHECK (kolom IN (...))`, bukan `CREATE TYPE ... AS ENUM`.

**Alasan:** `TaskStatus` sudah terbukti berubah beberapa kali dalam riwayat project ini (5 nilai → 3 nilai). Mengubah `CHECK` constraint murah (satu `ALTER TABLE`). Mengubah enum native Postgres jauh lebih menyulitkan (tidak bisa hapus value dengan mudah, perlu trik `ALTER TYPE ... RENAME` + buat ulang).

**Konsekuensi:** Kehilangan validasi bawaan level-tipe yang didapat dari enum native, dan TypeScript type generation dari skema jadi `string` polos, bukan union literal — trade-off yang diterima demi fleksibilitas.

---

### ADR-007 — Proteksi route di komponen (`AppShell`), bukan di `middleware.ts`

**Status:** Diterima

**Konteks:** Next.js mendukung dua cara memproteksi route: middleware server-side (jalan sebelum render, bisa redirect) atau pengecekan client-side di komponen.

**Keputusan:** Proteksi dilakukan di `AppShell.tsx` (client-side), `middleware.ts` hanya untuk refresh cookie session Supabase.

**Alasan:** Kemungkinan besar warisan dari arsitektur sebelum Supabase Auth ada (saat auth masih mock, satu-satunya sumber kebenaran ada di Zustand/localStorage, yang cuma bisa dibaca client-side) — belum dimigrasikan ke pendekatan hybrid meski sekarang Supabase Auth (yang punya cookie session, bisa dicek server-side) sudah tersedia.

**Konsekuensi:** Ada jeda "Memeriksa sesi login..." setiap halaman dibuka (menunggu hydration Zustand). Route API (`/api/ai/*`) **tidak ikut terproteksi** oleh mekanisme ini sama sekali — celah yang sudah dicatat di [15_SECURITY](./15_SECURITY.md). Memindahkan sebagian proteksi ke middleware (khusus untuk API route) adalah kandidat perbaikan yang belum dieksekusi.

---

### ADR-008 — Sistem tema lewat CSS variable, bukan class `dark:` di tiap komponen

**Status:** Diterima

**Konteks:** Butuh dukungan 4 tema warna + dark mode yang berlaku konsisten di seluruh aplikasi.

**Alternatif yang dipertimbangkan:** Menambahkan varian `dark:` Tailwind di tiap komponen satu-satu — ditolak, tidak scalable dan rawan ada yang terlewat.

**Keputusan:** Warna Tailwind inti (`primary`, `slate`, `surface`, `soft`) didefinisikan ulang sebagai CSS variable di `globals.css`, di-switch lewat atribut `data-theme`/class `.dark` di `<html>` (hook `useTheme`).

**Konsekuensi:** Ganti tema otomatis berlaku ke seluruh aplikasi tanpa menyentuh komponen manapun — tapi kalau ada komponen yang pakai warna hardcode di luar palet variable ini (bukan lewat class Tailwind `primary`/`slate`/dst.), warna itu tidak akan ikut berubah saat tema di-switch.
