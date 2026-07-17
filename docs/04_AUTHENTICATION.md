# Authentication

[← Kembali ke Master Index](./ALL_DOCUMENTATION.md)

## Batasan tanggung jawab: paling penting untuk dipahami

> **Supabase di project ini HANYA digunakan untuk:**
> - Register
> - Login
> - Logout
> - Session management
> - Profil dasar pengguna (`profiles`: nama, email, university, major, semester, status premium)
>
> **Supabase TIDAK digunakan untuk menyimpan data aplikasi apapun** — task, kategori, jadwal, preferensi, achievement, riwayat chat AI, file yang diupload, hasil OCR, ringkasan AI, semuanya tetap lokal. Lihat [05_DATABASE](./05_DATABASE.md) untuk daftar lengkap tabel yang ada tapi **tidak** dipakai untuk ini, dan [16_ROADMAP](./16_ROADMAP.md) untuk kronologi keputusan ini.

Ini bukan detail implementasi — ini adalah **kontrak arsitektur** yang harus dipatuhi setiap kali menambah fitur baru. Kalau tergoda menyimpan sesuatu ke Supabase di luar auth/profil, itu tandanya salah arah.

> **Satu pengecualian sempit & terdokumentasi (sejak Milestone B, 17 Juli 2026):** tabel `ai_usage_log` di Supabase menyimpan **counter rate-limit AI** per user per hari (`user_id`, `usage_date`, `request_count`) — lihat [05_DATABASE](./05_DATABASE.md) dan `AI_ARCHITECTURE_FREEZE.md` §7.4. Ini **bukan pembatalan** kontrak di atas: yang disimpan murni ANGKA penghitung yang terikat langsung ke identitas auth (yang memang tanggung jawab Supabase di project ini), bukan konten aplikasi. Seluruh **konten** AI (ringkasan, flashcard, quiz, rekomendasi) tetap 100% di IndexedDB — tidak pernah masuk Supabase. Rate-limiting yang benar butuh state server yang bertahan lintas cold start/instance serverless, yang tidak bisa dilakukan IndexedDB (tidak ada di server). Tabelnya dibuat di Milestone B dan **sejak Milestone D sudah aktif dipanggil** — `guardAIRoute()` membaca+menaikkan counter di keempat route `/api/ai/{summary,flashcard,quiz,recommendation}` (lihat [09_API](./09_API.md), [15_SECURITY](./15_SECURITY.md)).

## Sebelumnya: mock, sekarang: sungguhan

Sebelum ini, "login" cuma menyimpan token palsu (`mock-jwt-${Date.now()}`) ke localStorage, tanpa validasi sungguhan — email apapun diterima. Ini sudah diganti total dengan Supabase Auth sungguhan. Konsekuensi nyata yang perlu diketahui:

- **Domain email divalidasi sungguhan.** Domain palsu (`@student.com`, `@example.com`) ditolak Supabase karena tidak punya mail server yang valid.
- **Ada quota pengiriman email** untuk konfirmasi akun (layanan email bawaan Supabase, sangat terbatas). Saat ini `Confirm email` dimatikan (lihat `.env.local`/dashboard Supabase) supaya akun langsung aktif tanpa perlu klik link — cocok untuk tahap dev, harus dipertimbangkan ulang sebelum production sungguhan.

## Alur register

```
Form register (nama, email, password saja — TIDAK ada university/major/semester lagi)
        ↓
services/auth/authService.ts → register()
        ↓
supabase.auth.signUp() via lib/supabase/client.ts
        ↓
Trigger DB "handle_new_user" otomatis isi tabel profiles
        ↓
Sengaja TIDAK auto-login — redirect ke halaman Login
   (kalau confirm-email menyala, tampilkan layar "cek email kamu" dulu)
```

Field `university`/`major`/`semester` sempat dihapus dari form oleh perubahan collaborator (form disederhanakan), tapi kolomnya **masih ada** di tabel `profiles` (nullable, sekarang tidak terisi) — lihat catatan dead-code di [17_TECH_DEBT](./17_TECH_DEBT.md).

## Alur login

```
Form login (email, password) — atau tombol "Masuk sebagai Demo"
        ↓
authService.login() → supabase.auth.signInWithPassword()
        ↓
Sukses → fetch baris profiles milik user itu
        ↓
useAppStore.authenticate(user, token) — user dari gabungan data Supabase Auth + profiles
```

## Proteksi route: di komponen, bukan middleware

`AppShell.tsx` adalah gerbangnya, bukan `middleware.ts`. Alurnya:

1. Tunggu Zustand selesai hydrate dari localStorage (`persist.hasHydrated()`).
2. Cek `isAuthenticated` dari store.
3. Kalau belum, `router.replace("/auth/login")`.

**Implikasi:** halaman baru yang butuh login **wajib** dirender di dalam `<AppShell>`, atau proteksinya tidak berlaku sama sekali. `middleware.ts` (root) + `src/lib/supabase/middleware.ts` cuma menjaga cookie session Supabase tetap segar di tiap request server — dia tidak melakukan redirect apapun.

Sebagai jaring pengaman tambahan, `AppShell` juga mendengarkan `supabase.auth.onAuthStateChange`: kalau session Supabase berakhir/dicabut dari tempat lain (tab lain, token refresh gagal), status `isAuthenticated` di Zustand ikut disetel `false`, supaya UI tidak "macet" menampilkan sesi yang sebenarnya sudah mati.

## Dua lapis penyimpanan sesi (jangan bingung)

| Key | Isi | Dikelola oleh |
|---|---|---|
| `smart-study-planner-store` (localStorage) | Seluruh state Zustand, termasuk `isAuthenticated`/`user` | Zustand `persist` |
| `sb-<project-ref>-auth-token` (localStorage) | Session Supabase asli (access/refresh token) | Klien `@supabase/ssr`, otomatis |

Kalau ada masalah auth yang aneh (login "berhasil" tapi fitur lain gagal, dsb.), cek **kedua** key ini — bisa saja salah satu basi sementara yang lain tidak.

## File terkait

| File | Peran |
|---|---|
| `src/services/auth/authService.ts` | `login`/`register`/`logout` — satu-satunya tempat kode aplikasi bicara ke Supabase Auth |
| `src/lib/supabase/client.ts` | Klien Supabase untuk Client Component |
| `src/lib/supabase/server.ts` | Klien Supabase untuk Server Component/Route Handler |
| `src/lib/supabase/middleware.ts` + `middleware.ts` (root) | Refresh cookie session |
| `src/components/layout/AppShell.tsx` | Gerbang proteksi route + listener auth state |
| `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx` | UI |

Untuk skema tabel `profiles` dan kenapa 10 tabel lain ada tapi tidak dipakai, lihat [05_DATABASE](./05_DATABASE.md). Untuk risiko keamanan terkait auth, lihat [15_SECURITY](./15_SECURITY.md).
