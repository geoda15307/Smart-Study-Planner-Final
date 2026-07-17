# Smart Study Planner

Aplikasi **academic productivity assistant** untuk mahasiswa: manajemen tugas dengan priority score otomatis, jadwal kuliah & kalender, rekomendasi belajar rule-based, upload dokumen materi dengan ekstraksi teks otomatis (OCR + parser lokal), dan — sedang dibangun — ringkasan materi via AI.

UI sepenuhnya Bahasa Indonesia, mobile-first, responsive desktop. Dibangun dengan Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, IndexedDB, dan Supabase (khusus Authentication).

> **Dokumentasi utama ada di [`docs/`](./docs/ALL_DOCUMENTATION.md)** — README ini hanya ringkasan. Mulai dari master index tersebut, dan baca [`docs/20_PROJECT_CONSTITUTION.md`](./docs/20_PROJECT_CONSTITUTION.md) untuk aturan project yang tidak boleh dilanggar tanpa diskusi eksplisit.

## Arsitektur Singkat

**Local-first.** Hampir seluruh data aplikasi hidup di browser pengguna:

| Data | Tempat |
|---|---|
| Task, kategori, jadwal, preferensi, achievement, chat | Zustand + localStorage (`smart-study-planner-store`) |
| Blob file upload + hasil ekstraksi teks (`DocumentRecord`) | IndexedDB (store `files` + `documents`) |
| Identitas pengguna (register/login/session/profil) | **Supabase — hanya untuk Authentication** (keputusan final, lihat Konstitusi Pasal 1) |

AI & OCR hanya dipanggil lewat API route internal (`/api/ai/*`, `/api/document/process`) supaya API key tidak pernah sampai ke browser.

## Fitur Saat Ini

- ✅ **Autentikasi sungguhan** via Supabase Auth (register/login/logout/session) — bukan mock.
- ✅ **Task Manager**: CRUD, subtask checklist, filter/search/sort, priority score otomatis.
- ✅ **Kalender bulanan** + jadwal kuliah.
- ✅ **Kategori** dengan Lucide icon + daftar "Aktivitas" per kategori.
- ✅ **4 tema warna + dark mode** — CSS variable, real-time & persisten.
- ✅ **Upload dokumen** (gambar/PDF/Word/spreadsheet/PPTX, maks 10MB) → pipeline otomatis: validasi → deteksi kategori → ekstraksi teks (OCR.Space untuk gambar; `pdf-parse`/`mammoth`/`word-extractor`/`xlsx`/parser PPTX kustom untuk sisanya) → tersimpan sebagai `DocumentRecord` di IndexedDB. `.ppt` legacy ditolak permanen (tidak ada library JS yang layak).
- ✅ **Progress & Analytics** (chart), achievement (data seed), export JSON/CSV.
- ⚠️ **AI Assistant & AI Task Analysis** — masih **rule-based** (`/api/ai/analyze`, `/api/ai/chat`), bukan LLM sungguhan. Arsitektur AI sungguhan (Summary/Flashcard/Quiz/Recommendation) sudah **APPROVED** di [`docs/AI_ARCHITECTURE_FREEZE.md`](./docs/AI_ARCHITECTURE_FREEZE.md), diimplementasikan bertahap lewat Milestone A–E.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Isi di `.env.local` (wajib):

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — tanpa ini autentikasi tidak jalan.
- `OCR_SPACE_API_KEY` — supaya OCR gambar berfungsi (daftar gratis di https://ocr.space/ocrapi/freekey).

Buka http://localhost:3000 — root otomatis redirect ke `/auth/login`.

Akun demo (atau klik tombol **"Masuk sebagai Demo"** di halaman login):

```txt
Email    : demo@smartstudy.app
Password : password123
```

> Supabase memvalidasi domain email sungguhan — domain palsu seperti `@example.com` ditolak saat register. "Confirm email" saat ini dimatikan di dashboard Supabase (tahap development; tinjau ulang sebelum production — lihat `docs/15_SECURITY.md`).

## Perintah

```bash
npm run dev       # dev server, http://localhost:3000
npm run build     # production build
npm run start     # serve production build
npm run lint      # ESLint (next lint)
npx tsc --noEmit  # type-check (tidak ada script npm khusus)
```

Tidak ada test runner. Verifikasi perubahan: `tsc` + `lint` bersih **dan** uji manual di browser (Konstitusi Pasal 6).

## Priority Scoring

File: `src/utils/priorityScore.ts`

```txt
priorityScore =
deadlineScore * 0.40 +
manualPriorityScore * 0.25 +
difficultyScore * 0.15 +
durationScore * 0.10 +
statusRiskScore * 0.10
```

Hasil di-clamp 0–100; status `"Selesai"` memaksa skor 0. Skor: 80–100 Urgent · 60–79 High · 40–59 Medium · 0–39 Low.

## Smart Schedule Generator

File: `src/utils/smartSchedule.ts` — rule-based: task deadline terdekat & skor tinggi didahulukan, task panjang dipecah jadi sesi 45–90 menit, mengikuti `productiveTime` dan `maxStudyHoursPerDay` user, task selesai tidak dijadwalkan lagi.

## Tahap Pengembangan Berikutnya

Roadmap aktif: [`docs/16_ROADMAP.md`](./docs/16_ROADMAP.md). Ringkas — fase AI per [`docs/AI_ARCHITECTURE_FREEZE.md`](./docs/AI_ARCHITECTURE_FREEZE.md):

1. Milestone A — domain model AI + Prompt Builder + chunking (pure, additive).
2. Milestone B — storage AI (IndexedDB v3, `aiRepository`, cache, tabel `ai_usage_log`).
3. Milestone C — provider Gemini + mock lengkap.
4. Milestone D — AI service + route `/api/ai/*` dengan auth + rate limiting.
5. Milestone E — UI Summary/Flashcard/Quiz/Recommendation + AI chat sungguhan.
