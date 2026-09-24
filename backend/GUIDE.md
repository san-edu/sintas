# Backend Technical Guide

## 1. Scope and Architectural Decisions

Backend adalah REST API Express.js untuk aplikasi monolith satu sekolah. Tanggung jawab backend meliputi autentikasi, authorization, validasi bisnis, aturan waktu absensi, transaction, laporan, dan export. React tidak boleh mengambil keputusan yang hanya dapat dipercaya dari server.

Gunakan pola **route -> middleware -> controller -> service -> repository -> database**. Controller tipis: membaca request, memanggil service, dan membentuk response. Service memegang aturan bisnis. Repository hanya menangani akses data terparameterisasi dan tidak mengandung keputusan role atau HTTP.

Semua waktu disimpan sebagai UTC di database dan dikonversi ke timezone sekolah pada boundary service/response. Timezone sekolah harus configurable, bukan hardcoded di controller.

## 2. Tech Stack and Libraries

| Area                | Pilihan                                  | Fungsi dan aturan                                                                                                                                                                                         |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime             | Node.js LTS + JavaScript ES Modules      | Runtime server. Gunakan `type: module` dan async/await.                                                                                                                                                   |
| HTTP                | Express.js                               | Routing, middleware, dan REST API.                                                                                                                                                                        |
| Database            | MySQL 8.0+                               | Relational source of truth untuk user, assignment, session, dan attendance. Gunakan connection pool.                                                                                                      |
| ORM / migrations    | Prisma ORM + Prisma Migrate              | Schema, migration, generated client, relation, transaction, dan prepared query. Jangan membangun SQL dari input string. Untuk laporan kompleks, gunakan Prisma tagged/raw query dengan parameter binding. |
| Validation          | `zod`                                    | Validasi body, params, query, dan environment config. Validasi domain tetap dipertegas di service/database.                                                                                               |
| Auth password       | `argon2`                                 | Hash password modern dengan salt. Jangan menyimpan plaintext atau memakai MD5/SHA untuk password.                                                                                                         |
| Auth session        | `jose`                                   | Sign/verify JWT bila token dipilih. Access token singkat dan refresh token rotation wajib bila auth berbasis JWT.                                                                                         |
| Cookie              | `cookie` atau Express cookie middleware  | Cookie HttpOnly, Secure di production, SameSite sesuai deployment. Pilih cookie session/token HttpOnly sebagai default client contract.                                                                   |
| Security middleware | `helmet`, `cors`, `express-rate-limit`   | Security headers, origin allowlist, dan rate limit per route/akun/IP.                                                                                                                                     |
| Logging             | `pino` + `pino-http`                     | Structured log, request ID, durasi, status, dan error tanpa secret/PII berlebihan.                                                                                                                        |
| Excel export        | `exceljs`                                | Membuat workbook `.xlsx` di backend setelah scope/filter terverifikasi. Jangan memindahkan seluruh dataset ke frontend.                                                                                   |
| QR payload          | `crypto` bawaan Node + `jose` bila perlu | Payload berisi opaque session identifier yang sulit ditebak dan/atau ditandatangani. Jangan menaruh data pribadi di QR.                                                                                   |
| Testing             | Vitest + Supertest                       | Unit service/domain dan integration test HTTP. Test database memakai MySQL test database/container, bukan production.                                                                                     |
| API docs            | `swagger-jsdoc` + `swagger-ui-express`   | Dokumentasi endpoint, schema, auth, error, dan file response.                                                                                                                                             |
| Health              | Express route khusus                     | `/health/live` untuk proses hidup dan `/health/ready` yang memeriksa koneksi database.                                                                                                                    |

JWT bukan pengganti authorization. Token hanya mengidentifikasi user; setiap service tetap memeriksa role, assignment aktif, kepemilikan resource, dan scope laporan. Bila deployment belum membutuhkan multi-instance, cookie session server-side tetap dapat dipilih, tetapi session store harus shared dan tidak boleh memakai memory process.

## 3. Recommended Folder Structure

```text
backend/
	prisma/
		schema.prisma
		migrations/
		seed.js
	src/
		app.js
		server.js
		config/
			env.js
			database.js
			logger.js
		routes/
			index.js
			auth.routes.js
			attendance.routes.js
			banner.routes.js
			academic.routes.js
			report.routes.js
			user.routes.js
		controllers/
		services/
			auth/
			attendance/
			academic/
			banner/
			report/
			user/
		repositories/
		middleware/
			authenticate.js
			authorize.js
			validate.js
			errorHandler.js
			requestId.js
			rateLimiters.js
		schemas/
		domain/
			attendanceStatus.js
			permissions.js
			errors.js
		utils/
		tests/
			unit/
			integration/
		docs/
	.env.example
	package.json
```

