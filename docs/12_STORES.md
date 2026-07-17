# Stores

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Satu store, satu file: `src/store/useAppStore.ts` (Zustand + `persist` middleware → localStorage key `smart-study-planner-store`). Lihat [06_STATE_MANAGEMENT](./06_STATE_MANAGEMENT.md) untuk konteks kenapa arsitekturnya seperti ini.

**Sejak Sprint 1/3, tidak semua field di store ikut dipersist.** `persist()` sekarang punya opsi `partialize` yang mengecualikan `documents` — lihat baris `documents` di tabel bawah dan `docs/SPRINT_1_ARCHITECTURE_FREEZE.md` §7.

## Apa yang disimpan

| State | Tipe | Sumber awal |
|---|---|---|
| `isAuthenticated`, `token`, `user` | auth-related | Diisi dari Supabase Auth saat login (lihat [04_AUTHENTICATION](./04_AUTHENTICATION.md)) |
| `courses` | `Course[]` | Seed data — **catatan:** sudah tidak dipakai `TaskForm` untuk memilih task lagi, lihat [17_TECH_DEBT](./17_TECH_DEBT.md) |
| `categories` | `Category[]` | Seed data, bisa ditambah/diubah/dihapus pengguna |
| `tasks` | `Task[]` | Seed data, CRUD penuh oleh pengguna |
| `schedules` | `ClassSchedule[]` | Seed data (jadwal kuliah mingguan) |
| `studySessions` | `StudySession[]` | Kosong di awal; diisi smart schedule generator, **dan** oleh saran kalender AI (`addStudySession`, Milestone E — mengisi `sourceDocumentId`/`sourceSuggestionId`) |
| `preference` | `Preference` | Seed data (tema, bahasa, dll) |
| `widgets` | `WidgetPreference[]` | Seed data — **catatan:** dashboard belum benar-benar membaca ini, lihat [17_TECH_DEBT](./17_TECH_DEBT.md) |
| `achievements` | `Achievement[]` | Seed data, progress statis (belum ada logika unlock otomatis) |
| `chatMessages` | `ChatMessage[]` | Kosong di awal, riwayat chat AI Assistant |
| `uploadedFiles` | `UploadedFileMeta[]` | Kosong di awal — **metadata saja**, blob file di IndexedDB (lihat [07_UPLOAD_SYSTEM](./07_UPLOAD_SYSTEM.md)) |
| `documents` | `Record<string, DocumentRecord>` | Kosong di awal, **TIDAK dipersist** (dikecualikan lewat `partialize`) — mirror reaktif dari IndexedDB `documents` (Single Source of Truth), diisi ulang (`setDocument` per record) oleh `useFileUpload` saat mount (`documentRepository.findAll()`) dan tiap kali `documentService.processDocument()` selesai. Termasuk hasil ekstraksi OCR (`content.text`), `confidence`/`provider`/`processingTimeMs`. Lihat `docs/SPRINT_1_ARCHITECTURE_FREEZE.md` §7 dan §13. |

## Apa yang **tidak** disimpan di sini

- **Blob file yang diupload** — sengaja di IndexedDB, bukan di store (lihat [06_STATE_MANAGEMENT](./06_STATE_MANAGEMENT.md) untuk alasannya).
- **Progress upload per file** — state lokal di dalam hook `useFileUpload`, sengaja tidak masuk store supaya tidak memicu tulis-ulang localStorage berkali-kali per detik.
- **Data profil lengkap dari Supabase** (`university`/`major`/`semester` di tabel `profiles`) — `user` di store cuma menyimpan field yang masih dipakai UI (`id`, `name`, `email`, `isPremium`); field lain di tabel `profiles` ada tapi tidak diikutkan ke store karena form-nya sudah tidak mengumpulkan itu lagi.
- **Isi `DocumentRecord` di localStorage** — `documents` memang ada di state Zustand (lihat tabel di atas), tapi sengaja dikeluarkan dari apa yang ditulis `persist` ke localStorage lewat `partialize`. IndexedDB tetap satu-satunya sumber kebenaran untuk data ini.

## Pola action yang konsisten

Semua action collection (`tasks`, `categories`, `uploadedFiles`, dst.) mengikuti pola serupa: `addX`, `updateX`, `removeX`/`deleteX` — dengan dua ketidakrapian kecil yang perlu diketahui (kondisi aktual kode): penamaan hapus memang campur (`removeUploadedFile` vs `deleteTask`/`deleteCategory`), dan `updateTask`/`updateWidget`/`updateUploadedFile`/`updatePreference` menerima `Partial<X>` tapi `updateCategory` menerima objek `Category` penuh. Kalau menambah state collection baru, ikuti pola `addX`/`updateX(Partial)`/`removeX` untuk konsistensi ke depan. `documents` sedikit beda: `setDocument` melakukan upsert (bukan cuma add) karena satu id yang sama ditulis ulang berkali-kali seiring status pipeline berubah (`pending` → `processing` → `completed`/`failed`).

`studySessions` punya dua action: `setStudySessions` (ganti seluruh array, dipakai smart schedule generator) dan `addStudySession` (tambah satu, dipakai saat menerima saran kalender AI — Milestone E). Task dari saran AI dibuat lewat `addTask` biasa (yang otomatis menghitung `priorityScore`), dengan `sourceDocumentId`/`sourceSuggestionId` terisi.

**Aturan khusus untuk `tasks`:** jangan pernah set `priorityScore` manual — semua action task (`addTask`/`updateTask`/`completeTask`) otomatis lewat helper `score()` di dalam store yang menghitung ulang `priorityScore` (dari `utils/priorityScore.ts`) dan `updatedAt` setiap kali. Mengubah task lewat cara lain (misalnya manipulasi langsung) akan membuat `priorityScore` basi.

## `resetDemoData()` — perilaku yang perlu diketahui

Dipanggil dari tombol "Reset Data" di Settings. Mengembalikan `courses`/`categories`/`tasks`/`schedules`/`preference`/`widgets`/`achievements` ke seed data awal, mengosongkan `studySessions`/`chatMessages`/`uploadedFiles`/`documents`, **tapi mempertahankan** sesi auth yang sedang aktif (`user`/`isAuthenticated`/`token` tidak ikut direset). Catatan: mengosongkan `uploadedFiles`/`documents` di store **tidak** otomatis menghapus blob/`DocumentRecord`-nya di IndexedDB — ini gap kecil, dicatat di [17_TECH_DEBT](./17_TECH_DEBT.md), konsisten dengan gap yang sudah ada sebelumnya untuk `uploadedFiles`.
