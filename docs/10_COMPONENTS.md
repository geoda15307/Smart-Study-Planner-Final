# Components

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Dokumen ini fokus ke komponen yang **penting untuk dipahami** — bukan katalog lengkap tiap komponen kecil. Primitif UI generik (`Button`, `Card`, `Badge`, `Form`) disebut sekali di bawah tanpa detail per-prop, karena penggunaannya sudah jelas dari nama.

## `AppShell` — gerbang aplikasi

**File:** `src/components/layout/AppShell.tsx`. Bukan sekadar layout — ini yang: (1) memproteksi route dari akses tanpa login, (2) menerapkan tema/dark-mode ke DOM lewat `useTheme()`, (3) mendengarkan perubahan status auth Supabase. **Setiap halaman yang butuh login harus dirender di dalamnya**, atau tidak terproteksi. Detail lengkap: [04_AUTHENTICATION](./04_AUTHENTICATION.md).

Juga memegang dua array navigasi: `appRoutes` (sidebar desktop + menu penuh mobile) dan `mobileQuickRoutes` (bottom bar mobile, 4 shortcut + tombol menu). Menambah halaman baru ke nav = menambah satu baris ke array ini.

## `FeaturePage.tsx` — satu file, tujuh halaman

**File:** `src/components/feature/FeaturePage.tsx`. Pola yang tidak umum tapi disengaja: file ini berisi **7 komponen halaman berbeda** (`CategoryPage`, `WidgetPage`, `ThemesPage`, `AccountPage`, `AchievementPage`, `PremiumPage`, `SettingsPage`), masing-masing di-import oleh route-nya sendiri di `src/app/<route>/page.tsx`. Alasannya kemungkinan: halaman-halaman ini kecil dan jarang berubah bersamaan, jadi dikelompokkan daripada dipecah jadi 7 file terpisah. Kalau salah satu halaman ini berkembang jadi kompleks, pertimbangkan memecahnya ke file sendiri (folder placeholder untuk ini sudah ada: `components/category/`, `components/achievement/`, dst. — lihat [02_FOLDER_STRUCTURE](./02_FOLDER_STRUCTURE.md)).

## `TaskCard` & `TaskForm` — inti fitur task

**`src/components/tasks/TaskCard.tsx`** — kartu ringkas di daftar task: badge prioritas/status, icon kategori, judul, deadline, progress bar subtask (dihitung dari `subtasks[].completed`), priority score. Dipakai di Dashboard dan halaman Tasks.

**`src/components/tasks/TaskForm.tsx`** — form tambah task. Perhatikan: field "Mata Kuliah" **sudah tidak ada** — diganti "Aktivitas" yang opsinya bergantung kategori yang dipilih (`categories[].activities`). Nilai aktivitas yang dipilih tetap disimpan ke kolom `task.courseId`/`task.courseName` di belakang layar (nama kolom lama dipertahankan, cuma isinya sekarang teks aktivitas, bukan ID mata kuliah) — lihat catatan di [17_TECH_DEBT](./17_TECH_DEBT.md).

## `CategoryIcon` — resolusi icon dinamis dari string

**File:** `src/components/category/CategoryIcon.tsx`. Menerima `category.icon` sebagai **string** (misalnya `"graduation-cap"`) dan mengubahnya jadi komponen Lucide React secara dinamis: split by `-`/`_`/spasi → PascalCase → cari di object `lucide-react`. Kalau tidak ketemu (nama salah, atau memang emoji lama), fallback ke ikon default (`❔`). Ini kenapa menambah kategori baru dengan `icon` string yang salah ketik **tidak error**, cuma tampil fallback — penting diketahui saat debug "kenapa icon kategori ini tidak muncul".

## Panel AI per-dokumen (Milestone E)

**`src/components/ai/`** — UI fitur AI, muncul di halaman **Dokumen** (`/upload`) di dalam `UploadFileItem`, **hanya** untuk dokumen yang teksnya berhasil diekstrak (`DocumentRecord.status === "completed"`).

