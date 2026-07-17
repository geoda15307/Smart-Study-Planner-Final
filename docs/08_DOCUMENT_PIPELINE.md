# Document Pipeline

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

Dokumen ini menjelaskan alur lengkap "dari file diupload sampai jadi ringkasan belajar" — sebagian **sudah berjalan**, sebagian **baru desain**. Batasnya ditandai jelas di bawah.

## Pipeline saat ini vs yang direncanakan

```
Upload                     ✅ SELESAI — lihat 07_UPLOAD_SYSTEM.md
   ↓
Validation                 ✅ SELESAI — tipe file + ukuran, di lib/upload/config.ts
   ↓
Detect File (kategori)     ✅ SELESAI — 5 kategori: image/pdf/document/spreadsheet/presentation
   ↓
Processor (Strategy)       ✅ SELESAI — DocumentProcessor + Factory, lihat 11_SERVICES.md
   ↓
Extract Content            ✅ SELESAI untuk image (OCR.Space), pdf (pdf-parse), document (mammoth/word-extractor),
                               spreadsheet (xlsx), presentation/.pptx (parser kustom) — ❌ presentation/.ppt legacy
                               ditolak permanen, tidak ada library JS yang layak (lihat bagian "Local Parser" di bawah)
   ↓
Save Document              ✅ SELESAI — DocumentRecord (termasuk teks hasil ekstraksi) tersimpan di IndexedDB
                               `documents`, terpisah dari blob mentah di `files`
   ↓
AI Summary                 ❌ FUTURE DEVELOPMENT
   ↓
Task Recommendation        ❌ FUTURE DEVELOPMENT
   ↓
Calendar Recommendation    ❌ FUTURE DEVELOPMENT
   ↓
Flashcard (opsional)       ❌ FUTURE DEVELOPMENT
   ↓
Quiz (opsional)            ❌ FUTURE DEVELOPMENT
```

Detail lengkap arsitektur Processor/Factory/Repository/Migrasi: `docs/SPRINT_1_ARCHITECTURE_FREEZE.md` (kontrak Sprint 1) dan §13 dokumen yang sama untuk alur OCR end-to-end.

## Yang sudah berjalan hari ini

File yang diupload tersimpan lokal (IndexedDB `files` untuk blob + Zustand untuk metadata upload), dengan validasi tipe/ukuran dan deteksi kategori otomatis (5 kategori). Begitu upload sukses, pipeline **berjalan otomatis** (tanpa aksi user) untuk **semua** kategori: hasilnya (teks, metadata seperti jumlah halaman/sheet/slide) tersimpan sebagai `DocumentRecord` di IndexedDB `documents`. Satu-satunya kategori yang masih gagal by design adalah PowerPoint format lama (`.ppt`, bukan `.pptx`) — ditolak eksplisit karena tidak ada library JS yang layak untuk membaca format biner tersebut.

## Local Parser — PDF, Word, Spreadsheet, PPTX (Sprint 2)

Semua berjalan **server-side** di `lib/document/processors/*` (dipanggil lewat route `/api/document/process`, sama seperti OCR — lihat §13 freeze doc), meskipun tidak satu pun dari library ini butuh API key. Alasan tetap server-side: processor sudah dikelompokkan jadi satu modul server-only sejak `imageProcessor` butuh OCR (lihat Amandemen di freeze doc) — memisahkan sebagian processor ke client dan sebagian ke server akan memecah kesederhanaan satu Factory/satu jalur eksekusi, jadi seluruh grup tetap server-side meski beberapa di antaranya sebenarnya bisa jalan di client.

| Processor | Kategori | Library | Catatan |
|---|---|---|---|
| `pdfProcessor.ts` | `pdf` | `pdf-parse` (v2, wrapper `pdfjs-dist`) | PDF hasil scan (tanpa teks digital) menghasilkan `EMPTY_RESULT`, bukan OCR otomatis — PDF hasil scan tidak lewat jalur OCR sama sekali di Sprint ini |
| `documentFileProcessor.ts` | `document` | `.docx` → `mammoth`; `.doc` → `word-extractor` | `.doc` best-effort (library terakhir update 2022) — keputusan sadar, lihat [17_TECH_DEBT](./17_TECH_DEBT.md) |
| `spreadsheetProcessor.ts` | `spreadsheet` | `xlsx` (SheetJS) dari CDN resmi, bukan npm registry | Lihat [14_DEPENDENCIES](./14_DEPENDENCIES.md) untuk alasan (CVE tanpa fix di versi npm) |
| `presentationProcessor.ts` | `presentation` | Kustom: `jszip` (buka `.pptx` sebagai ZIP) + `fast-xml-parser` (baca `ppt/slides/slideN.xml`, ambil teks dari tag `<a:t>`) | Tidak pakai library "pptx-parser" pihak ketiga (versi beta, tidak terawat sejak 2022) — dibangun dari dua library umum yang aktif dipelihara. `.ppt` legacy ditolak permanen (`NOT_IMPLEMENTED`) |

