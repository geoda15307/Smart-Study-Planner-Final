# Developer Guide

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Panduan praktis untuk mulai bekerja di codebase ini — bukan pengulangan arsitektur (lihat [03_ARCHITECTURE](./03_ARCHITECTURE.md) untuk itu), tapi langkah konkret dan konvensi yang harus diikuti.

## Setup Awal

```bash
npm install
cp .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.local
npm run dev
```

Tanpa dua variabel Supabase itu terisi, autentikasi tidak akan jalan (lihat [13_CONFIGURATION](./13_CONFIGURATION.md)). Tidak ada database lokal yang perlu disiapkan — data aplikasi otomatis ter-seed dari `src/lib/data.ts` saat pertama kali dibuka.

## Perintah Penting

```bash
npm run dev      # Dev server, http://localhost:3000
npm run build     # Build production
npm run lint      # ESLint (next lint)
npx tsc --noEmit  # Type-check (tidak ada script npm khusus untuk ini, jalankan langsung)
```

**Tidak ada test runner terkonfigurasi.** Verifikasi perubahan dengan `tsc --noEmit` + `next lint` (harus 0 error) **dan** uji manual di browser — terutama untuk perubahan UI/state, karena type-check tidak menjamin perilaku benar secara fungsional.

## Sebelum Commit

1. `npx tsc --noEmit` — harus bersih.
2. `npx next lint` — harus bersih.
3. Uji alur yang terdampak langsung di browser (bukan cuma percaya kode terlihat benar).
4. `git fetch` dan cek `git log HEAD..origin/<branch>` — repo ini dikerjakan beberapa kontributor yang push langsung ke branch yang sama; commit baru dari orang lain bisa muncul kapan saja. Selalu sinkron dulu sebelum push, siap resolve konflik.

## Konvensi yang Harus Diikuti

| Aturan | Detail |
|---|---|
| **Satu file tipe** | Semua interface/type domain baru masuk `src/types/index.ts` — jangan buat file tipe baru per fitur. Lihat [02_FOLDER_STRUCTURE](./02_FOLDER_STRUCTURE.md) |
| **`lib/` vs `services/`** | `lib/` = infrastruktur tingkat rendah tanpa pengetahuan domain (boleh server-only). `services/` = logika bisnis yang memakai `lib/`. Kode yang menyentuh API key provider AI **wajib** di `lib/`, tidak boleh diimpor kode client-side. Lihat [11_SERVICES](./11_SERVICES.md), [15_SECURITY](./15_SECURITY.md) |
| **Pola action Zustand** | Collection baru di store ikuti pola `addX`/`updateX` (terima `Partial<X>`)/`removeX`. Lihat [12_STORES](./12_STORES.md) |
| **`priorityScore` tidak boleh di-set manual** | Selalu lewat action store (`addTask`/`updateTask`/`completeTask`) — semuanya otomatis lewat helper `score()` di dalam store |
| **String literal domain itu load-bearing** | Nilai seperti `TaskStatus`, `Priority` dipakai sebagai key di banyak map (`priorityScore.ts`, `Badge.tsx`, dst.) dan dibandingkan langsung (`status === "Selesai"`). Ubah satu nilai berarti update semua map/perbandingan terkait |
| **Halaman baru wajib di dalam `<AppShell>`** | Kalau tidak, tidak terproteksi login sama sekali. Tambahkan juga ke array `appRoutes` di `AppShell.tsx` supaya muncul di navigasi. Lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md), [10_COMPONENTS](./10_COMPONENTS.md) |
| **Jangan tambah tabel Supabase untuk data aplikasi** | Supabase hanya untuk Auth. Lihat [20_PROJECT_CONSTITUTION](./20_PROJECT_CONSTITUTION.md) Pasal 1 |
| **Provider AI/OCR lewat abstraksi, jangan hardcode** | Implementasi baru masuk `src/lib/ai/providers/` atau `src/lib/ocr/providers/`, ikuti interface yang sudah ada di `src/lib/ai/types.ts` / `src/lib/ocr/types.ts` |

## Cara Menambah Halaman Baru

1. Buat `src/app/<route>/page.tsx` — biasanya cukup wrapper tipis: `<AppShell title="..." subtitle="..."><KomponenFitur /></AppShell>`.
2. Buat komponen fiturnya di `src/components/<domain>/`.
3. Tambahkan entri ke `appRoutes` (dan `mobileQuickRoutes` kalau perlu shortcut mobile) di `src/components/layout/AppShell.tsx`.
4. Tidak perlu ubah `middleware.ts` — matcher-nya sudah blanket, otomatis mencakup route baru.

## Bekerja dengan Data Lokal vs Supabase

- Data aplikasi (task, kategori, dll) → **selalu** lewat `useAppStore`, tidak pernah lewat Supabase.
- File besar (gambar, dokumen) → IndexedDB lewat `services/storage/storageService.ts`, bukan localStorage langsung.
- Hanya identitas/profil pengguna yang lewat Supabase (`services/auth/authService.ts`).

Kalau ragu di mana data baru harus disimpan, cek [20_PROJECT_CONSTITUTION](./20_PROJECT_CONSTITUTION.md) Pasal 1 dulu sebelum menulis kode.

## Troubleshooting Umum

- **UI tampil polos tanpa styling Tailwind (HTML default):** hampir pasti cache `.next/` korup karena `npm run build` dijalankan **saat `next dev` masih hidup** — keduanya berbagi folder `.next/`, build menimpa chunk dev, dev server lalu mereferensikan CSS yang sudah tidak ada (404 di `/_next/static/css/...`). Bukan bug kode. Pemulihan: matikan dev server → hapus folder `.next/` → `npm run dev` lagi. **Aturan: jangan pernah jalankan `next build` selagi dev server hidup** — matikan dev dulu kalau mau verifikasi build. Insiden nyata tercatat di [18_CHANGELOG](./18_CHANGELOG.md).
- **Masalah auth/state yang aneh:** cek dua localStorage key sekaligus (`smart-study-planner-store` dan `sb-<ref>-auth-token`) — salah satu bisa basi sementara yang lain tidak. Lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md).
- **Icon kategori tidak muncul:** `CategoryIcon` diam-diam fallback ke ikon default kalau string nama icon tidak cocok nama komponen Lucide — cek ejaan `category.icon`. Lihat [10_COMPONENTS](./10_COMPONENTS.md).
- **Reset data demo:** tombol "Reset Data" di Settings memanggil `resetDemoData()` — pertahankan sesi login, tapi kosongkan `uploadedFiles` di store **tanpa** membersihkan blob-nya di IndexedDB (gap yang sudah dicatat, lihat [17_TECH_DEBT](./17_TECH_DEBT.md)).

## Sebelum Menambah Dependency Baru

Project ini sengaja menjaga jumlah dependency kecil (lihat [14_DEPENDENCIES](./14_DEPENDENCIES.md)) — beberapa hal yang "wajar" ditambahkan library (drag&drop, className merge) malah di-hand-roll atau ditunda. Pikirkan dulu apakah native API browser atau kode beberapa baris sudah cukup sebelum menambah package baru.