`app.js` membuat Express app tanpa listen agar mudah dites. `server.js` menangani startup, graceful shutdown, dan port. Prisma client dibuat satu kali dan memakai pool; jangan membuat client baru di setiap request.

## 4. Domain Rules That Must Live on the Backend

### Attendance session

- Guru hanya dapat membuat session untuk `teacher_assignment` miliknya yang aktif.
- `end_at` harus lebih besar dari `start_at`; semua timestamp dinormalisasi ke UTC.
- QR payload tidak boleh memuat password, email, nama siswa, atau data akademik sensitif.
- Session duplikat untuk assignment, tanggal, dan pasangan waktu ditolak dengan conflict yang konsisten atau mengembalikan session existing sesuai keputusan produk; pilih satu perilaku sebelum implementasi.

### Scan

- Validasi authentication, role siswa, payload QR, session aktif, assignment, dan keanggotaan siswa pada kelas.
- Window valid adalah `start_at - 15 menit` sampai `end_at`.
- Dari window buka sampai tepat `start_at + 15 menit`, status `HADIR`; setelah itu sampai `end_at`, status `TERLAMBAT`.
- `late_minutes` adalah selisih menit antara waktu scan server dan `start_at`; untuk `HADIR` nilainya `0` atau `NULL` secara konsisten.
- Scan di luar window ditolak tanpa insert.
- Unique constraint `(session_id, student_id)` wajib menjadi perlindungan terakhir. Gunakan transaction dan tangani duplicate-key sebagai response idempotent yang mengembalikan record existing/status duplicate.
- `TIDAK_HADIR` harus difinalisasi dengan strategi yang dipilih produk: job setelah `end_at` atau computed saat query. Jangan mencampur dua sumber kebenaran.

Aturan ini diuji sebagai pure domain unit test dengan boundary tepat pada `-15`, `0`, dan `+15` menit, lalu diuji lagi melalui endpoint integration test.

## 5. API and Response Conventions

Gunakan prefix `/api/v1`. Resource memakai plural nouns dan HTTP semantics yang standar:

- `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password`.
- `GET/PATCH /me` untuk profil user yang sedang login.
- `POST /attendance-sessions`, `GET /attendance-sessions`, `GET /attendance-sessions/:id/qr`.
- `POST /attendance-scans` untuk scan idempotent.
- `GET /attendance/history` untuk siswa dan endpoint scoped guru/admin sesuai policy.
- `GET /reports/attendance/export` untuk `.xlsx` setelah authorization dan filter.

Response sukses berbentuk JSON dengan `data` dan optional `meta`; list memakai pagination. Error minimal berbentuk `error: { code, message, fieldErrors? }`. Gunakan status yang konsisten: `400` validation, `401` unauthenticated, `403` forbidden, `404` resource tidak ditemukan dalam scope, `409` duplicate/conflict, `429` rate limit, `500` unexpected error. Jangan membocorkan apakah username/email tertentu ada pada login atau reset password.

Filter, sorting, dan pagination harus divalidasi allowlist. Default limit wajib ada dan maximum limit membatasi beban query. Endpoint laporan dan export menerapkan role/scope sebelum query database, bukan setelah semua data diambil.

## 6. Authentication and Security Strategy

- Password di-hash dengan Argon2id. Rehash dilakukan bila parameter hash lama tidak lagi memenuhi konfigurasi.
- Login menghasilkan session/token HttpOnly. Untuk JWT: access token berumur pendek, refresh token disimpan/di-rotate secara aman dan dapat direvoke; jangan simpan JWT di localStorage.
- Cookie production menggunakan `HttpOnly`, `Secure`, dan `SameSite` yang sesuai; `cors` hanya mengizinkan origin frontend dari environment allowlist.
- `authenticate` memverifikasi signature, expiry, issuer/audience bila digunakan, lalu menempelkan identitas minimal ke `req.user`.
- `authorize(...roles)` memeriksa role setelah authentication. Policy service memeriksa kepemilikan assignment, kelas, dan status aktif.
- Gunakan CSRF protection bila auth cookie dipakai untuk browser dan request state-changing lintas origin berpotensi terjadi.
- Rate limit login, reset password, dan scan berdasarkan IP serta identity/device secara proporsional. Jangan memakai rate limit global yang menghambat burst siswa valid dari banyak client.
- Terapkan Helmet, body size limit, request timeout, parameter validation, dan content-type validation.
- Jangan log password, token, cookie, QR payload mentah, atau tanggal lahir lengkap. Correlation/request ID harus ada di log dan response header.
- Error handler terpusat mengubah error terduga menjadi response aman dan menyimpan stack hanya di structured server log.
- Secret, database URL, JWT key, CORS origin, timezone, dan rate-limit config wajib dari environment validation; `.env.example` tidak boleh memiliki nilai rahasia.

