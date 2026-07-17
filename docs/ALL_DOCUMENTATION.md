# Smart Study Planner Documentation

Aplikasi produktivitas akademik untuk mahasiswa — kelola tugas kuliah, jadwal belajar, dan (ke depan) ringkasan materi otomatis lewat AI. Next.js 14 (App Router) + TypeScript, arsitektur **local-first**: hampir seluruh data aplikasi tersimpan di browser pengguna (Zustand/localStorage/IndexedDB); Supabase hanya dipakai untuk Authentication.

## Status Pengembangan Saat Ini

| | |
|---|---|
| **Berjalan penuh** | Manajemen tugas, kalender, kategori, tema/dark-mode, autentikasi (Supabase Auth sungguhan), upload file lokal, Document Processing Pipeline (OCR gambar via OCR.Space + parser lokal PDF/DOCX/DOC/XLS/XLSX/CSV/PPTX), **fitur AI penuh: Summary/Flashcard/Quiz/Recommendation per-dokumen + AI Assistant** (Gemini via provider modular, ber-auth + rate-limit + cache — Milestone A–E) |
| **Berjalan sebagian** | Widget dashboard (pengaturan ada, belum terhubung ke Dashboard); achievement (data ada, belum ada unlock otomatis) |
| **Belum dibuat** | Provider AI selain Gemini (OpenAI/Anthropic/OpenRouter masih stub). Parsing `.ppt` (PowerPoint lama) ditolak permanen — tidak ada library JS yang layak |
| **Ditunda atas permintaan** | Evaluasi widget |

Detail lengkap: [01_PROJECT_OVERVIEW](./01_PROJECT_OVERVIEW.md).

## Teknologi

Next.js 14 · TypeScript · Tailwind CSS · Zustand · IndexedDB (`idb`) · Supabase (Auth only) · Lucide React

Rincian lengkap tiap dependency dan alasannya: [14_DEPENDENCIES](./14_DEPENDENCIES.md).

## Daftar Isi

- [Project Overview](./01_PROJECT_OVERVIEW.md) — tujuan, visi, fitur utama, status
- [Folder Structure](./02_FOLDER_STRUCTURE.md) — fungsi tiap folder
- [Architecture](./03_ARCHITECTURE.md) — alur data, diagram lapisan sistem
- [Authentication](./04_AUTHENTICATION.md) — Supabase Auth, batasan tanggung jawabnya
- [Database](./05_DATABASE.md) — tabel aktif vs obsolete di Supabase
- [State Management](./06_STATE_MANAGEMENT.md) — Zustand + localStorage + IndexedDB
- [Upload System](./07_UPLOAD_SYSTEM.md) — drag&drop, validasi, penyimpanan lokal
- [Document Pipeline](./08_DOCUMENT_PIPELINE.md) — alur Upload → Processor → OCR/Parser Lokal (selesai) → AI Summary (future)
- [API](./09_API.md) — 2 route AI (rule-based) + 1 route Document Processing (sungguhan), kontraknya
- [Components](./10_COMPONENTS.md) — komponen penting & pola yang dipakai
- [Services](./11_SERVICES.md) — logika bisnis per domain
- [Stores](./12_STORES.md) — isi lengkap Zustand store
- [Configuration](./13_CONFIGURATION.md) — env var, config file, build tooling
- [Dependencies](./14_DEPENDENCIES.md) — kenapa tiap package dipakai
- [Security](./15_SECURITY.md) — auth, storage, API, environment variable
- [Roadmap](./16_ROADMAP.md) — selesai / berjalan / belum / dibatalkan
- [Technical Debt](./17_TECH_DEBT.md) — dead code, dependency tak terpakai, dll (tidak dihapus)
- [Changelog](./18_CHANGELOG.md) — riwayat perubahan besar
- [Developer Guide](./19_DEVELOPER_GUIDE.md) — setup, konvensi, cara menambah halaman/state
- [Project Constitution](./20_PROJECT_CONSTITUTION.md) — prinsip inti yang tidak boleh dilanggar tanpa diskusi eksplisit
- [Architectural Decisions](./21_ARCHITECTURAL_DECISIONS.md) — catatan ADR: kenapa tiap keputusan besar diambil

## Cara memakai dokumentasi ini

Setiap file berdiri sendiri untuk satu topik, tapi saling bertaut lewat link relatif — mulai dari mana saja sesuai kebutuhan, ikuti link untuk konteks lebih dalam. Kalau baru pertama kali di project ini, urutan yang disarankan: **Project Overview → Architecture → Project Constitution → Developer Guide**, baru lanjut ke topik spesifik yang relevan dengan pekerjaan yang akan dilakukan. Untuk memahami alasan di balik keputusan arsitektur tertentu (bukan cuma apa keputusannya), lihat Architectural Decisions.

Dokumentasi naratif sesi-per-sesi yang lebih detail (termasuk potongan before/after kode) ada di `Dokumentasi_yuyud27.MD` di root project — dokumen ini menggantikannya sebagai referensi terstruktur utama, bukan menghapusnya.
