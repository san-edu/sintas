# SINTAS — Sistem Absensi Sekolah Berbasis QR Code

> Absensi digital untuk satu sekolah dengan tiga peran: **Siswa (STUDENT)**, **Guru (TEACHER)**, dan **Admin (ADMIN)**. Guru membuat sesi absensi → sistem menerbitkan kode QR → siswa memindai → status kehadiran (`HADIR` / `TERLAMBAT` / `TIDAK_HADIR`) dihitung otomatis dari **waktu server**.

SINTAS menggantikan daftar hadir kertas: lebih cepat, anti-duplikat (idempoten), tahan melawan manipulasi jam ponsel, dan menyediakan rekap/laporan `.xlsx` untuk guru dan admin.

Dokumen utama repo (seluruhnya dalam Bahasa Indonesia):

| File | Isi |
| --- | --- |
| `backend/GUIDE.md` | Panduan teknis backend: arsitektur, stack, aturan domain, keamanan. |
| `frontend/GUIDE.md` | Panduan teknis frontend: stack, struktur target, aturan API & QR UX. |
| `docs/API_CONTRACT.md` | **Sumber kebenaran kontrak API** (auth, request/respone, error, pagination). |
| `docs/openapi.yaml` | Spesifikasi OpenAPI (diselaraskan dengan implementasi). |
| `docs/DEV_INSTRUCTION.md` | Menjalankan dev lokal + akses via HTTPS/LAN (kamera QR di HP). |
| `docs/DOKUMENTASI.md` | Dokumentasi populer/non-teknis untuk pemangku kepentingan sekolah. |
| `backend/OPERATIONS.md` | Operasional produksi: startup, backup, rollback, syarat load test. |

---

## 1. Gambaran Arsitektur

Monorepo dengan **dua package npm independen** (tanpa root `package.json` / workspace). Semua perintah dijalankan dari dalam `backend/` atau `frontend/`, bukan dari root.

```
sintas-final/
├── backend/     # REST API — Express 5 + Prisma + MySQL + Vitest (port 3000)
├── frontend/    # React SPA — Vite + Tailwind (port 5173, HTTPS dev)
└── docs/        # Kontrak API, panduan dev, dokumentasi populer, openapi.yaml
```

Flow alur utama:

```
Guru buat sesi → backend buat QR (payload opaque 43 karakter, bebas PII)
                                        │
Siswa pindai QR (kamera/input manual) ──┘
                 │
        Waktu server (UTC) dihitung status:
        start-15' … start+15'  → HADIR
        start+15' … end        → TERLAMBAT (+ lateMinutes)
        tanpa scan sampai end   → TIDAK_HADIR (dihitung saat dibaca)
```

### Backend

- **Layering tetap**: `route → middleware → controller → service → repository → database`. Controller tipis; aturan bisnis di service; logika murni + Zod di `src/domain/` & `src/schemas/`.
- `src/app.js` mengekspor `createApp({ prisma, logger, env })` (dependency-injected, tanpa `listen`) sehingga mudah dites via HTTP. `src/server.js` pemilik startup + graceful shutdown.
- Semua router adalah factory `createXRouter({ prisma, env })` yang didaftarkan sekali di `src/routes/index.js`.
- **Test tanpa MySQL nyata**: unit & "integration" (HTTP-through-factory) menginjeksi objek `prisma` mock.
- Skema DB: **11 tabel** (`users`, `student_profiles`, `teacher_profiles`, `education_levels`, `classes`, `subjects`, `class_students`, `teacher_assignments`, `attendance_sessions`, `attendance_records`, `banners`).

### Frontend

