# Technical Debt

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

**Tidak ada yang dihapus dalam pembuatan dokumen ini** — murni katalog kondisi saat ini, sesuai arahan.

## Dead Code

| Item | Detail |
|---|---|
| `Course` type + `courses` seed data + `useAppStore().courses` | Awalnya untuk memilih "Mata Kuliah" saat membuat task. `TaskForm` sudah tidak memakainya (diganti "Aktivitas" per kategori) — tapi state, tipe, dan seed data-nya masih ada dan aktif di store |
| `task.courseId` / `task.courseName` | Nama kolom masih menyiratkan "mata kuliah", tapi isinya sekarang teks Aktivitas yang dipilih dari kategori. Nama field menyesatkan bagi developer baru |
| `profiles.university` / `major` / `semester` (Supabase) | Kolom masih ada (nullable), tapi form register sudah tidak mengumpulkan data ini sejak disederhanakan |
| 10 tabel Supabase (`tasks`, `categories`, `courses`, dst.) | Kosong, tidak dipakai kode manapun. Detail lengkap: [05_DATABASE](./05_DATABASE.md) |
| `WidgetPreference.enabled` / `.size` | Bisa diatur dari `WidgetPage`, tapi Dashboard tidak membaca nilainya — widget di dashboard hardcoded, tidak terhubung ke pengaturan ini |
| Folder `.gitkeep`-only di `src/components/`: `account/`, `achievement/`, `premium/`, `settings/`, `themes/`, `widget/` | Placeholder kosong, komponennya masih hidup di `FeaturePage.tsx` (lihat [10_COMPONENTS](./10_COMPONENTS.md)) |
| Folder kosong lain: `src/assets/`, `src/constants/`, `src/styles/` | Cuma `.gitkeep`, belum pernah dipakai sama sekali |
| File `.backup` tersebar di repo | `CLAUDE.md.backup`, `package.json.backup`, `tsconfig.json.backup`, `Dokumentasi_yuyud27.MD.backup`, dan beberapa file `src/**/*.backup` — hasil kebijakan backup-sebelum-edit yang diminta pengguna. Di-gitignore (`*.backup`), tidak masuk riwayat Git, tapi tetap ada di disk lokal |

## Unused Dependency

| Package | Temuan |
|---|---|
| `tailwind-merge` | **Tidak ada satupun import-nya di seluruh `src/`** (dikonfirmasi lewat pencarian menyeluruh). Terpasang di `package.json` tapi tidak dipakai kode manapun. Kandidat untuk dilepas, atau mulai benar-benar dipakai untuk merge className kondisional (tujuan awal library ini) |

Semua dependency lain terverifikasi masih dipakai — detail alasan tiap dependency: [14_DEPENDENCIES](./14_DEPENDENCIES.md).

## Duplicate / Tanggung Jawab Bercampur

| Item | Detail |
|---|---|
| `services/storage/storageService.ts` | Berisi dua kelompok fungsi tidak berhubungan dalam satu file: export JSON/CSV (fitur lama) dan penyimpanan file upload ke IndexedDB (fitur baru). Belum masalah besar karena ukurannya masih kecil, tapi berpotensi membingungkan kalau terus bertambah |

## Known Risk / Dependency Gotcha (Local Parser, Sprint 2)

| Item | Detail |
|---|---|
| `word-extractor` (.doc legacy) | Terakhir di-update 2022 (~4 tahun). Dipilih sadar (bukan alpa) sebagai satu-satunya opsi best-effort untuk format biner Word lama — tidak ada alternatif JS yang lebih terawat. Kalau ada bug edge-case di masa depan, tidak ada jaminan maintenance upstream |
| `.ppt` (PowerPoint legacy, biner) | **Tidak didukung sama sekali**, bukan bug — sudah dicek, tidak ada library JS yang layak untuk format ini (beda dengan `.doc` yang setidaknya punya `word-extractor`). Processor menolaknya eksplisit dengan `errorCode: "NOT_IMPLEMENTED"` |
| `mammoth` README vs source code | README mendokumentasikan opsi `{arrayBuffer}` untuk `extractRawText`, tapi source code aktual (`lib/unzip.js`) hanya mengecek `options.path`/`options.buffer` — `{arrayBuffer}` gagal diam-diam (`"Could not find file in options"`). Ketahuan lewat testing langsung, bukan dari dokumentasi. Kalau upgrade versi `mammoth` di masa depan, verifikasi ulang perilaku ini sebelum percaya README |
| `xlsx` diinstal dari CDN SheetJS, bukan npm registry | Versi npm resmi (`0.18.5`) punya 2 CVE HIGH tanpa fix (Prototype Pollution, ReDoS) yang relevan langsung ke aplikasi ini (memparsing file upload pengguna). `package.json` menunjuk ke `https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz` — kalau `npm install` dijalankan ulang di masa depan, versi yang terpasang bisa berbeda dari saat ini (`0.20.3`) karena URL menunjuk ke "latest", bukan versi tertentu yang dikunci |