## 7. Database and Performance Rules

Prisma schema harus menerapkan foreign key, `NOT NULL`, enum/check yang didukung, timestamp, unique constraint, dan index. Minimal index:

- unique `users.username`, index `users.email` dan `users.role`;
- active membership/assignment lookup berdasarkan student, teacher, class, subject;
- session berdasarkan assignment dan waktu;
- unique `attendance_records(session_id, student_id)`;
- history `attendance_records(student_id, scanned_at)` dan report `attendance_records(session_id, status)`.

Scan path harus singkat: validasi resource yang diperlukan, hitung status, insert satu record, commit. Jangan membuat workbook, memuat banner, atau menjalankan query laporan pada path scan. Gunakan pool dengan batas konfigurasi dan pantau saturation. Export/report diberi pagination, concurrency limit, atau job async bila ukuran meningkat.

Semua mutation lintas tabel memakai transaction. Migration harus repeatable secara operasional, dijalankan sebelum traffic menerima schema baru, dan memiliki prosedur rollback/backup yang didokumentasikan.

## 8. Testing and Operations

Wajib ada:

- unit test attendance window, late minutes, enum/status, permission policy, dan schema validation;
- integration test login/logout, role rejection, create session, invalid/expired QR, valid scan, duplicate scan, history, dan `.xlsx` export;
- test bahwa guru tidak dapat mengakses kelas/subject di luar assignment dan admin-only endpoint menolak role lain;
- load test burst scan sekitar 06:45-07:00 yang mencakup retry, duplicate, invalid QR, dan database contention;
- health/readiness test dan graceful shutdown test.

Operational minimum:

- `/health/live` tidak bergantung pada database; `/health/ready` gagal bila MySQL tidak siap;
- structured logging, request duration, error rate, pool saturation, request count per endpoint, dan duplicate/conflict scan dimetrikkan;
- backup database, retention, migration, rollback, dan recovery procedure ditulis di dokumentasi deployment;
- production berjalan dengan `NODE_ENV=production`, TLS di reverse proxy, dan least-privilege database user.

## 9. Implementation Order

1. Environment validation, Prisma schema, migration, seed, logger, error handler, dan health routes.
2. Auth, password hashing, session/JWT, authentication middleware, dan role/policy authorization.
3. Academic master, user profile, banner, dan assignment management.
4. Attendance session, QR payload, scan transaction, duplicate handling, dan finalisasi `TIDAK_HADIR`.
5. Student history, teacher scoped detail, admin global report, dan Excel export.
6. OpenAPI, unit/integration/load test, security review, dan deployment documentation.

## 10. Local Migration dan Seed

Siapkan `DATABASE_URL` pada environment lokal dengan database MySQL yang sudah
dibuat, lalu jalankan dari direktori `backend/`:

```bash
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

Seed development bersifat idempotent dan hanya boleh dijalankan pada environment
non-production. Password akun demo di-hash menggunakan Argon2id sebelum disimpan;
nilai default `SEED_PASSWORD` adalah password development sementara dan dapat
diganti melalui environment saat menjalankan seed. Seed tidak membuat record
absensi, sehingga tidak menentukan status `HADIR`, `TERLAMBAT`, atau
`TIDAK_HADIR`.

Untuk reset database development secara destruktif, pastikan `DATABASE_URL`
mengarah ke database yang benar lalu jalankan:

```bash
npx prisma migrate reset --force
npm run prisma:seed
```

Jangan menjalankan reset pada production. Migration harus diterapkan sebelum
traffic menerima schema baru; backup dan prosedur rollback database merupakan
tanggung jawab deployment. Runbook provider-neutral untuk startup, backup,
restore, rollback, dan load test burst scan tersedia di [OPERATIONS.md](OPERATIONS.md).