- Saat ini `frontend/` **belum memiliki source (`src/`) aplikasi** — masih landasan Vite dengan seluruh library target yang sudah terpasang di `package.json` (React 19, react-router-dom, react-query, axios, zustand, react-hook-form + zod, tailwindcss, `qr-scanner`, `qrcode.react`, `@mui/icons-material`, testing-stack Vitest/RTL/MSW). `frontend/GUIDE.md` berisi struktur target & aturan yang harus diikuti sebelum fitur dibangun.
- `frontend/dist/` memuat hasil build dari versi source sebelumnya (arsip, bukan sumber aktif).
- Dev server memakai **HTTPS self-signed** (`@vitejs/plugin-basic-ssl`) dan proxy `/api` ke backend agar frontend ↔ API **same-origin** (keharusan untuk cookie `SameSite=Lax` dan akses kamera `navigator.mediaDevices` yang butuh secure context).

---

## 2. Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| Backend | Node.js (ESM), Express 5, Prisma ORM 6 + MySQL 8, Zod 4, jose (JWT), argon2 (Argon2id), exceljs (`.xlsx`), pino (log), helmet + cors + express-rate-limit |
| Frontend | React 19, Vite 8, Tailwind CSS 4, react-router-dom, @tanstack/react-query, axios, zustand, react-hook-form + zod, headlessui, @mui/icons-material, qr-scanner, qrcode.react |
| Testing | Backend: Vitest + Supertest. Frontend: Vitest + React Testing Library + MSW (terpasang, belum dipakai) |

---

## 3. Prasyarat

- Node.js **LTS** (≥ 20 direkomendasikan, ESM)
- MySQL **8.0+**
- npm (untuk masing-masing package)
- Acces kamera untuk uji pemindai QR (butuh HTTPS/secure context)

---

## 4. Setup & Menjalankan Lokal

### 4.1 Backend (`port 3000`)

```bash
cd backend
npm install
```

Buat file `.env` dari contoh (`.env` sudah di-gitignore):

```bash
Copy-Item .env.example .env   # Windows / PowerShell
```

Isi minimal `DATABASE_URL` (contoh MySQL lokal):

```
DATABASE_URL="mysql://root:password@localhost:3306/sintas"
JWT_SECRET=<kunci-acak-minimal-32-karakter>
```

Siapkan skema + data demo, lalu jalankan:

```bash
npm run prisma:generate
npx prisma migrate dev          # dev: buat/apply migrasi + client
npm run prisma:seed             # idempotent, menolak NODE_ENV=production
npm run dev                     # node --watch src/server.js
```

> Alternatif non-dev: `npx prisma migrate deploy`. Reset destruktif (dev saja): `npx prisma migrate reset --force` lalu seed ulang. Jangan pernah reset/seed di production.

### 4.2 Frontend (`port 5173`)

```bash
cd frontend
npm install
npm run dev                     # https://localhost:5173 (self-signed, host LAN aktif)
```

Dev memakai `frontend/.env.development` (`VITE_API_BASE_URL=/api/v1`) + proxy Vite ke `http://localhost:3000`. Setelah mengubah `.env` / `vite.config.js`, **restart** prosesnya.

Untuk akses dari HP/LAN (IP + kamera) ikuti `docs/DEV_INSTRUCTION.md` — pastikan origin HTTPS frontend terdaftar persis di `CORS_ORIGIN` backend lalu restart backend.

### 4.3 Akun demo (hasil seed)

| Role | Username | Password |
| --- | --- | --- |
| Siswa | `student.demo` | `SEED_PASSWORD` (default `Sintas-Dev-Only-ChangeMe`) |
| Guru | `teacher.demo` | sama |
| Admin | `admin.demo` | sama |

Seed juga membuat: jenjang SMA, kelas `XII IPA 1`, mapel Matematika, penempatan siswa, penugasan guru, satu sesi demo, dan satu banner aktif.

---

## 5. Perintah Penting

Dijalankan dari dalam `backend/` atau `frontend/` (bukan root):

