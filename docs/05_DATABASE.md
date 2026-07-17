# Database

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

> Konteks penting: lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md) untuk alasan kenapa Supabase dibatasi hanya untuk auth. Dokumen ini menjelaskan skema yang **sudah terlanjur dibuat** di Supabase (project `smart-study-planner-web`) sebelum keputusan itu final, dan status tiap tabel sekarang.

## Ringkasan status

| Kategori | Tabel | Status |
|---|---|---|
| **Masih dipakai** | `profiles` | ✅ Aktif — diisi otomatis lewat trigger saat register, dibaca saat login |
| **Infrastruktur AI (baru, Milestone B)** | `ai_usage_log` | ✅ Skema ada (RLS aktif, kosong) — counter rate-limit AI per user/hari. **Belum dipanggil route manapun** sampai Milestone D. Pengecualian sempit & terdokumentasi dari "Supabase hanya untuk auth" — lihat di bawah dan [04_AUTHENTICATION](./04_AUTHENTICATION.md) |
| **Obsolete** (ada, RLS aktif, tapi kosong & tidak dipakai kode manapun) | `courses`, `categories`, `tasks`, `subtasks`, `class_schedules`, `study_sessions`, `preferences`, `widget_preferences`, `achievements`, `chat_messages` | ⚠️ Tidak dihapus — lihat alasan di bawah |

**Tidak ada satupun tabel yang dihapus dalam dokumentasi ini** — sesuai arahan, ini murni pencatatan kondisi, bukan pembersihan.

## `profiles` — satu-satunya tabel aktif

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid (PK) | = `auth.users.id` |
| `name` | text | Diisi dari metadata signup |
| `email` | text | |
| `university` | text, nullable | **Sudah tidak diisi** — form register tidak lagi mengumpulkan ini (lihat [17_TECH_DEBT](./17_TECH_DEBT.md)) |
| `major` | text, nullable | Sama seperti `university` |
| `semester` | integer, nullable | Sama seperti `university` |
| `is_premium` | boolean | Default `false` |
| `created_at` | timestamptz | |

Diisi otomatis lewat trigger Postgres `handle_new_user()` setiap ada baris baru di `auth.users` — mengambil `name`/`university`/`major`/`semester` dari `raw_user_meta_data` (kalau tidak ada, otomatis jadi `null`, tidak error). RLS: user hanya bisa baca/update baris miliknya sendiri.

## 10 tabel obsolete

Dibuat saat rencana awal adalah "pindahkan semua data ke Supabase" (lihat [16_ROADMAP](./16_ROADMAP.md)). Rencana itu dibatalkan **sebelum** tabel-tabel ini pernah benar-benar dipakai — jadi semuanya kosong (0 baris), dan tidak ada satupun kode aplikasi yang membaca/menulis ke sana. Semuanya punya struktur RLS yang benar (`user_id` + kebijakan `auth.uid()`) kalau suatu saat memang dibutuhkan kembali.

| Tabel | Untuk apa (kalau dipakai) |
|---|---|
| `courses` | Mata kuliah — sudah digantikan konsep "Aktivitas" per kategori di frontend |
| `categories` | Kategori tugas — versi Supabase dari `useAppStore().categories` |
| `tasks` | Tugas — versi Supabase dari `useAppStore().tasks` |
| `subtasks` | Subtask checklist per tugas |
| `class_schedules` | Jadwal kuliah mingguan |
| `study_sessions` | Sesi belajar (dari smart schedule generator) |
| `preferences` | Preferensi pengguna (tema, bahasa, dll) |
| `widget_preferences` | Pengaturan widget dashboard |
| `achievements` | Progress achievement/gamifikasi |
| `chat_messages` | Riwayat chat AI Assistant |

**Rekomendasi (belum dieksekusi):** tabel-tabel ini kandidat untuk di-*drop* karena kehadirannya berisiko membingungkan developer baru ("kenapa ada tabel tasks kalau datanya di localStorage?"). Ini operasi database yang merusak (destructive) — sengaja tidak dieksekusi tanpa persetujuan eksplisit. Lihat [17_TECH_DEBT](./17_TECH_DEBT.md).

## `ai_usage_log` — counter rate-limit AI (Milestone B)

| Kolom | Tipe | Catatan |
|---|---|---|
| `user_id` | uuid | FK ke `auth.users.id` (`on delete cascade`), bagian PK |
| `usage_date` | date | Bucket harian (bukan timestamp presisi), bagian PK |
| `request_count` | integer | Default `0`, dinaikkan tiap kali salah satu route `/api/ai/*` lolos auth+rate-limit dan akan memanggil provider (Milestone D) |

PK gabungan `(user_id, usage_date)` = satu baris counter per user per hari (pola upsert). RLS aktif dengan policy `select`/`insert`/`update` untuk baris milik sendiri (`(select auth.uid()) = user_id`) — **sengaja tanpa policy `DELETE`**: penghapusan ditolak by-default, mencegah user mengosongkan counter untuk mengelak dari batas harian. **Kenapa ini bukan pelanggaran Pasal 1 (Supabase hanya untuk auth):** yang disimpan murni ANGKA penghitung terikat identitas auth — bukan konten AI. Seluruh konten AI (`AISummary`/`AIFlashcardSet`/`AIQuizSet`/`AIRecommendation`) tetap 100% di IndexedDB. Detail desain: `AI_ARCHITECTURE_FREEZE.md` §7.4.

## Migration yang sudah diterapkan

1. `smart_study_planner_initial_schema` — membuat 11 tabel + RLS + trigger `handle_new_user`.
2. `harden_functions_and_optimize_rls` — perbaikan hasil temuan Supabase security/performance advisor: kunci `search_path` pada function, cabut akses publik ke function `SECURITY DEFINER`, optimasi 12 RLS policy (`auth.uid()` dibungkus `(select ...)` supaya dievaluasi sekali per query, bukan per baris).
3. `handle_new_user_include_profile_fields` — memperluas trigger supaya juga mengisi `university`/`major`/`semester` dari metadata signup.
4. `add_ai_usage_log` (Milestone B, 17 Juli 2026) — membuat tabel `ai_usage_log` + RLS (`select`/`insert`/`update` own, tanpa `DELETE`). Additive; tidak menyentuh tabel lain. Advisor security/performance diverifikasi bersih untuk tabel ini setelah migrasi (tidak ada `auth_rls_initplan` karena `(select auth.uid())` sudah dipakai sejak awal).

TypeScript types hasil generate dari skema ini ada di `src/lib/supabase/database.types.ts` — **harus di-generate ulang manual** kalau skema berubah (tidak otomatis sinkron). Lihat [13_CONFIGURATION](./13_CONFIGURATION.md).

## Kenapa `text` + `CHECK`, bukan Postgres enum native

Kolom seperti `priority`, `difficulty`, `status`, `theme` sengaja pakai `text` dengan `CHECK` constraint, bukan tipe `enum` native Postgres. Alasannya: nilai-nilai ini (khususnya `TaskStatus`) sudah terbukti berubah beberapa kali dalam riwayat project ini, dan `CHECK` jauh lebih murah diubah dibanding `ALTER TYPE` pada enum native.
