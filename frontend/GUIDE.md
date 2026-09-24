# Frontend Technical Guide

## 1. Scope and Decisions

Frontend adalah React SPA untuk tiga role: `STUDENT`, `TEACHER`, dan `ADMIN`. Frontend hanya mengatur tampilan, navigasi, validasi input dasar, pemindaian kamera, dan komunikasi REST API. Frontend tidak boleh menjadi sumber kebenaran untuk status absensi, waktu server, authorization, atau scope laporan.

Keputusan produk yang harus dihormati:

- QR Code bersifat statis per sesi; tidak membuat rotasi atau dynamic QR.
- Window scan dibuka 15 menit sebelum `start_at` dan berakhir pada `end_at`.
- Keputusan `HADIR`, `TERLAMBAT`, dan `TIDAK_HADIR` berasal dari backend.
- Username/NIM tidak dapat diedit melalui profil.
- Tidak ada notifikasi push, email, SMS, atau WhatsApp dalam MVP.

## 2. Tech Stack and Libraries

Gunakan JavaScript dengan ESLint yang sudah tersedia. Semua dependency dipasang di `frontend/package.json` dan versinya dikunci melalui lockfile.

| Area                 | Pilihan                                           | Fungsi dan aturan                                                                                                                          |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Build                | Vite + `@vitejs/plugin-react`                     | Dev server, build production, dan HMR. Pertahankan konfigurasi yang sudah ada.                                                             |
| UI                   | React 19 + React DOM                              | Komponen UI dan rendering SPA.                                                                                                             |
| Styling              | Tailwind CSS 4                                    | Utility styling dan design tokens. Hindari inline style kecuali nilai benar-benar dinamis.                                                 |
| Component primitives | `@headlessui/react`                               | Dialog, menu, listbox, dan komponen aksesibel tanpa memaksakan visual design.                                                              |
| Icons                | `@mui/icons-material`                             | Ikon aksi/status. Menggantikan `lucide-react` sesuai keputusan D1 (parity glyph dengan golden master `frontend_new/`). Sertakan label/tooltip yang jelas untuk ikon tanpa teks. |
| Routing              | `react-router-dom`                                | Route publik, route terautentikasi, role guard, nested layout, dan redirect pasca-login.                                                   |
| Server state / HTTP  | `@tanstack/react-query` + `axios`                 | Fetch, cache, loading/error state, invalidation, dan request interceptor. Jangan menyimpan response server di global state secara manual.  |
| Client state         | `zustand`                                         | State ringan seperti session user yang sudah disanitasi, UI state, dan state scanner. Jangan gunakan untuk menggantikan React Query cache. |
| Form                 | `react-hook-form` + `zod` + `@hookform/resolvers` | Form login, reset password, profil, sesi, dan filter. Schema frontend hanya untuk feedback awal; backend tetap memvalidasi ulang.          |
| QR scanner           | `qr-scanner`                                      | Akses kamera dan decode QR di browser. Hanya kirim payload hasil decode ke endpoint backend; jangan menentukan validitas sesi dari client. |
| QR display           | `qrcode.react`                                    | Menampilkan QR statis yang dikembalikan backend pada halaman guru.                                                                         |
| Date/time            | `date-fns` + `date-fns-tz`                        | Format dan konversi tampilan. Jangan menghitung status absensi memakai jam lokal browser.                                                  |
| Excel download       | Native `Blob` melalui response API                | Frontend hanya mengunduh file `.xlsx` dari backend; pembuatan workbook dan filtering data wajib di backend.                                |
| Testing              | Vitest + React Testing Library + MSW              | Unit/component test dan mock REST API tanpa bergantung pada server eksternal.                                                              |
| E2E                  | Playwright                                        | Alur kritis login, role guard, scan result, pembuatan sesi, dan download export.                                                           |

Jangan menambahkan Redux, Axios interceptor yang menyimpan token ke `localStorage`, library QR dinamis, atau library Excel di frontend tanpa keputusan arsitektur baru. Jangan menambahkan kembali `lucide-react`; seluruh ikon memakai `@mui/icons-material` (D1).

## 2.1 Golden master dan kepemilikan visual