- `AIDocumentPanel.tsx` — kontainer per-dokumen. Tombol "Buat Ringkasan AI" (generate on-demand, bukan otomatis saat upload — hemat token, §11 freeze), menampilkan ringkasan (title/summary/keyPoints/keywords/difficulty/dll), lalu tab Flashcard/Quiz/Rekomendasi. Tombol "Generate ulang ringkasan".
- `AIFlashcardView.tsx` / `AIQuizView.tsx` / `AIRecommendationView.tsx` — tiap view: load hasil cache dari `aiRepository` saat mount, generate on-demand via service Milestone D, deteksi **stale** (kalau `summaryId` tak cocok summary aktif → badge "sumber berubah" + generate ulang). Quiz interaktif (pilih opsi → kunci + tampilkan benar/salah + penjelasan + skor). Recommendation: tombol "Tambahkan ke Tugas"/"Tambahkan ke Kalender" per item → `addTask`/`addStudySession` dengan `sourceDocumentId`+`sourceSuggestionId`, lalu menandai saran `applied` (dipersist balik ke `aiRepository`).
- `AIStates.tsx` — potongan UI bersama (`AILoading`/`AIError`/`AIStaleNote`).

Semua memanggil **service Milestone D** (`services/ai/*Service.ts`) — tidak menduplikasi logika bisnis (cache/chunking/validasi ada di backend). Detail alur & kontrak: [11_SERVICES](./11_SERVICES.md), [09_API](./09_API.md), `AI_ARCHITECTURE_FREEZE.md` §11.

## `ChatWindow` & `CalendarView`

**`src/components/ai/ChatWindow.tsx`** — UI chat AI Assistant, termasuk tombol quick-prompt. Memanggil `services/ai/aiService.ts` → `/api/ai/chat` yang (sejak Milestone E) menyambung ke `getAIProvider().chat()` sungguhan (Gemini bila aktif; mock rule-based bila default). Komponen ini **tidak berubah** — kontrak input/output route dijaga sama. Lihat [09_API](./09_API.md).

**`src/components/calendar/CalendarView.tsx`** — kalender bulanan, menandai tanggal dengan deadline task (titik warna sesuai prioritas).

## Komponen Upload

**`src/components/upload/`** (`UploadDropzone`, `UploadFileList`, `UploadFileItem`) — lihat detail lengkap alurnya di [07_UPLOAD_SYSTEM](./07_UPLOAD_SYSTEM.md). Yang penting dari sisi komponen: `UploadFileItem` yang bertanggung jawab fetch blob dari IndexedDB untuk preview gambar (bukan `UploadDropzone` atau hook-nya) — jadi setiap baris file melakukan fetch-nya sendiri saat butuh ditampilkan.

## Hooks penting

| Hook | File | Fungsi |
|---|---|---|
| `useTheme` | `src/hooks/useTheme.ts` | Sinkronkan `preference.theme`/`darkMode` dari store ke atribut DOM (`data-theme`, class `.dark`). Dipanggil sekali di `AppShell`. |
| `useTaskFilters` | `src/hooks/useTaskFilters.ts` | Filter + search daftar task (dipakai di halaman Tasks) |
| `useFileUpload` | `src/hooks/useFileUpload.ts` | Semua logika upload: drag&drop handler, validasi, baca file, progress. Lihat [07_UPLOAD_SYSTEM](./07_UPLOAD_SYSTEM.md) |

## Primitif UI umum

`src/components/common/`: `Button`, `Card`, `Badge` (`PriorityBadge`/`StatusBadge`), `Form` (`Field`/`Input`/`Textarea`/`Select`). Dipakai di hampir semua halaman — tidak didokumentasikan per-prop di sini karena API-nya sudah jelas dari pemakaian (props standar HTML + `variant` untuk `Button`).

## Pola "pages are thin wrappers"

Sebagian besar `src/app/*/page.tsx` **bukan** tempat logika berada — mereka cuma bungkus `<AppShell>` + satu komponen fitur. Kalau mencari logika suatu halaman, cari di `src/components/`, bukan di `src/app/`. Pengecualian: `src/app/tasks/[id]/page.tsx` (halaman detail task) menaruh cukup banyak logika langsung di file page-nya (subtask CRUD, panggil AI, dll) karena spesifik untuk satu halaman itu saja.
