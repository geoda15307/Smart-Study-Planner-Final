# Upload System

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Status: **✅ Selesai dan berjalan.** Ini adalah langkah pertama dari [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md) — sejak Sprint 2/3, pipeline lanjutannya (deteksi kategori → processor → ekstraksi teks) juga sudah berjalan otomatis setelah upload untuk 5 dari 5 kategori (4 di antaranya penuh, 1 — PPT legacy — sengaja ditolak, lihat di bawah). AI Summary/Flashcard/Quiz/Recommendation masih belum dibuat.

## Kebijakan penyimpanan

**Bukan Supabase Storage.** Sesuai batasan di [04_AUTHENTICATION](./04_AUTHENTICATION.md) (Supabase hanya untuk auth), file yang diupload disimpan **sepenuhnya lokal**:

- **Isi file (blob)** → IndexedDB, lewat `src/lib/indexedDb.ts`
- **Metadata file** (nama, ukuran, tipe, status) → Zustand/localStorage, lewat `useAppStore().uploadedFiles`

Detail hubungan keduanya: [06_STATE_MANAGEMENT](./06_STATE_MANAGEMENT.md).

## Tipe file yang didukung

`DocumentCategory` (5 nilai, lihat [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md)) — diperluas dari 3 kategori awal saat local parser Sprint 2 dibangun:

| Kategori | Ekstensi | MIME type | Ekstraksi teks |
|---|---|---|---|
| `image` | `.png`, `.jpg`, `.jpeg` | `image/png`, `image/jpeg` | ✅ via OCR.Space (kategori `image` saja) |
| `pdf` | `.pdf` | `application/pdf` | ✅ via `pdf-parse` (PDF digital; hasil scan tanpa teks akan `EMPTY_RESULT`) |
| `document` | `.doc`, `.docx` | `application/msword`, `.wordprocessingml.document` | ✅ `.docx` via `mammoth`, `.doc` via `word-extractor` (best-effort, lihat [17_TECH_DEBT](./17_TECH_DEBT.md)) |
| `spreadsheet` | `.xlsx`, `.xls`, `.csv` | Office/Excel MIME types, `text/csv` | ✅ via `xlsx` (SheetJS) |
| `presentation` | `.ppt`, `.pptx` | `application/vnd.ms-powerpoint`, `.presentationml.presentation` | ✅ `.pptx` via parser kustom (`jszip`+`fast-xml-parser`) — `.ppt` **ditolak** (`NOT_IMPLEMENTED`), tidak ada library JS yang layak untuk format biner ini |

Dikonfigurasi di `src/lib/upload/config.ts` — **satu tempat** untuk mengubah tipe yang diizinkan atau ukuran maksimal (default 10MB), sesuai permintaan agar mudah diubah tanpa menyentuh banyak file. Kategori `UploadCategory` yang dulu terpisah (3 nilai) sudah disatukan penuh ke `DocumentCategory` (5 nilai) — lihat migrasi di `useAppStore.ts` dan `docs/SPRINT_1_ARCHITECTURE_FREEZE.md` §8.

## Alur upload

```
Pengguna drag file / klik dropzone
        ↓
useFileUpload hook: validateFile() dari lib/upload/config.ts
        ↓
   Valid? ──No──→ tampilkan status "error" + alasan di UI (file tetap muncul di list)
        │
       Yes
        ↓
Tambahkan ke store dengan status "uploading"
        ↓
FileReader baca file (onprogress → update progress LOKAL, bukan ke store)
        ↓
storageService.saveFileToStorage() → lib/indexedDb.ts → tulis blob ke IndexedDB
        ↓
Update store: status "ready"
        ↓
UploadFileItem fetch ulang blob dari IndexedDB → buat object URL → tampilkan preview (khusus gambar)
```

## Fitur yang sudah ada (checklist)

- ✅ Drag & drop
- ✅ Click to upload (input file tersembunyi)
- ✅ Multiple file sekaligus
- ✅ Progress upload — **progress nyata** dari `FileReader.onprogress`, bukan animasi buatan
- ✅ Preview gambar — fetch blob dari IndexedDB, buat `URL.createObjectURL`
- ✅ Validasi file (tipe + ukuran), pesan error jelas per file
- ✅ Ukuran maksimal mudah diubah (satu konstanta di `lib/upload/config.ts`)
- ✅ Hapus file — membersihkan metadata di store, blob di IndexedDB, **dan** `DocumentRecord` terkait (`documentRepository.delete`) — tidak meninggalkan sampah di store manapun

## Komponen & file terkait

| File | Peran |
|---|---|
| `src/lib/indexedDb.ts` | Wrapper generik IndexedDB (put/get/delete/list blob) |
| `src/lib/upload/config.ts` | Konfigurasi ukuran maksimal + tipe file yang diizinkan, fungsi `validateFile`/`detectUploadCategory` |
| `src/services/storage/storageService.ts` | `saveFileToStorage`/`getFileFromStorage`/`deleteFileFromStorage`/`listStoredFileIds` |
| `src/store/useAppStore.ts` | State `uploadedFiles` + action terkait |
| `src/hooks/useFileUpload.ts` | Logika drag&drop, validasi, baca file, progress |
| `src/components/upload/UploadDropzone.tsx` | Area drag&drop + input file |
| `src/components/upload/UploadFileList.tsx` | Daftar file |
| `src/components/upload/UploadFileItem.tsx` | Satu baris file: preview, progress bar, status, tombol hapus |
| `src/app/upload/page.tsx` | Halaman "Dokumen" (nav sidebar) |

## Yang BELUM ada (sengaja)

Sejak Sprint 2/3, sistem **tidak lagi** berhenti setelah file tersimpan — ekstraksi teks berjalan otomatis untuk semua kategori (lihat tabel di atas). Yang **masih** belum ada: ringkasan AI, flashcard, quiz, task/calendar recommendation — didesain (bukan diimplementasikan) di [08_DOCUMENT_PIPELINE](./08_DOCUMENT_PIPELINE.md).