`frontend_new/` adalah **golden master**: prototype mock-up yang menjadi sumber keputusan visual (warna, radius, spacing, typography, bentuk ikon, posisi blok). `frontend/` adalah aplikasi produksi yang **meniru** golden master; lapisan presentasi tidak boleh menyimpang sendiri.

Aturan alur kerja (wajib):

1. **Setiap perubahan visual dimulai di `frontend_new/`** (golden master) lebih dulu, disetujui, baru dirontokkan ke `frontend/` dengan memetakan ke data/servis nyata.
2. `frontend/` boleh berubah langsung hanya untuk **bug/behavior**, aksesibilitas, atau hal yang memang tidak punya referensi golden master (mis. sidebar desktop D7, tabel guru/admin M4-1, bottom nav admin 7 item).
3. Jangan mengubah logic bisnis lewat pekerjaan visual: route, role guard, auth, status absen, timezone, idempotensi scan, invalidate query, dan export tetap milik `frontend/` dan tidak disentuh oleh parity.
4. Bila atribut visual bentrok dengan PRD/DESIGN_BRIEF, keputusan dikunci lebih dulu di `docs/DECISIONS.md` (contoh D1–D8), jangan menebak.
5. Kontrak visual yang wajib identik ada di `docs/PLAN_MERGE_UI.md` bagian 3; verifikasi parity lintas viewport 320/390/768/1440.

### Primitif presentasi bersama

Primitif di bawah adalah cermin dari komponen golden master; pakai ini, jangan menulis ulang kelas ad hoc:

| Golden master (`frontend_new/`) | Produksi (`frontend/`) |
| --- | --- |
| `components/XPadding` | `components/layout/ContentShell.jsx` |
| `components/Header` | `components/layout/BlueHeader.jsx` |
| `components/Button` | `components/common/PrimaryButton.jsx` |
| `features/dashboard/components/SearchBar` | `components/common/PillSearch.jsx` |
| `features/dashboard/components/StatusAbsen` | `components/common/StatusDot.jsx` |
| `features/dashboard/components/FeatureGrid` | `components/common/FeatureGrid.jsx` |
| `features/dashboard/components/BottomNav` | `components/layout/BottomNav.jsx` |
| `components/AdSlider` | `features/banners/BannerCarousel.jsx` |

Token warna/radius/typography di `src/index.css` memakai alias semantik ke palet golden master (`docs/PLAN_MERGE_UI.md` bagian 7); jangan menulis hex acak di komponen.

## 3. Recommended Structure

```text
frontend/
	public/
	src/
		app/
			App.jsx
			router.jsx
			providers.jsx
		assets/
		components/
			common/
			forms/
			layout/
			feedback/
		features/
			auth/
			attendance/
			banners/
			profile/
			academic/
			reports/
		hooks/
		lib/
			apiClient.js
			queryClient.js
			permissions.js
			dateTime.js
		pages/
			auth/
			student/
			teacher/
			admin/
			NotFoundPage.jsx
		services/
			authService.js
			attendanceService.js
			bannerService.js
			reportService.js
			userService.js
		schemas/
		stores/
		styles/
		main.jsx
		index.css
	.env.example
	package.json
```

Struktur ini memakai feature folder untuk UI/domain yang berdekatan dan `services` sebagai boundary REST. Komponen reusable yang tidak mengetahui domain diletakkan di `components/common`; komponen domain tetap berada di feature terkait. Jangan membuat satu file service atau satu store global yang menampung seluruh fitur.

## 4. Routing and Access Control

Route minimal:

- `/login` dan `/forgot-password`: publik.
- `/app`: authenticated layout dengan redirect sesuai role.
- `/app/student/*`: dashboard, scanner, history, profile.
- `/app/teacher/*`: dashboard, assignments, attendance sessions, class attendance, export.
- `/app/admin/*`: dashboard, banners, users, classes, assignments, global attendance report.

`ProtectedRoute` hanya memeriksa status sesi yang dikembalikan backend. `RoleRoute` membatasi tampilan berdasarkan role, tetapi backend tetap wajib mengotorisasi setiap endpoint. Saat API mengembalikan `401`, hapus state user dan arahkan ke `/login`; saat `403`, tampilkan halaman akses ditolak tanpa retry loop.