## Obsolete Migration / Konfigurasi

| Item | Detail |
|---|---|
| Insiden upgrade Next.js 16 yang tidak sengaja ter-commit sebagian | Sudah diperbaiki (kembali ke Next 14), tapi jadi pengingat: **jangan** biarkan perubahan `package.json`/`tsconfig.json` (`jsx: "react-jsx"` vs `"preserve"`) yang berasal dari eksperimen lain tercampur ke commit fitur. Detail: [18_CHANGELOG](./18_CHANGELOG.md) |
| Skema Supabase 11-tabel | Bukan "salah", tapi didesain untuk rencana yang sudah dibatalkan (lihat [16_ROADMAP](./16_ROADMAP.md)). 10 dari 11 tabelnya sekarang murni beban kognitif tanpa fungsi |

## TODO / FIXME

**Tidak ditemukan** komentar `TODO`/`FIXME`/`HACK`/`XXX` eksplisit di manapun dalam `src/` (dikonfirmasi lewat pencarian menyeluruh) — konsisten dengan gaya project ini yang memang minim komentar kode secara umum, bukan berarti tidak ada pekerjaan tertunda (lihat [16_ROADMAP](./16_ROADMAP.md) untuk daftar pekerjaan yang belum selesai secara eksplisit).

## AI (Milestone A–E) — backlog & batasan yang disadari

| Item | Detail |
|---|---|
| `ai_usage_log` increment tidak atomik | `guard.ts` memakai read-then-upsert — ada race kecil kalau dua request AI bersamaan (dua-duanya baca count sama, tulis count+1 yang sama). Diterima untuk MVP single-user; kandidat: RPC Postgres atomik. Juga di [15_SECURITY](./15_SECURITY.md) |
| Chat tidak di-rate-limit | `/api/ai/chat` hanya auth (bukan `ai_usage_log`) — keputusan sadar (chat murah & sering, §16 E). Kalau `AI_PROVIDER=gemini` dipakai berat, chat bisa jadi celah biaya yang tak terbatas; pertimbangkan rate-limit terpisah kalau perlu |
| `DocumentDebugPanel` masih ada | Panel debug Sprint 3 (status ekstraksi + teks mentah) masih ditampilkan di `UploadFileItem` bersama `AIDocumentPanel` yang lebih rapi. Bukan desain final — kandidat disembunyikan/diringkas |
| Task dari saran AI pakai default | `suggestionToTask` mengisi `categoryId: "lainnya"`, `difficulty: "Medium"`, `deadlineDate: +7 hari` kalau saran tidak memberi — belum ada UI untuk user menyetel sebelum menambah. `AICalendarSuggestion` tanpa tanggal → default hari ini / jam 19:00 |
| Hasil AI tidak di-mirror ke Zustand | Tiap panel AI membaca `aiRepository` (IndexedDB) sendiri saat mount — tidak ada mirror reaktif seperti `documents`. Cukup untuk MVP (panel per-dokumen); kalau butuh reaktivitas lintas halaman, tambah slice non-persisted |
| `resetDemoData()` tidak membersihkan store `ai_*` IndexedDB | Sama pola dengan gap `uploadedFiles`/`documents` yang sudah ada — reset store tidak menghapus `AISummary`/dll di IndexedDB |
| `AITaskSuggestion.status: "applied"` dipersist, tapi tidak ada UI daftar rekomendasi historis | Setelah "Tambahkan ke Tugas", saran ditandai `applied` + dipersist, tapi hanya terlihat saat panel dokumen dibuka lagi; belum ada halaman "riwayat rekomendasi" |

## Rekomendasi (belum dieksekusi, butuh keputusan)

1. **Drop 10 tabel Supabase obsolete** — destructive, butuh persetujuan eksplisit sebelum dieksekusi.
2. **Lepas `tailwind-merge`** dari `package.json`, atau mulai benar-benar memakainya.
3. **Rapikan penamaan** `task.courseId`/`courseName` → sesuatu yang mencerminkan "Aktivitas" (butuh migrasi tipe + penyesuaian semua pemakai, cukup invasif untuk fitur yang sudah berjalan — pertimbangkan matang sebelum eksekusi).
4. **Hubungkan `WidgetPreference`** ke Dashboard, atau evaluasi ulang apakah fitur widget-yang-bisa-diatur ini masih relevan (ini persis lingkup "Evaluasi Widget" yang sengaja ditunda — lihat [16_ROADMAP](./16_ROADMAP.md)).
