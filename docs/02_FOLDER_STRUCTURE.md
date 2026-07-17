# Folder Structure

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Penjelasan **fungsi** tiap folder, bukan sekadar daftar file. Untuk detail isi masing-masing area, lihat dokumen topiknya (ditautkan di tiap baris).

```
smart-study-planner-web/
├── docs/                    Dokumentasi ini
├── src/
│   ├── app/                 Route Next.js App Router (halaman + API)
│   ├── components/          Komponen React, dikelompokkan per domain fitur
│   ├── hooks/                Custom hook React
│   ├── lib/                  Kode infrastruktur/klien tingkat rendah
│   ├── services/              Logika bisnis yang bicara ke dunia luar (network, storage)
│   ├── store/                 State management (Zustand)
│   ├── types/                  Definisi TypeScript domain, satu file untuk semua
│   └── utils/                  Fungsi murni tanpa efek samping
├── public/                   Aset statis
├── middleware.ts             Middleware Next.js (refresh session Supabase)
├── .env.example / .env.local  Konfigurasi environment
└── (file konfigurasi build lainnya di root)
```

## `src/app/` — Routing (Next.js App Router)

Setiap folder di sini = satu route. `page.tsx` = halaman, `route.ts` = API endpoint. Sebagian besar `page.tsx` adalah **wrapper tipis** yang cuma merender komponen dari `src/components/` di dalam `<AppShell>`. Detail per-route: [10_COMPONENTS](./10_COMPONENTS.md) (untuk halaman) dan [09_API](./09_API.md) (untuk `route.ts`).

Route yang tidak dibungkus `<AppShell>`: `src/app/auth/*` dan `src/app/page.tsx` (root, cuma redirect ke `/auth/login`) — keduanya memang tanpa login. `src/app/onboarding/` juga di luar `<AppShell>` tapi **tetap butuh login**: dia melakukan pengecekan auth-nya sendiri (tunggu hydration → cek `isAuthenticated` → redirect), pola yang sama seperti `AppShell`.

## `src/components/` — Komponen per domain

Dikelompokkan per fitur (`tasks/`, `category/`, `upload/`, `ai/`, `calendar/`, `progress/`, `layout/`), plus `common/` untuk primitif UI generik (`Button`, `Card`, `Badge`, `Form`) yang dipakai di mana-mana. `feature/FeaturePage.tsx` adalah satu file besar berisi komponen untuk **7 route berbeda** (category, widget, themes, achievement, premium, account, settings) — lihat [10_COMPONENTS](./10_COMPONENTS.md) untuk alasannya.

Beberapa folder cuma berisi `.gitkeep` (belum ada komponen): `account/`, `achievement/`, `premium/`, `settings/`, `themes/`, `widget/` — placeholder untuk kalau nanti fitur-fitur itu dipecah dari `FeaturePage.tsx`.

## `src/hooks/` — Custom hook

Logika stateful yang dipakai ulang lintas komponen: `useTheme` (sinkronisasi tema/dark-mode ke DOM), `useTaskFilters` (filter+search daftar task), `useFileUpload` (drag&drop, validasi, progress upload). Detail: [10_COMPONENTS](./10_COMPONENTS.md).

## `src/lib/` vs `src/services/` — perbedaan penting

Dua folder ini sering disalahpahami sebagai hal yang sama. Bedanya:

- **`src/lib/`** = infrastruktur/klien tingkat rendah, sering **server-only** atau murni teknis, tidak punya "pengetahuan domain". Contoh: `lib/supabase/*` (klien Supabase), `lib/indexedDb.ts` (wrapper IndexedDB generik), `lib/ai/*` (abstraksi provider AI — sengaja di sini karena harus server-side, lihat [15_SECURITY](./15_SECURITY.md)), `lib/ocr/*` (abstraksi provider OCR, alasan sama), `lib/document/*` (Strategy Pattern processor Document Pipeline — pindah dari `services/` begitu `imageProcessor` mulai memanggil OCR, lihat [11_SERVICES](./11_SERVICES.md)), `lib/upload/config.ts` (konfigurasi validasi file), `lib/data.ts` (data seed/demo).
- **`src/services/`** = logika bisnis yang **memakai** `lib/` untuk melakukan sesuatu yang berarti bagi aplikasi. Contoh: `services/auth/authService.ts` (pakai `lib/supabase/client.ts` untuk login/register), `services/storage/storageService.ts` (pakai `lib/indexedDb.ts` untuk simpan file, plus fungsi export JSON/CSV), `services/ai/aiService.ts` (client-side, manggil API route internal), `services/document/*` (orchestrator `documentService.ts` client-side + `documentRepository.ts` berbasis IndexedDB — keduanya wajib client-only, beda alasan dari `lib/document/*` yang wajib server-only).

Detail lengkap: [11_SERVICES](./11_SERVICES.md).

## `src/store/` — State management

Satu file: `useAppStore.ts`. Satu Zustand store besar untuk **semua** data aplikasi (kecuali identitas auth yang sumber kebenarannya di Supabase). Detail: [12_STORES](./12_STORES.md) dan [06_STATE_MANAGEMENT](./06_STATE_MANAGEMENT.md).

## `src/types/` — Tipe domain

Satu file: `index.ts`. Semua interface/type domain (Task, Category, User, dll) ada di sini — bukan dipecah per-fitur. Konvensi yang harus diikuti kalau menambah tipe baru. Detail: [03_ARCHITECTURE](./03_ARCHITECTURE.md).

## `src/utils/` — Fungsi murni

Logika domain inti yang tidak menyentuh state/network: `priorityScore.ts` (formula skor prioritas — jantung aplikasi), `smartSchedule.ts` (generator jadwal belajar rule-based), `date.ts` (semua urusan tanggal), `id.ts` (generate ID). Detail: [03_ARCHITECTURE](./03_ARCHITECTURE.md).

## Root

- `middleware.ts` + `src/lib/supabase/middleware.ts` — refresh cookie session Supabase di tiap request (bukan proteksi route — itu tugas `AppShell`, lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md)).
- `.env.example` — template variabel environment (aman di-commit). `.env.local` — nilai asli (di-gitignore).
- `tailwind.config.ts` + `src/app/globals.css` — sistem tema berbasis CSS variable, lihat [03_ARCHITECTURE](./03_ARCHITECTURE.md).