## 5. API Fetching Rules

- Semua request melewati satu instance Axios di `lib/apiClient.js`.
- Gunakan base URL dari `VITE_API_BASE_URL`; jangan menulis URL server di komponen.
- Pilihan auth MVP adalah cookie session/token HttpOnly dari backend. Axios harus mengirim credential sesuai kontrak backend (`withCredentials` bila cookie digunakan); jangan membaca token HttpOnly dari JavaScript.
- React Query menjadi satu-satunya pemilik server state. Query key harus stabil dan memasukkan filter yang memengaruhi hasil.
- Mutation wajib meng-handle `loading`, success, validation error, authorization error, network error, dan conflict/idempotency response.
- Setelah mutation yang mengubah data, invalidate query terkait. Jangan melakukan reload seluruh halaman untuk menyegarkan data.
- Endpoint export dipanggil sebagai binary response dan nama file diambil dari header `Content-Disposition` bila tersedia.
- Jangan mengirim password, token, atau data sensitif ke console/log production.

Response error yang diharapkan memiliki bentuk konsisten dari backend: `code`, `message`, dan optional `fieldErrors`. UI memetakan `code` ke pesan pengguna; fallback message tidak boleh menampilkan stack trace atau detail database.

## 6. Attendance and QR UX Rules

- Scanner meminta izin kamera hanya setelah aksi pengguna dan menyediakan input payload/manual fallback jika browser tidak mendukung kamera.
- Setelah decode, hentikan scan sementara dan kirim satu mutation. Disable submit/retry cepat selama request berjalan.
- Tampilkan hasil server: status, waktu scan, dan `late_minutes` bila terlambat. Scan ulang harus menampilkan record yang sudah ada, bukan membuat state baru di client.
- Guru menampilkan QR berdasarkan payload sesi dari backend serta metadata mata pelajaran, kelas, tanggal, dan window waktu.
- Countdown di UI hanya informasi; gunakan waktu server atau response session, bukan untuk membuka/menutup scan secara otoritatif.
- Label UI Bahasa Indonesia boleh berbeda dari enum API. Mapping wajib terpusat: `HADIR`, `TERLAMBAT`, `TIDAK_HADIR`.

## 7. Coding Conventions

- Komponen, page, dan context memakai `PascalCase`; hooks memakai `useCamelCase`; service, helper, dan schema memakai `camelCase`; konstanta global memakai `UPPER_SNAKE_CASE`.
- Satu komponen utama per file. Nama file komponen mengikuti nama export.
- Gunakan named export untuk utilitas dan default export untuk page/component utama sesuai pola file setempat.
- Hindari prop drilling lebih dari dua level; gunakan composition atau store feature hanya bila state memang lintas halaman.
- Jangan menaruh request API langsung di JSX atau `useEffect` bila dapat menjadi React Query query/mutation.
- Event handler memakai nama `handleX`; boolean memakai awalan `is`, `has`, atau `can`.
- Semua form memiliki label, focus state, error yang terhubung ke field, dan state disabled saat submit.
- Jangan mengandalkan warna saja untuk status absensi; sertakan teks/icon dan kontras yang memadai.
- Jalankan `npm run lint` dan `npm run build` sebelum merge. Test kritis wajib dijalankan pada perubahan auth, attendance, routing, atau export.

## 8. Environment and Delivery Checklist

`.env.example` hanya boleh berisi nama variable, tanpa secret. Minimal: `VITE_API_BASE_URL`.

Sebelum fitur dianggap selesai, pastikan:

- role yang salah tidak dapat membuka page maupun berhasil memanggil endpoint;
- loading, empty, error, unauthorized, dan expired-session state tersedia;
- layout scanner dan tabel laporan usable pada mobile;
- file `.xlsx` benar-benar terunduh tanpa merender data sensitif ke DOM;
- tanggal dan jam ditampilkan dalam timezone sekolah yang ditentukan backend;
- build production tidak memiliki error ESLint atau unresolved environment variable.