**Konfigurasi Next.js yang dibutuhkan:** `pdf-parse` (lewat `pdfjs-dist`) gagal dievaluasi kalau di-bundle webpack lewat RSC (`TypeError: Object.defineProperty called on non-object`). `next.config.mjs` perlu `experimental.serverComponentsExternalPackages: ["pdf-parse", "@napi-rs/canvas"]` supaya Next.js men-treat paket ini sebagai `require()` eksternal, bukan di-bundle. Tanpa ini, **seluruh** route `/api/document/process` gagal (bukan cuma kategori PDF) karena `getDocumentProcessor.ts` mengimpor semua processor secara statis di satu factory.

## OCR — tersambung dan sudah diverifikasi dengan API key sungguhan

Interface (`src/lib/ocr/types.ts`, dipindah dari `services/ocr/` — lihat [11_SERVICES](./11_SERVICES.md) untuk alasannya):

```ts
interface OCRProvider {
  name: string;
  extractText(file: Blob, meta: UploadedFileMeta): Promise<OCRResult>;
}
```

`OCRSpaceProvider` (`src/lib/ocr/providers/ocrSpaceProvider.ts`) memanggil `https://api.ocr.space/parse/image` sungguhan, dipilih lewat `getOCRProvider()` (env var `OCR_PROVIDER`, default `"ocrspace"`). Provider OCR lain (Google Vision, Azure, Tesseract, dst.) bisa ditambahkan tanpa mengubah UI upload atau `documentService` — komponen upload tidak tahu dan tidak perlu tahu provider OCR apa yang dipakai di baliknya.

**Sudah tersambung** lewat `imageProcessor` (`src/lib/document/processors/imageProcessor.ts`) → route server `/api/document/process` → `documentService.ts` (client) → `DocumentRecord` di IndexedDB. Karena OCR butuh API key, pemanggilannya wajib lewat route server — `imageProcessor` sendiri karena itu dipindah ke `lib/document/` (server-only), bukan lagi `services/document/`. Alur lengkap, termasuk kenapa perlu route server: `docs/SPRINT_1_ARCHITECTURE_FREEZE.md` §13.

## AI Summary — desain APPROVED, provider siap (Milestone C)

Arsitektur AI (Summary → Flashcard → Quiz → Recommendation) sudah **APPROVED** dan dibekukan di `AI_ARCHITECTURE_FREEZE.md`. Method lama `summarizeDocument()`/`DocumentSummary` (yang sempat menerima `imageBlob` — melanggar aturan "AI hanya menerima teks", §1.1) sudah **dihapus** di Milestone C, digantikan empat method eksplisit per fitur di interface `AIProvider`:

```ts
summarize(spec, options?): Promise<AIGenerationResult>
generateFlashcards(spec, options?): Promise<AIGenerationResult>
generateQuiz(spec, options?): Promise<AIGenerationResult>
recommend(spec, options?): Promise<AIGenerationResult>
```

Status provider per Milestone C: **`mock` berfungsi penuh** (mengembalikan JSON valid sesuai schema §17.3, untuk pengujian tanpa biaya) dan **`gemini` sudah diimplementasikan sungguhan** (raw fetch ke REST API Generative Language, structured output). `openai`/`anthropic`/`openrouter` masih stub. Tapi **belum ada yang "live"**: tidak ada route yang memanggil `getAIProvider()` sampai Milestone D, dan tidak ada UI yang memicunya sampai Milestone E. Bentuk output final (`AISummary`/`AIFlashcardSet`/`AIQuizSet`/`AIRecommendation`) ada di `src/types/index.ts`. Detail abstraksi provider: [11_SERVICES](./11_SERVICES.md). Rekomendasi provider: [16_ROADMAP](./16_ROADMAP.md).

## Kenapa didesain sekarang meski belum dipakai

Supaya saat provider AI/OCR sungguhan siap diaktifkan nanti, pekerjaannya **hanya** mengisi implementasi di balik interface yang sudah ada — bukan merombak sistem upload atau menulis ulang kontrak antar modul. Ini yang dimaksud "arsitektur modular" di seluruh dokumen ini: setiap lapis (upload → OCR → AI Summary) bisa berubah/diganti tanpa lapis lain ikut berubah.
