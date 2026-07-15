# Dokumentasi Perubahan — Smart Study Planner Web

**Tanggal:** 15 Juli 2026
**Branch:** `feat/supabase-setup`
**Project:** [AbubakarRhafly/Smart-Study-Planner-WEB](https://github.com/AbubakarRhafly/Smart-Study-Planner-WEB)

Dokumen ini merangkum seluruh pekerjaan yang dilakukan hari ini: audit awal, refactor UI, perbaikan bug, penambahan fitur, penyederhanaan data model, dan setup koneksi Supabase.

---

## Daftar Isi

1. [Audit Awal Proyek](#1-audit-awal-proyek)
2. [Refactor Task Card](#2-refactor-task-card)
3. [Perbaikan Bug: Icon Kategori](#3-perbaikan-bug-icon-kategori)
4. [Perbaikan Bug: Sistem Tema](#4-perbaikan-bug-sistem-tema)
5. [Fitur CRUD Subtask Checklist](#5-fitur-crud-subtask-checklist)
6. [Progress Bar & Priority Score (Dikembalikan)](#6-progress-bar--priority-score-dikembalikan)
7. [Redesign Halaman Detail Task](#7-redesign-halaman-detail-task)
8. [Penyederhanaan Status Task](#8-penyederhanaan-status-task)
9. [Setup Koneksi Supabase](#9-setup-koneksi-supabase)
10. [Perbaikan Tambahan (Insidental)](#10-perbaikan-tambahan-insidental)
11. [Status Verifikasi](#11-status-verifikasi)
12. [Item yang Masih Tertunda / Diblokir](#12-item-yang-masih-tertunda--diblokir)
13. [Rencana Langkah Selanjutnya](#13-rencana-langkah-selanjutnya)

---

## 1. Audit Awal Proyek

Sebelum melakukan perubahan kode, dilakukan scan menyeluruh terhadap project untuk memahami arsitektur yang sebenarnya berjalan.

**Temuan utama:**

| Aspek | Temuan |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State management | Zustand + `persist` middleware (LocalStorage) |
| Database / ORM | **Tidak ada.** Tidak ada Prisma/Drizzle/Supabase sebelum hari ini. `.env.example` hanya berisi placeholder untuk target produksi di masa depan |
| Storage | Tidak ada (hanya export CSV/JSON client-side) |
| AI | Sepenuhnya mock berbasis rule (keyword matching), bukan LLM sungguhan |
| API routes | Hanya `/api/ai/analyze` dan `/api/ai/chat` (keduanya mock) |
| Testing | Tidak ada test runner dikonfigurasi |
| ESLint | **Tidak ada file konfigurasi** — `npm run lint` sebenarnya tidak bisa jalan sebelum hari ini |

**Bug yang teridentifikasi sejak audit (baru diperbaiki di sesi ini):**
- Icon kategori tidak pernah di-render di manapun (task card & detail task tidak resolve `categoryId` → `Category`).
- Sistem tema (`preference.theme` / `darkMode`) tersimpan dengan benar di store, tapi **tidak pernah diterapkan ke DOM** — memilih tema tidak mengubah tampilan sama sekali.

---

## 2. Refactor Task Card

**Tujuan:** Membersihkan tampilan Task Card di menu Tasks agar lebih ringkas.

**File:** [`src/components/tasks/TaskCard.tsx`](src/components/tasks/TaskCard.tsx)

**Perubahan:** Menghapus dari tampilan utama card:
- Score (priority score)
- Mata Kuliah (`courseName`)
- Checklist Subtask (progress bar)

*(Difficulty, Estimasi Durasi, dan Catatan Tambahan sebenarnya sudah tidak pernah ditampilkan di card sejak awal — jadi tidak perlu dihapus.)*

> ⚠️ Catatan: Score dan progress bar subtask **dikembalikan lagi** di langkah selanjutnya atas permintaan — lihat [Bagian 6](#6-progress-bar--priority-score-dikembalikan).

---

## 3. Perbaikan Bug: Icon Kategori

**Root cause:** `task.categoryId` tidak pernah di-resolve menjadi objek `Category` di komponen manapun (`TaskCard`, halaman detail task). Selain itu, `deleteCategory` di store **tidak punya guard referential integrity** — menghapus kategori yang masih dipakai task akan meninggalkan `categoryId` yang menggantung (orphaned), tanpa fallback visual apa pun.

**File yang diubah:**

- **`src/components/category/CategoryIcon.tsx`** *(baru)* — komponen kecil yang menerima `Category | undefined` dan selalu punya fallback icon (`❔`) + warna (`#94a3b8`) jika kategori tidak ditemukan (mis. sudah dihapus).
- **`src/components/tasks/TaskCard.tsx`** — resolve `category` dari store lalu render `<CategoryIcon />` di pojok kanan atas card.
- **`src/app/tasks/[id]/page.tsx`** — resolve & render `CategoryIcon` di header halaman detail task.
- **`src/store/useAppStore.ts`** — `deleteCategory` sekarang me-reassign semua task yang mereferensikan kategori yang dihapus ke kategori fallback (`"lainnya"` jika ada, atau kategori pertama yang tersisa), bukan meninggalkan referensi rusak.

**Sebelum (store):**
```ts
deleteCategory: (categoryId) => set((state) => ({
  categories: state.categories.filter((category) => category.id !== categoryId)
})),
```

**Sesudah:**
```ts
deleteCategory: (categoryId) => set((state) => {
  const categories = state.categories.filter((category) => category.id !== categoryId);
  const fallback = categories.find((category) => category.id === "lainnya") ?? categories[0];
  return {
    categories,
    tasks: fallback
      ? state.tasks.map((task) => task.categoryId === categoryId ? { ...task, categoryId: fallback.id } : task)
      : state.tasks
  };
}),
```

**Verifikasi:** diuji langsung di browser — icon kategori (emoji berbeda per kategori: 📝, 🧠, 🤝, dst.) muncul dengan benar di setiap task card dan halaman detail.

---

## 4. Perbaikan Bug: Sistem Tema

**Root cause:** `preference.theme` (4 tema warna) dan `preference.darkMode` tersimpan dan ter-*persist* dengan benar di Zustand — tapi **tidak ada satupun komponen yang membaca nilai ini untuk mengubah DOM**. `tailwind.config.ts` bahkan belum mendeklarasikan strategi `darkMode`. Toggle dark mode juga belum ada UI-nya sama sekali di Settings.

**File yang diubah:**

- **`tailwind.config.ts`** — `darkMode: "class"`, warna `soft`, `surface`, `slate.*`, dan `primary.*` diubah menjadi berbasis CSS variable (`rgb(var(--x) / <alpha-value>)`) alih-alih hex statis.
- **`src/app/globals.css`** — mendefinisikan CSS variable untuk light mode default, 3 varian `[data-theme="..."]` tambahan (Ungu Modern, Hijau Produktif, Orange Energetic), dan override `.dark { ... }` untuk neutral colors.
- **`src/hooks/useTheme.ts`** *(baru)* — hook yang menyinkronkan `preference.theme` → `data-theme` attribute dan `preference.darkMode` → class `.dark` pada `<html>`, secara real-time via `useEffect`.
- **`src/components/layout/AppShell.tsx`** — memanggil `useTheme()` di titik gerbang otentikasi yang dilewati semua halaman terproteksi.
- **`src/components/feature/FeaturePage.tsx`** — menambahkan toggle "Mode gelap" yang sebelumnya tidak ada di halaman Settings.

**Kenapa pendekatan ini (bukan cuma nambah `dark:` class di semua file)?** Dengan membuat warna Tailwind itu sendiri (`white`, `slate-*`, `primary-*`) berbasis CSS variable, seluruh aplikasi otomatis ikut berubah tema tanpa perlu mengedit setiap file — karena semua komponen sudah memakai class Tailwind standar (`bg-white`, `text-slate-900`, dst.) yang sekarang me-resolve ke variable yang berbeda tergantung tema/mode aktif.

**Efek samping yang perlu diubah:** karena `white` sekarang jadi warna "surface" yang ikut berubah di dark mode, semua pemakaian `bg-white`/`from-white` untuk **background** (bukan `text-white`, yang sengaja dibiarkan tetap putih literal untuk teks di atas tombol berwarna) di-rename ke `bg-surface`/`from-surface` di 10 file:
`AppShell.tsx`, `Card.tsx`, `Form.tsx`, `FeaturePage.tsx`, `CalendarView.tsx`, `ChatWindow.tsx`, `TaskForm.tsx`, `tasks/page.tsx`, `onboarding/page.tsx`, `dashboard/page.tsx`.

**Bug kontras yang ditemukan & langsung diperbaiki:** dua label toggle ("Mode gelap", "Aktifkan AI recommendation") memakai `text-slate-800` yang **tidak** ikut sistem variable (supaya tombol "Buka AI" yang sengaja selalu gelap tidak ikut berubah) — akibatnya teks nyaris tak terbaca di dark mode. Diperbaiki dengan mengganti ke `text-slate-900` (yang sudah theme-aware) di `FeaturePage.tsx`, `onboarding/page.tsx`, dan `TaskForm.tsx`.

**Verifikasi:** diuji langsung di browser — ganti tema (Biru → Hijau) langsung berubah real-time di seluruh aplikasi, bertahan setelah full page refresh, dark mode toggle juga real-time + persistent, dan kontras teks sudah benar di kedua mode.

---

## 5. Fitur CRUD Subtask Checklist

**Tujuan:** Subtask checklist di form Tambah Tugas sebelumnya hanya bisa ditambah (tidak bisa dihapus/diedit), dan tidak ada cara mencentang progres.

**File yang diubah:**

- **`src/components/tasks/TaskForm.tsx`** — checklist subtask sekarang punya: checkbox (tandai selesai), input judul yang bisa diedit langsung (inline), dan tombol "Hapus" per baris. Ditambahkan helper `updateSubtask()` dan `removeSubtask()`.
- **`src/app/tasks/[id]/page.tsx`** — pola yang sama diterapkan di halaman Detail Task, tersambung ke `updateTask()` sehingga perubahan (centang/edit/hapus) langsung tersimpan ke store & LocalStorage.

**Verifikasi:** diuji end-to-end di browser — tambah 2 subtask, edit judul salah satu secara inline, centang salah satu (progress ter-update), hapus salah satu. Diverifikasi juga langsung lewat `localStorage` (bukan cuma visual) untuk memastikan setiap aksi benar-benar tersimpan ke state.

---

## 6. Progress Bar & Priority Score (Dikembalikan)

Setelah field-field ini dihapus di [Bagian 2](#2-refactor-task-card), diminta untuk dikembalikan sebagian:

**File:** `src/components/tasks/TaskCard.tsx`

- **Progress bar subtask** dikembalikan dengan formula: `(jumlah subtask selesai / total subtask) × 100%`. Berlaku sama baik untuk 1 subtask (hasil 0% atau 100%) maupun banyak subtask.
- **Priority Score** dikembalikan sebagai angka kecil di pojok kanan atas card, di samping icon kategori (bukan menggantikan tata letak lama, karena layout sudah berubah setelah perbaikan icon kategori).

---

## 7. Redesign Halaman Detail Task

**Tujuan:** Merapikan hierarki visual di halaman Detail Task agar fokus ke informasi yang paling penting, tanpa mengubah fungsi Analisis AI.

**File:** `src/app/tasks/[id]/page.tsx`

**Perubahan desain:**
- Header card sekarang punya **accent border kiri** berwarna sesuai priority (sama seperti di Task Card list), untuk konsistensi visual.
- **Priority Score** ditampilkan sebagai blok besar berwarna sesuai tingkat risiko (`riskLevel()` dari `priorityScore.ts`): hijau (risiko rendah), kuning/amber (sedang), merah (tinggi) — bukan lagi kotak abu-abu polos.
- **Deskripsi Tugas** dan **Catatan Tambahan** dipisah ke card sendiri dengan label eyebrow yang jelas.
- **Subtask** menampilkan progress bar (sama seperti di Task Card) di atas checklist, plus badge "X/Y selesai (Z%)".
- **Analisis AI** — bagian ini **sengaja tidak diubah secara fungsional** sesuai instruksi ("disimpan dahulu"). Hanya ditambahkan label 🤖 kecil untuk konsistensi visual, logic dan tampilan hasil analisis tetap sama persis.

**Verifikasi:** diuji di browser — tombol "Analisis AI" dipastikan masih menghasilkan output yang sama seperti sebelumnya (dicek lewat isi teks halaman, bukan cuma screenshot).

---

## 8. Penyederhanaan Status Task

**Tujuan:** Status "Menunggu Review" dan "Sedang Dikerjakan" dihapus dan diganti dengan "Belum Mulai".

`TaskStatus` yang semula:
```ts
"Belum Mulai" | "Sedang Dikerjakan" | "Menunggu Review" | "Selesai" | "Terlambat"
```
menjadi:
```ts
"Belum Mulai" | "Selesai" | "Terlambat"
```

**File yang diubah (semua occurrence dicek lewat grep, tidak ada yang tertinggal):**

| File | Perubahan |
|---|---|
| `src/types/index.ts` | Union type `TaskStatus` dipangkas jadi 3 nilai |
| `src/utils/priorityScore.ts` | `statusMap` (bobot skor per status) dipangkas jadi 3 entry |
| `src/components/common/Badge.tsx` | `statusClass` (warna badge per status) dipangkas jadi 3 entry |
| `src/lib/data.ts` | 2 task dummy yang sebelumnya berstatus "Sedang Dikerjakan"/"Menunggu Review" diubah ke "Belum Mulai" |
| `src/app/tasks/page.tsx` | Dropdown filter status di Task Manager dipangkas jadi 3 opsi + "Semua" |
| `src/components/progress/ProgressCharts.tsx` | Pie chart status di halaman Progress dipangkas jadi 3 kategori + warna disesuaikan |
| `CLAUDE.md` | Dokumentasi literal status diperbarui supaya tidak basi |

**Catatan penting saat verifikasi:** data demo yang sudah ter-*cache* di LocalStorage browser (dari sesi testing sebelumnya) masih menyimpan status lama karena LocalStorage tidak otomatis migrasi saat seed data berubah — ini sesuai perilaku yang memang didokumentasikan di `CLAUDE.md` (`resetDemoData()` / clear LocalStorage adalah cara resetnya), bukan bug baru. Sudah di-reset saat verifikasi dan dipastikan data baru menampilkan status yang benar.

---

## 9. Setup Koneksi Supabase

**Tujuan:** Menghubungkan project Next.js ini ke Supabase dari nol.

### 9.1 Pengecekan akun Supabase yang ada
Dicek lebih dulu apakah repo ini (`AbubakarRhafly/Smart-Study-Planner-WEB`) sudah punya project Supabase sebelumnya — tidak ditemukan `.env.local`, folder `supabase/`, maupun GitHub Actions yang mengarah ke project manapun secara lokal. Akun Supabase yang terhubung ke sesi ini ("Yuyud727's Org") hanya berisi 3 project lama yang tidak berkaitan (`Yuyud727's Project`, `rejeki-lestari-db`, `PEMSIK - Yudhistira`). Sesuai arahan, dibuat project baru.

### 9.2 Project baru
- **Nama:** `smart-study-planner-web`
- **Region:** `ap-southeast-1` (Singapura — konsisten dengan project lain di akun yang sama, dan dekat dengan target pengguna Indonesia)
- **Biaya:** dicek lebih dulu via `get_cost` — **$0/bulan** (free tier), dikonfirmasi sebelum project benar-benar dibuat.
- **Project ref:** `wktyqplwjfikdmgzufna`

### 9.3 Package yang diinstall
```bash
npm install @supabase/supabase-js @supabase/ssr
```
(dicek dulu lewat dokumentasi resmi Supabase — bukan hanya dari memori — untuk memastikan pattern & nama environment variable yang dipakai masih yang terbaru, yaitu `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, bukan nama lama `NEXT_PUBLIC_SUPABASE_ANON_KEY`.)

### 9.4 Environment variables
- **`.env.local`** *(baru, tidak di-commit ke git)* — berisi kredensial asli: `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **`.env.example`** *(template, di-commit)* — ditambahkan placeholder kosong untuk 2 variable di atas. Sekaligus **menghapus** `DATABASE_URL` dan `JWT_SECRET` yang lama — dicek lewat grep dan dipastikan dua variable ini memang tidak pernah dibaca di kode manapun (peninggalan rencana lama sebelum Supabase dipakai).

### 9.5 File koneksi Supabase (pola resmi `@supabase/ssr`)
- **`src/lib/supabase/client.ts`** *(baru)* — untuk dipakai di Client Component, via `createBrowserClient`.
- **`src/lib/supabase/server.ts`** *(baru)* — untuk dipakai di Server Component / Route Handler, via `createServerClient` + cookies dari `next/headers`.

*(`middleware.ts` untuk refresh session **belum** dibuat karena Supabase Auth belum dipakai — aplikasi masih pakai `authService.ts` mock. Akan ditambahkan saat migrasi auth beneran dilakukan.)*

### 9.6 Verifikasi koneksi (bukan cuma "file sudah ada")
Dijalankan test koneksi nyata (script sementara, dihapus setelah selesai) yang melakukan query ke tabel fiktif `__connection_probe__`. Hasilnya:
```
PGRST205: Could not find the table 'public.__connection_probe__' in the schema cache
```
Response ini justru **membuktikan koneksi berhasil** — artinya request berhasil terautentikasi dan mencapai database Postgres asli lewat PostgREST, dan secara benar melaporkan tabel itu memang belum ada (karena schema `public` project baru ini memang masih kosong, dikonfirmasi juga lewat `list_tables`).

### 9.7 Catatan penting
Dev server yang sudah berjalan sebelum `.env.local` dibuat **tidak otomatis membaca** environment variable baru — perlu di-restart (`npm run dev`) agar `NEXT_PUBLIC_SUPABASE_*` terbaca.

---

## 10. Perbaikan Tambahan (Insidental)

Ditemukan & diperbaiki sambil jalan, di luar daftar permintaan eksplisit tapi diperlukan supaya proyek benar-benar bisa diverifikasi:

- **`.eslintrc.json`** *(baru)* — sebelum hari ini, project **tidak punya file konfigurasi ESLint sama sekali**, sehingga `npm run lint` tidak bisa jalan meskipun ada di `package.json`. Ditambahkan `{ "extends": "next/core-web-vitals" }`.
- **Bug TypeScript lama** di `src/app/tasks/[id]/page.tsx` (`task` dianggap bisa `undefined` di dalam closure `runAI()` walau sudah ada guard di atasnya) — dikonfirmasi lewat `git stash` bahwa ini sudah ada **sebelum** sesi ini dimulai, bukan regresi baru. Diperbaiki dengan menambahkan binding `currentTask` yang sudah ter-*narrow* oleh TypeScript.

---

## 11. Status Verifikasi

Setiap tahap perubahan di atas diverifikasi dengan:

```bash
npx tsc --noEmit -p tsconfig.json   # 0 error
npx next lint                        # 0 warning, 0 error
```

Ditambah verifikasi visual langsung di browser (bukan cuma baca kode) untuk: tampilan Task Card, icon kategori, ganti tema real-time + tahan refresh, dark mode, CRUD subtask (dicek juga lewat `localStorage`), redesign halaman detail, filter status, dan koneksi Supabase (via network request nyata).

---

## 12. Item yang Masih Tertunda / Diblokir

| Item | Status | Alasan |
|---|---|---|
| Upgrade AI (Calendar Assistant & AI Assistant jadi LLM sungguhan) | **Diblokir** | Menunggu keputusan provider (Anthropic / OpenAI) dan API key |
| Fitur Upload Dokumen (PNG/JPG/JPEG/PDF) | Belum dikerjakan | Rencana pakai Supabase Storage, menyusul setelah schema selesai |
| OCR | **Diblokir** | Rencana pakai vision-capable LLM, ikut menunggu keputusan provider AI |
| AI Summary dari hasil OCR | **Diblokir** | Sama, tergantung provider AI |
| Evaluasi Widget (keep/simplify/remove) | Belum dikerjakan | Menunggu giliran sesuai prioritas |
| Schema database Supabase (tabel, migration, update API/type/validation) | Belum dikerjakan | Koneksi sudah siap (Bagian 9), tapi tabel di `public` schema masih kosong — ini pekerjaan besar berikutnya |

---

## 13. Rencana Langkah Selanjutnya

1. **Desain schema database Supabase** — review ulang seluruh field yang dipakai (termasuk mengecek field yang mungkin sudah tidak relevan), buat migration, lalu pelan-pelan pindahkan data layer dari Zustand-only ke Supabase.
2. Setelah schema siap → fitur **Upload Dokumen** (Supabase Storage) bisa dibangun.
3. Setelah provider AI diputuskan → **OCR** dan **AI Summary** bisa dibangun, plus upgrade AI Assistant & Calendar Assistant jadi LLM sungguhan.
4. **Evaluasi Widget** — laporan rekomendasi keep/simplify/remove sebelum ada perubahan kode di bagian ini.
