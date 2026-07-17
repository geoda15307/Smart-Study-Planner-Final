# Dependencies

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Daftar lengkap ada di `package.json`. Dokumen ini menjelaskan **kenapa** dependency penting dipakai, bukan mendaftar ulang versi — untuk itu langsung cek `package.json`.

## Dependency inti (semua masih aktif dipakai)

| Package | Kenapa dipakai | Alternatif |
|---|---|---|
| `next` | Framework — App Router, routing, API routes | — |
| `react`, `react-dom` | Wajib untuk Next.js | — |
| `zustand` | State management. Dipilih kemungkinan karena API-nya minim boilerplate dibanding Redux, dan `persist` middleware bawaan pas untuk pola local-first project ini | Redux Toolkit, Jotai |
| `@supabase/ssr` + `@supabase/supabase-js` | Klien Supabase — **hanya** dipakai untuk Authentication (lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md)), bukan untuk data aplikasi | — (kalau Supabase Auth diganti, ini bisa dilepas seluruhnya) |
| `idb` | Wrapper Promise di atas IndexedDB API native. Ditambahkan khusus untuk sistem upload — IndexedDB API native berbasis event/callback yang mudah salah kalau ditulis manual | Bisa hand-roll IndexedDB langsung (lebih rawan bug), atau `localforage` (lebih besar, fitur lebih dari yang dibutuhkan) |
| `lucide-react` | Library icon — dipakai `CategoryIcon` untuk resolusi icon dinamis dari string, dan komponen upload | `heroicons`, `react-icons` |
| `date-fns` | Semua manipulasi tanggal (`utils/date.ts`), termasuk locale Indonesia (`id`) | `dayjs`, `luxon` |
| `recharts` | Chart di halaman Progress (`ProgressCharts.tsx`) | `chart.js`, `visx` |
| `clsx`, `tailwind-merge` | Utility gabungan className kondisional — umum dipakai bersama Tailwind | — |

## Local Parser (Sprint 2) — server-only, lihat [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md)

| Package | Kenapa dipakai | Catatan |
|---|---|---|
| `pdf-parse` (v2) | Ekstraksi teks PDF digital, wrapper `pdfjs-dist` | Butuh `experimental.serverComponentsExternalPackages` di `next.config.mjs` — gagal di-bundle webpack RSC tanpa itu |
| `mammoth` | Ekstraksi teks `.docx` | README menyebut opsi `{arrayBuffer}` tapi source code aktual hanya menerima `{buffer}`/`{path}` — pakai `{buffer: Buffer.from(...)}`. Tidak punya `@types` bawaan maupun `@types/mammoth` di registry — deklarasi ambient manual di `src/types/mammoth.d.ts` |
| `word-extractor` + `@types/word-extractor` | Ekstraksi teks `.doc` (format lama) | Library terakhir update 2022 — dipilih sadar sebagai best-effort (tidak ada alternatif JS yang lebih terawat), lihat [17_TECH_DEBT](./17_TECH_DEBT.md) |
| `xlsx` (SheetJS) | Parsing `.xlsx`/`.xls`/`.csv` | **Diinstal dari CDN resmi SheetJS** (`https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`), bukan npm registry — versi npm (`0.18.5`) punya 2 CVE HIGH tanpa fix (Prototype Pollution, ReDoS) yang relevan langsung karena package ini memparsing file upload pengguna. SheetJS sendiri sudah berhenti publish ke npm karena sengketa kebijakan penamaan; CDN adalah kanal resmi mereka untuk versi yang sudah diperbaiki |
| `jszip` + `fast-xml-parser` | Parser PPTX kustom (`.pptx` = ZIP + XML) | Dipilih daripada library "pptx-parser" pihak ketiga yang beta/tidak terawat sejak 2022 — kedua library ini generik, aktif dipelihara, dan hasilnya dikontrol penuh oleh kode sendiri |

## Dev dependencies

| Package | Kenapa |
|---|---|
| `typescript` | Type-checking |
| `eslint`, `eslint-config-next` | Linting. **Catatan:** sempat tidak ada file `.eslintrc.json` sama sekali di awal project, jadi `next lint` tidak pernah benar-benar jalan sampai ditambahkan belakangan |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling |
| `@types/*` | Definisi tipe untuk Node/React |

## Dependency yang TIDAK ada (sengaja, keputusan sadar)

Beberapa library yang mungkin terlihat "wajar" untuk fitur yang ada, tapi sengaja tidak ditambahkan:

- **`react-dropzone`** — drag & drop upload di-hand-roll pakai native browser Drag-and-Drop API + `<input type="file">`, bukan library. Konsisten dengan gaya project ini yang menjaga jumlah dependency tetap kecil.
- **`papaparse`** — tidak ditambahkan terpisah untuk CSV karena `xlsx` (SheetJS) sudah menangani `.csv`/`.xls`/`.xlsx` dalam satu library, mengurangi jumlah dependency.
- **SDK provider AI** (`openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, dst.) — **sengaja tidak ditambahkan meski provider Gemini kini nyata** (Milestone C). `src/lib/ai/providers/gemini.ts` memanggil REST API Generative Language lewat `fetch` mentah + `x-goog-api-key` header, persis gaya `lib/ocr/ocrSpaceProvider.ts` yang juga hand-roll HTTP — menjaga jumlah dependency tetap kecil. Konsekuensinya: konversi `PromptSpec.responseSchema` (JSON Schema penuh) ke subset yang didukung Gemini ditangani sendiri di `gemini.ts` (`toGeminiSchema`), bukan oleh SDK. `openai`/`anthropic`/`openrouter` masih stub, jadi belum butuh SDK apapun.

## Versi Next.js — insiden yang perlu diketahui

Sempat ada percobaan upgrade ke **Next.js 16** yang tidak sengaja ter-commit sebagian (duplikat key `"next"` di `package.json`, lockfile ter-lock ke `16.2.10`, padahal React masih di versi 18 yang tidak kompatibel dengan Next 16). Ini sudah diperbaiki — project ini berjalan di **Next.js 14** (`^14.2.15`, ter-lock ke `14.2.35`). Kalau suatu saat memang ingin upgrade Next.js, itu harus jadi keputusan sadar dan direncanakan (termasuk upgrade React ke v19), bukan kebawa tidak sengaja lagi. Detail insiden: [17_TECH_DEBT](./17_TECH_DEBT.md) dan [18_CHANGELOG](./18_CHANGELOG.md).