| Package | Perintah | Fungsi |
| --- | --- | --- |
| backend | `npm run dev` / `npm start` | Dev (watch) / produksi (`src/server.js`) |
| backend | `npm test` | Unit + integration (tanpa MySQL live) |
| backend | `npm run test:unit` / `npm run test:integration` | Salah satu bagian test |
| backend | `npm run lint` | ESLint seluruh file |
| backend | `npm run prisma:*` | `generate`, `migrate`, `seed` |
| frontend | `npm run dev` / `npm run build` / `npm run preview` | Dev HTTPS / build / preview build |
| frontend | `npm run lint` / `npm test` | Lint / test (stack terpasang) |

Status saat ini: **71 kasus uji backend** (6 unit + 7 integration) hijau dan lint bersih. Test mengunci boundary `-15 / 0 / +15` menit, duplikat scan (sequential, concurrent, P2002), scope per role, dan export workbook.

---

## 6. Aturan Bisnis Inti (dikunci & ditest)

1. **Waktu selalu server.** Database menyimpan UTC; `SCHOOL_TIMEZONE` (default `Asia/Jakarta`) mengonversi di boundary service. Frontend dilarang menghitung status absensi dari jam lokal browser.
2. **Window scan**: buka `start_at − 15 mnt`, tutup `end_at`.
   - `≤ start_at + 15 mnt` → `HADIR` (lateMinutes 0, inklusif di menit ke-15).
   - setelah itu hingga `end_at` → `TERLAMBAT` (`lateMinutes` = selisih menit dari `start_at`).
   - di luar window → `409 ATTENDANCE_WINDOW_CLOSED`, **tanpa record**.
3. **`TIDAK_HADIR` dihitung saat dibaca** (computed), tidak pernah disimpan; `attendance_records` hanya berisi scan.
4. **Scan idempoten**: unique `(session_id, student_id)`. Scan ulang/konkuren → `200` record existing dengan `duplicate: true`.
5. **Sesi duplikat** (assignment + tanggal + waktu) → `409 DUPLICATE_ATTENDANCE_SESSION`.
6. **Satu kelas aktif per siswa** → `409 ACTIVE_CLASS_MEMBERSHIP_EXISTS`; perpindahan = nonaktifkan dulu.
7. **QR payload opaque**: 43 karakter `base64url` acak (32 byte) dari `crypto.randomBytes`, tanpa PII. Format invalid → `400 INVALID_QR_PAYLOAD`.
8. **Scope selalu server-side**: guru hanya assignment aktif miliknya; siswa hanya kelas aktifnya; admin global. Query tak dikenal → `400 VALIDATION_ERROR`.
9. **Export** `.xlsx` bernama `laporan-kehadiran-{from}-{to}.xlsx`; kosong → `404 NO_DATA_TO_EXPORT`; maks 2 proses bersamaan (`429 EXPORT_BUSY`).

---

## 7. Konsumen API (ringkas untuk developer)

- **Base path bisnis**: `/api/v1`. Health tanpa prefix: `/health/live` (proses) & `/health/ready` (DB, gagal → `503 NOT_READY`).
- **Auth**: `POST /api/v1/auth/login` mengeset cookie HttpOnly `auth_token` (JWT HS256 via `jose`, TTL default `15m`). Tidak ada token di `localStorage`.
- **CSRF**: GET meminta cookie `csrf_token`; mutasi dari browser dengan Origin harus mengirim header `x-csrf-token` yang cocok.
- **Response**: sukses `{ "data": ... }`; list `{ "data": { "items": [...], "meta": { page, limit, total, totalPages } } }`. Error `{ "error": { "code", "message", "fieldErrors? } }` dengan HTTP `400/401/403/404/408/409/429/500/503`.
- **Rate limit**: login `10/15mnt`, forgot-password `5/15mnt`, scan `SCAN_RATE_LIMIT` (default `120/60 dtk`).
- Grup route: `auth`, `me`, `academic/*` (education-levels, classes, subjects, memberships, assignments, my-classes), `users`, `banners`, `attendance-sessions` (+ `:id/qr`), `attendance-scans`, `attendance/*` (history, classes/:id, today), `reports/attendance` (+ `/export`).

