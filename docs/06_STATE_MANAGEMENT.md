# State Management

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

## Tiga lapis penyimpanan, satu aturan pembagian

Aplikasi ini pakai **tiga** mekanisme penyimpanan berbeda di sisi klien, masing-masing untuk jenis data yang cocok dengan karakteristiknya:

```
Zustand (in-memory, reaktif)
    │
    ├── persist middleware ──→ localStorage
    │       (semua state kecuali yang butuh binary besar)
    │
    └── (tidak menyimpan blob file — hanya metadata-nya)

IndexedDB (lewat lib/indexedDb.ts)
    │
    └── khusus untuk BLOB FILE yang diupload
        (gambar, PDF, spreadsheet — bisa besar, tidak cocok di localStorage)
```

## Zustand + localStorage — sumber kebenaran untuk hampir semua data

Satu store (`src/store/useAppStore.ts`), satu key localStorage (`smart-study-planner-store`). Menyimpan: user, tasks, categories, courses, schedules, preferences, widgets, achievements, chatMessages, **dan metadata file upload** (`uploadedFiles` — tapi bukan isi file-nya, lihat di bawah).

Kenapa localStorage cukup untuk ini: semuanya data JSON kecil-menengah (teks, angka, array pendek). `persist` middleware Zustand otomatis serialize state ke localStorage setiap ada perubahan.

**Update Sprint 1/3:** sejak field `documents` ditambahkan (mirror hasil Document Pipeline/OCR, lihat di bawah), `persist` **sudah** pakai `partialize` untuk mengecualikan `documents` secara eksplisit — field itu sengaja tidak pernah ikut ke localStorage. Field lain (`tasks`, `uploadedFiles`, dst.) tetap ter-persist penuh seperti sebelumnya.

Detail lengkap isi store: [12_STORES](./12_STORES.md).

## IndexedDB — blob file besar, dan sekarang juga Document Record

localStorage punya batas ukuran total (~5-10MB, tergantung browser) dan hanya bisa menyimpan string — tidak cocok untuk file gambar/PDF/spreadsheet yang bisa berukuran beberapa MB, atau teks hasil ekstraksi yang bisa cukup panjang. Karena itu, saat sistem upload dibangun (lihat [07_UPLOAD_SYSTEM](./07_UPLOAD_SYSTEM.md)), **isi file (blob)** disimpan terpisah di IndexedDB lewat wrapper `src/lib/indexedDb.ts`, sementara **metadata-nya saja** (nama file, ukuran, tipe, status, tanggal) yang masuk ke Zustand/localStorage.

**Sejak Sprint 1**, IndexedDB (`lib/indexedDb.ts`) punya object store kedua: `documents`, isinya `DocumentRecord` — hasil Document Pipeline (§`docs/SPRINT_1_ARCHITECTURE_FREEZE.md`), termasuk teks hasil OCR (Sprint 3). Prinsipnya sama seperti blob: data yang bisa besar/berubah-ubah tidak masuk localStorage. Bedanya, `DocumentRecord` **juga** punya mirror ringan di Zustand (`documents`, lihat di atas) untuk reaktivitas UI — tapi mirror itu murni cache in-memory, tidak pernah ikut dipersist; IndexedDB tetap satu-satunya sumber kebenaran, di-hydrate ulang ke Zustand setiap kali halaman upload dibuka.

**Sejak Milestone B (AI)**, `DB_VERSION` naik `2 → 3` — menambah 4 object store AI (`ai_summaries`, `ai_flashcards`, `ai_quizzes`, `ai_recommendations`, key = `documentId`) untuk hasil AI (ringkasan/flashcard/quiz/rekomendasi). Bump murni additive (store lama tidak disentuh). Prinsip yang sama berlaku: konten AI **hanya** hidup di IndexedDB, tidak pernah di localStorage maupun Supabase — satu-satunya pintu baca/tulis-nya adalah `services/ai/aiRepository.ts` (pola identik `documentRepository`). Store ini masih kosong sampai fitur AI benar-benar dipanggil (Milestone D–E). Lihat `AI_ARCHITECTURE_FREEZE.md` §8.3.

Kedua bagian ini dihubungkan lewat `id` yang sama:

```
useAppStore.uploadedFiles[]        IndexedDB "files" object store
┌─────────────────────────┐        ┌──────────────────────┐
│ id: "file_abc123"       │◄──────►│ key: "file_abc123"   │
│ filename: "materi.pdf"  │        │ value: Blob(2.3 MB)  │
│ status: "ready"         │        └──────────────────────┘
└─────────────────────────┘
     (localStorage)                     (IndexedDB)
```

Kenapa dipisah begini, bukan progress upload disimpan di Zustand juga: progress upload berubah sangat cepat (banyak event per detik saat membaca file besar) — kalau ikut masuk `persist` Zustand, itu berarti serialize+tulis seluruh state ke localStorage berkali-kali per detik, boros. Karena itu progress upload sengaja **hanya** state lokal di dalam hook `useFileUpload`, tidak pernah masuk store.

## Hubungan ketiganya, ringkas

| | Zustand (memory) | localStorage | IndexedDB |
|---|---|---|---|
| Dikelola lewat | Store langsung | Otomatis oleh `persist` middleware (kecuali `documents`, lihat `partialize`) | Manual lewat `lib/indexedDb.ts` |
| Isi | Semua state aplikasi (termasuk mirror `documents`) | Salinan serialize dari Zustand, minus `documents` | Blob file (`files`) + Document Record (`documents`) |
| Bertahan setelah refresh? | Tidak (di-re-hydrate dari localStorage untuk sebagian besar state, dari IndexedDB khusus untuk `documents`) | Ya | Ya |
| Dipakai untuk progress upload? | Tidak — cuma state lokal hook | Tidak | Tidak (blob ditulis setelah selesai dibaca) |

## Hydration — kenapa ada "Memeriksa sesi login..."

Zustand `persist` membaca localStorage secara **asynchronous** saat aplikasi pertama kali dimuat (butuh untuk menghindari mismatch server/client render di Next.js). Selama proses ini belum selesai (`persist.hasHydrated()` masih `false`), `AppShell` menampilkan layar loading — ini yang menjelaskan kenapa ada jeda singkat "Memeriksa sesi login..." di setiap pembukaan aplikasi.
