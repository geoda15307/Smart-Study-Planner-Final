# Project Overview

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

## Apa ini

Smart Study Planner adalah aplikasi produktivitas akademik untuk mahasiswa: mengelola tugas kuliah, menyusun jadwal belajar, melacak progres, dan (rencananya) meringkas materi kuliah lewat AI. Antarmuka sepenuhnya berbahasa Indonesia dan dioptimalkan untuk mobile-first.

## Visi

Satu tempat bagi mahasiswa untuk: mencatat tugas dengan prioritas yang dihitung otomatis, melihat jadwal kuliah dan deadline dalam satu kalender, mendapat rekomendasi belajar, dan (ke depan) mengunggah dokumen/catatan untuk diringkas otomatis jadi rencana belajar, flashcard, dan kuis.

## Fitur Utama (kondisi saat ini)

| Fitur | Status |
|---|---|
| Manajemen tugas (CRUD, subtask checklist, priority score otomatis) | ✅ Berjalan |
| Kalender & jadwal kuliah | ✅ Berjalan |
| Kategori tugas dengan icon (Lucide) & daftar aktivitas per kategori | ✅ Berjalan |
| Tema warna (4 pilihan) + dark mode, real-time & persisten | ✅ Berjalan |
| AI Assistant | ✅ Berjalan — bisa LLM sungguhan (`AI_PROVIDER=gemini`) atau rule-based (`mock`, default). Lihat [16_ROADMAP](./16_ROADMAP.md) |
| Autentikasi (register/login/logout/session) | ✅ Berjalan, via Supabase Auth sungguhan |
| Upload dokumen (gambar, PDF, spreadsheet, Word, PPTX) | ✅ Berjalan, penyimpanan lokal (IndexedDB) |
| OCR & ekstraksi teks dokumen | ✅ Berjalan — OCR.Space (gambar) + parser lokal (PDF/DOCX/DOC/XLS/CSV/PPTX), Sprint 2–3 |
| AI Summary / Flashcard / Quiz / Recommendation | ✅ Berjalan (Milestone A–E) — panel per-dokumen dengan Gemini, ber-cache + rate-limit |
| Widget dashboard yang bisa diatur | ⚠️ Ada UI pengaturannya, tapi dashboard belum benar-benar membaca pengaturan tersebut |
| Progress tracking & achievement | ✅ Berjalan (data seed, belum ada logika unlock otomatis) |

Detail lengkap tiap fitur: lihat dokumen topik masing-masing di [Master Index](./ALL_DOCUMENTATION.md).

## Teknologi

- **Framework:** Next.js 14 (App Router), TypeScript, React 18
- **Styling:** Tailwind CSS, ikon dari `lucide-react`
- **State:** Zustand (`persist` ke localStorage)
- **Penyimpanan file lokal:** IndexedDB (lewat `idb`)
- **Backend:** Supabase — **hanya** untuk Authentication & data profil (lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md))
- **AI:** Belum ada provider sungguhan yang aktif — lihat [16_ROADMAP](./16_ROADMAP.md)

Rincian lengkap dependency: [14_DEPENDENCIES](./14_DEPENDENCIES.md).

## Status Pengembangan Saat Ini

Project ini dikembangkan oleh tim kecil (kolaborasi lewat GitHub — beberapa perubahan besar seperti penyederhanaan form registrasi dan sistem icon kategori berasal dari collaborator, bukan hanya satu kontributor).

**Keputusan arsitektur paling penting yang perlu dipahami sebelum melanjutkan pengembangan:**

1. **Supabase untuk Auth + counter rate-limit AI.** Sempat ada rencana memindahkan seluruh data aplikasi (task, kategori, dll) ke Supabase — rencana itu **dibatalkan**; semua data aplikasi tetap lokal. Satu pengecualian sempit sejak Milestone B: tabel `ai_usage_log` (angka counter, bukan konten). Lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md) dan [05_DATABASE](./05_DATABASE.md).
2. **Fitur AI penuh (Summary/Flashcard/Quiz/Recommendation + AI Assistant) sudah jadi** (Milestone A–E), memakai Google Gemini lewat provider modular. Default `AI_PROVIDER=mock` (rule-based/JSON palsu, tanpa biaya); set `AI_PROVIDER=gemini` + `GEMINI_API_KEY` untuk AI sungguhan. Semua pemanggilan AI ber-auth + rate-limit + cache. Lihat `AI_ARCHITECTURE_FREEZE.md` dan [16_ROADMAP](./16_ROADMAP.md).
3. **Pipeline dokumen lengkap dari upload sampai fitur AI**: upload → ekstraksi teks (OCR/parser, Sprint 2–3) → Summary/Flashcard/Quiz/Recommendation on-demand (Milestone A–E). Lihat [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md).

Untuk riwayat perubahan besar secara kronologis, lihat [18_CHANGELOG](./18_CHANGELOG.md). Untuk perbandingan rencana lama vs keputusan final, lihat [16_ROADMAP](./16_ROADMAP.md).