Detail lengkap per endpoint (skema, error per kode, contoh request/response) di `docs/API_CONTRACT.md`. Jaga sinkronisasi bila mengubah route → kontrak → `docs/openapi.yaml`.

---

## 8. Konfigurasi Environment

Backend (divalidasi Zod di `src/config/env.js`; `DATABASE_URL` wajib):

| Variabel | Default | Catatan |
| --- | --- | --- |
| `PORT` | `3000` | Port HTTP |
| `DATABASE_URL` | — | Wajib; MySQL DSN |
| `CORS_ORIGIN` | `http://localhost:5173` | Daftar dipisah koma; production menolak `localhost` |
| `SCHOOL_TIMEZONE` | `Asia/Jakarta` | IANA; divalidasi saat boot |
| `JWT_SECRET` | dev-only | Production menolak default dev |
| `JWT_ISSUER` / `ACCESS_TOKEN_TTL` / `AUTH_COOKIE_NAME` | `sintas` / `15m` / `auth_token` | Token & cookie |
| `REQUEST_TIMEOUT_MS` | `10000` | Timeout tiap request (`408 REQUEST_TIMEOUT`) |
| `SCAN_RATE_LIMIT` | `120` | Limit scan per menit |
| `LOG_LEVEL` | `info` | Level pino; redact password/token/qrPayload/birthDate |

Frontend (`frontend/.env.example`): `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1` — di dev memakai `/api/v1` via proxy) dan `VITE_SCHOOL_TIMEZONE` (default `Asia/Jakarta`, hanya untuk format tampilan).

---

## 9. Testing & Kualitas

```bash
cd backend
npm test          # 71 kasus — unit + integration, mock prisma (tanpa MySQL)
npm run lint
```

- Boundary waktu diuji sampai milidetik dengan `vi.useFakeTimers` + `vi.setSystemTime`; waktu scan selalu dari `now()` server, client timestamp tidak dipercaya.
- Test "integration" = HTTP melalui `createApp` dengan `prisma` mock. Isolasi transaksi/pool act dengan MySQL asli adalah kewajiban deployment (`backend/OPERATIONS.md`), bukan bagian suite ini.
- Frontend memakai Vitest + RTL + MSW (instalasi siap; belum ada source/test). Sebelum merge frontend: `npm run lint` dan `npm run build`.

---

## 10. Deployment & Keamanan (ringkas)

- Jalankan migrasi sebelum traffik: `npm run prisma:generate` + `npx prisma migrate deploy`.
- Production: `NODE_ENV=production`, TLS di reverse proxy (disarankan Cloudflare), database user least-privilege, dan **jangan** `prisma migrate reset` / seed terhadap production.
- `CORS_ORIGIN` production tidak boleh memuat `localhost`; JWT secret harus kunci acak ≥ 32 karakter.
- Backup + retention + prosedur rollback mengikuti `backend/OPERATIONS.md`. Sebelum traffik nyata: load test burst scan 06:45–07:00.
- Larangan logging/response: password, token/JWT, cookie, `qrPayload` mentah, tanggal lahir lengkap.

---

## 11. Status & Batasan yang Diketahui

- **Frontend belum memiliki source aktif** — implementasi UI menyusul mengikuti `frontend/GUIDE.md` (dipandu `docs/API_CONTRACT.md` untuk integrasi).
- Sesi demo dari seed (`dev-session-matematika-20260917`) tidak lolos format QR opaque sehingga tidak dapat discan — buat sesi baru via API untuk QR valid.
- Email duplikat belum menghasilkan error `409` eksplisit (tertangkap sebagai `500`), di luar scope kontrak saat ini.
- Repo masih tanpa commit awal (`main`, belum ada history) — seluruh file belum ter-track.