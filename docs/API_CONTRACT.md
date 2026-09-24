# API Contract — SINTAS

Dokumen ini adalah **sumber kebenaran kontrak API** yang dipakai backend dan
frontend. Setiap endpoint di bawah diverifikasi terhadap implementasi nyata
(`backend/src/`) dan test yang benar-benar ada. Jika ada benturan antara dokumen
ini, `docs/openapi.yaml`, dan kode, maka **kode yang berjalan + test adalah
acuan dan dokumen ini harus diperbaiki agar sama persis**; lihat
[Appendix: Contract Consistency Check](#appendix-contract-consistency-check).

Dokumen ini mengunci: base path, auth, role, request schema, success response,
pagination, error code, HTTP status, timezone, dan contoh aman per endpoint.
Frontend **tidak boleh** menganggap dirinya sumber kebenaran untuk role, waktu,
status absensi, atau scope laporan.

---

## 1. Konvensi Global

### 1.1 Base path dan kesehatan

- Seluruh endpoint bisnis memakai prefix `/api/v1`. Endpoint health **tidak**
  memakai prefix: `/health/live` dan `/health/ready`.
- Server default `PORT=3000`; semua response JSON kecuali export `.xlsx`
  (binary).

### 1.2 Auth — cookie HttpOnly + JWT

- Login berhasil mengeset cookie `AUTH_COOKIE_NAME` (default `auth_token`).
  Cookie: `HttpOnly; Path=/; SameSite=Lax`, plus `Secure` hanya di production.
- Token adalah JWT HS256 (`jose`) dengan `sub` = user id, `username`, `role`,
  issuer `JWT_ISSUER`, TTL `ACCESS_TOKEN_TTL` (default `15m`).
- Frontend mengirim cookie otomatis (`withCredentials: true`). **Jangan**
  menyimpan token di `localStorage`. JWT tidak boleh dibaca dari JavaScript.
- Middleware `authenticate` membaca cookie, memverifikasi JWT, dan menempel
  `req.user = { id, username, role }`. Gagal/expired → `401 UNAUTHENTICATED`.
- Middleware `authorize(...roles)` memeriksa role. Berbeda role → `403
  FORBIDDEN`. Setiap service tetap memvalidasi ulang scope/ownership (defense
  in depth).

### 1.3 CSRF

- `GET`/`HEAD`/`OPTIONS` meminta token: jika belum ada, server mengeset cookie
  `csrf_token` (`Path=/; SameSite=Lax`).
- Request **state-changing** (bukan GET/HEAD/OPTIONS):
  - Jika memuat header `Origin`, Origin wajib ada di allowlist `CORS_ORIGIN`
    → selain itu `403 CSRF_ORIGIN_REJECTED`.
  - Jika request memuat cookie auth **dan** header `Origin`, header
    `x-csrf-token` wajib sama persis dengan cookie `csrf_token` → selain itu
    `403 CSRF_TOKEN_INVALID`.
- Frontend harus mengirim `x-csrf-token` untuk semua mutasi yang dikirim dari
  browser dengan Origin (login/logout/forgot-password/POST/PATCH/DELETE).

### 1.4 Response protocol

- Sukses: `{ "data": <payload> }`.
- List terpaginasi: `{ "data": { "items": [...], "meta": {...} } }`.
  Kontrak pagination (konsisten di semua list):

  ```json
  {
    "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
  ```

  Dua pengecualian (mengembalikan array biasa, bukan objek paginasi):
  1. `GET /api/v1/attendance-sessions` → `{ "data": [ ...session ] }`
  2. `GET /api/v1/academic/assignments` → `{ "data": [ ...assignment ] }`
  3. `GET /api/v1/academic/my-classes` → `{ "data": [ ...membership ] }`
  4. `GET /api/v1/banners` dan `GET /api/v1/banners/manage` →
     `{ "data": [ ...banner ] }`
  5. `GET /api/v1/attendance/today` → `{ "data": [ ...scheduleItem ] }`

- Export `.xlsx` → body biner, bukan JSON (lihat section 9).

### 1.5 Error contract

Error selalu:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "fieldErrors": { "field": ["pesan"] }
  }
}
```

- `fieldErrors` hanya hadir saat ada (umumnya `400`).
- Kode HTTP yang dipakai: `400`, `401`, `403`, `404`, `408`, `409`, `429`,
  `500`, `503`.
- Kode error penting yang dikunci (lihat tabel munculan per endpoint):
  `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `RESET_DATA_INVALID`,
  `VALIDATION_ERROR`, `FORBIDDEN`, `ASSIGNMENT_FORBIDDEN`,
  `CLASS_MEMBERSHIP_REQUIRED`, `NOT_FOUND`, `ATTENDANCE_SESSION_NOT_FOUND`,
  `INVALID_QR_PAYLOAD`, `ATTENDANCE_WINDOW_CLOSED`,
  `DUPLICATE_ATTENDANCE_SESSION`, `DUPLICATE_USERNAME`,
  `ACTIVE_CLASS_MEMBERSHIP_EXISTS`, `DUPLICATE_ASSIGNMENT`,
  `NO_DATA_TO_EXPORT`, `EXPORT_BUSY`, `RATE_LIMITED`, `REQUEST_TIMEOUT`,
  `NOT_READY`, plus `INVALID_TIMEZONE`, `INVALID_DATETIME`,
  `INVALID_TIME_RANGE`, `INVALID_SESSION_DATE` (pembuatan sesi).
- Seluruh error handler menambahkan `x-request-id` di log; response umumnya
  tidak memakai header khusus selain yang disebut.
- Jangan membocorkan keberadaan akun: login gagal → pesan generik; forgot-password
  data tidak cocok → pesan generik (`RESET_DATA_INVALID`), tanpa fieldErrors.

### 1.6 Pagination & filter allowlist

| Endpoint list | Param | Default | Maksimum | Sort yang diizinkan | Order |
|---|---|---|---|---|---|
| `academic/*` + `users` | `page`, `limit` | 1, 20 | 100 | `name` \| `createdAt` | `asc`(default) \| `desc` |
| `report/*` (history/detail/admin/export) | `page`, `limit` | 1, 20 | 100 | `sessionDate` \| `scannedAt` \| `status` | `desc`(default) \| `asc` |
| Export | — (dipaksa `page=1`, `limit=100`) | — | 100 | `sessionDate desc` | — |

- Parameter skema bersifat **strict**: query/body berisi field yang tidak
  dikenal → `400 VALIDATION_ERROR` (kunci `_form` untuk key tak dikenal).
- Opsi `sort`/`order` diluar allowlist → `400 VALIDATION_ERROR`.

### 1.7 Timezone, waktu, dan format

- **Database menyimpan timestamp UTC.** Definisi timezone sekolah:
  `SCHOOL_TIMEZONE` (IANA, default `Asia/Jakarta`), divalidasi saat boot.
- API **menerima/mengembalikan waktu ISO 8601 UTC** (contoh
  `2026-09-17T01:00:00.000Z`), kecuali:
  - `sessionDate`, `from`, `to` → tanggal kalender sekolah, format `YYYY-MM-DD`
    (disimpan sebagai `Date` tengah malam UTC yang mewakili tanggal sekolah
    tersebut).
  - `startAt`, `endAt` saat membuat sesi → ISO 8601 **dengan offset**
    (`z.string().datetime({ offset: true })`), lalu dinormalisasi ke UTC.
  - Field `timezone` harus sama persis dengan `SCHOOL_TIMEZONE`.
- Tampilan waktu di UI dan di workbook export memakai timezone sekolah.
  Frontend tidak boleh menghitung status absensi dari jam lokal browser.
- Batas 15 menit bersifat inklusif di menit ke-15: tepat `startAt + 15 menit`
  masih `HADIR`; `startAt + 15 menit` lebih beberapa detik (mis. `00:00.001`)
  menjadi `TERLAMBAT`.

### 1.8 Rate limit

| Path | Limit | Window |
|---|---|---|
| `POST /api/v1/auth/login` | 10 | 15 menit |
| `POST /api/v1/auth/forgot-password` | 5 | 15 menit |
| `POST /api/v1/attendance-scans` | `SCAN_RATE_LIMIT` (default 120) | 60 detik |

Melewati limit → `429 RATE_LIMITED` (pesan login/reset: "Terlalu banyak
percobaan..."; scan: "Terlalu banyak percobaan scan...").

### 1.9 Larangan logging / data sensitif

Tidak boleh muncul di log, response, atau QR: password (plaintext), token JWT,
isi cookie, payload QR mentah, dan tanggal lahir lengkap. `birthDate`
diizinkan di response profil (`/me`, user admin), tetapi tidak boleh di-log.
`qrPayload` hanya dikembalikan lewat `GET /attendance-sessions/:id/qr` kepada
role yang berhak; QR tidak pernah memuat PII.

---

## 2. Common Schemas

### 2.1 `publicUser`

```json
{
  "id": 1,
  "username": "student.demo",
  "role": "STUDENT",
  "name": "Siswa Demo",
  "email": "student.demo@example.test",
  "phone": null,
  "birthDate": null,
  "studentNumber": "S-0001"
}
```

`studentNumber` diambil dari `studentProfile`; `null` untuk guru/admin.

### 2.2 `sessionMetadata`

```json
{
  "id": 10,
  "assignmentId": 60,
  "classId": 30,
  "className": "XII IPA 1",
  "subjectId": 40,
  "subjectName": "Matematika",
  "sessionDate": "2026-09-17T00:00:00.000Z",
  "startAt": "2026-09-17T01:00:00.000Z",
  "endAt": "2026-09-17T02:00:00.000Z",
  "createdAt": "2026-09-16T02:00:00.000Z"
}
```

Semua waktu UTC. `sessionDate` mengacu tanggal kalender sekolah.

### 2.3 `scanMetadata`

```json
{
  "id": 100,
  "sessionId": 10,
  "scannedAt": "2026-09-17T01:16:30.000Z",
  "status": "TERLAMBAT",
  "lateMinutes": 16,
  "duplicate": false
}
```

`lateMinutes` selalu angka: `0` untuk `HADIR`/`TIDAK_HADIR`, selisih menit
(floor) untuk `TERLAMBAT`.

### 2.4 `reportMetadata`

```json
{
  "id": 100,
  "sessionId": 10,
  "studentId": 3,
  "studentName": "Siswa Demo",
  "studentNumber": "S-0001",
  "sessionDate": "2026-09-17T00:00:00.000Z",
  "classId": 30,
  "className": "XII IPA 1",
  "subjectId": 40,
  "subjectName": "Matematika",
  "startAt": "2026-09-17T01:00:00.000Z",
  "endAt": "2026-09-17T02:00:00.000Z",
  "scannedAt": "2026-09-17T01:16:30.000Z",
  "status": "TERLAMBAT",
  "lateMinutes": 16
}
```

Aturan `TIDAK_HADIR` (keputusan D4 docs/DECISIONS.md): **dihitung saat dibaca**,
tidak pernah disimpan. Siswa anggota kelas aktif tanpa record scan dan waktu
server sudah melewati `endAt` → status `TIDAK_HADIR` dengan `lateMinutes: 0`,
`scannedAt: null`, dan `id` berbentuk `computed-<sessionId>-<studentId>`.
Sesi yang belum selesai dan siswa tanpa scan **tidak muncul** di hasil.

### 2.5 Banner

```json
{
  "id": 1,
  "title": "Selamat datang",
  "imageUrl": null,
  "content": "Banner development",
  "isActive": true,
  "displayStartAt": null,
  "displayEndAt": null,
  "createdById": 5,
  "createdAt": "2026-09-16T02:00:00.000Z",
  "updatedAt": "2026-09-16T02:00:00.000Z"
}
```

---

## 3. Health

Tidak memakai `/api/v1` dan tidak butuh auth.

| Method | Path | Response |
|---|---|---|
| `GET` | `/health/live` | `200 { "data": { "status": "ok" } }` — proses hidup, tidak sentuh DB |
| `GET` | `/health/ready` | `200 { "data": { "status": "ready" } }` — `SELECT 1` sukses; **`503 NOT_READY`** ("Database belum siap menerima traffic.") bila DB gagal |

---

## 4. Auth

### 4.1 `POST /api/v1/auth/login`

- Auth: none. Rate limit: 10/15 menit.
- Body (`loginSchema`) — strict:
  - `username`: string, trim, 1–100
  - `password`: string, 8–128
- Success `200`:
  `{ "data": { "user": <publicUser> } }` + `Set-Cookie: auth_token=...`
  (HttpOnly).
- Errors:
  - `400 VALIDATION_ERROR` (fieldErrors)
  - `401 INVALID_CREDENTIALS` "Username atau password tidak sesuai." (generik)
  - `429 RATE_LIMITED`

Contoh:

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "username": "student.demo", "password": "Sintas-Dev-Only-ChangeMe" }
```

```json
{
  "data": {
    "user": {
      "id": 1, "username": "student.demo", "role": "STUDENT",
      "name": "Siswa Demo", "email": "student.demo@example.test",
      "phone": null, "birthDate": null, "studentNumber": "S-0001"
    }
  }
}
```

### 4.2 `POST /api/v1/auth/logout`

- Auth: none (hanya menghapus cookie; tidak mewajibkan sesi aktif).
- Success `200`:
  `{ "data": { "message": "Logout berhasil." } }` +
  `Set-Cookie: auth_token=; Max-Age=0; ...`.
- Errors: CSRF (`403 CSRF_ORIGIN_REJECTED` / `403 CSRF_TOKEN_INVALID`) jika
  dipicu Origin + cookie auth tanpa `x-csrf-token`.

### 4.3 `POST /api/v1/auth/forgot-password`

- Auth: none. Rate limit: 5/15 menit.
- Body (`forgotPasswordSchema`) — strict:
  - `email`: string email, ≤255
  - `birthDate`: date (coerce)
  - `password`: string 8–128
  - `passwordConfirmation`: string (superRefine: wajib sama → fieldError di
    `passwordConfirmation` "Konfirmasi password tidak sama.")
- Success `200`: `{ "data": { "message": "Password berhasil diubah." } }`.
- Errors: `400 RESET_DATA_INVALID` "Data pemulihan password tidak sesuai."
  (saat email + tanggal lahir tidak cocok), `400 VALIDATION_ERROR`, `429`.
- Berlaku untuk STUDENT, TEACHER, dan ADMIN (keputusan D8).

---

## 5. Profil — `/api/v1/me`

### 5.1 `GET /api/v1/me`

- Auth: wajib (semua role).
- Success `200`: `{ "data": { "user": <publicUser> } }`.
- Errors: `401 UNAUTHENTICATED`.

### 5.2 `PATCH /api/v1/me`

- Auth: wajib (semua role). Controller tidak memberikan data role — user hanya
  bisa mengubah dirinya sendiri.
- Body (`profileSchema`) — strict, **minimal satu field** (bukan nama/username):
  - `name?`: string 1–150
  - `email?`: email ≤255, nullable
  - `phone?`: string ≤30, nullable
  - `birthDate?`: date, nullable
- Success `200`: `{ "data": { "user": <publicUser> } }`.
- Errors: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`.
- Catatan: username dan `studentNumber` (NIM) tidak dapat diubah di sini
  (PRD FR-03).

Contoh:

```http
PATCH /api/v1/me
Content-Type: application/json
x-csrf-token: <csrf_token>

{ "phone": "081234567890", "name": "Siswa Demo" }
```

---

## 6. Academic — `/api/v1/academic`

Role: semua route admin = `[authenticate, authorize('ADMIN')]`; kelas & subject
GET = `[authenticate, authorize('ADMIN','TEACHER')]`; assignments GET = TEACHER;
assignments/manage GET = ADMIN; my-classes GET = STUDENT.

Query list (`listAcademicSchema`, diterapkan ke list): strict,
`page`(1)/`limit`(20,max100)/`sort`(`name`|`createdAt`, default `name`)/
`order`(`asc` default |`desc`) + `name` (cari contains) dan `educationLevelId`
hanya untuk classes.

### 6.1 Education Levels — `/education-levels`

| Method | Path | Admin | Request | Success |
|---|---|---|---|---|
| `GET` | `/education-levels` | ya | query list | `{ "data": { "items": [EducationLevel], "meta": {...} } }` |
| `POST` | `/education-levels` | ya | body `{ "name": string 1–150 }` | `{ "data": { "id", "name", "createdAt", "updatedAt" } }` |
| `PATCH` | `/education-levels/:id` | ya | params id; body `{ "name" }` | `{ "data": <EducationLevel> }`; `404 NOT_FOUND` "Jenjang tidak ditemukan." |
| `DELETE` | `/education-levels/:id` | ya | params id | `{ "data": <deleted row> }`; `404 NOT_FOUND` "Jenjang tidak ditemukan." |

`EducationLevel`: `id`, `name`, `createdAt`, `updatedAt`.

### 6.2 Classes — `/classes`

| Method | Path | Admin | TEACHER GET | Request | Success |
|---|---|---|---|---|---|
| `GET` | `/classes` | — | hanya assignment aktif miliknya | query list | `{ "data": { "items": [Class+educationLevel], "meta" } }` |
| `POST` | `/classes` | ya | — | body `{ "name": 1–100, "educationLevelId": int>0 }` | `{ "data": Class+educationLevel }`; `404` "Jenjang tidak ditemukan." |
| `PATCH` | `/classes/:id` | ya | — | params id; body `{ name, educationLevelId }` | `{ "data": Class+educationLevel }`; `404` "Kelas tidak ditemukan." |
| `DELETE` | `/classes/:id` | ya | — | params id | `{ "data": <deleted row> }`; `404` "Kelas tidak ditemukan." |

`Class`: `id`, `name`, `educationLevelId`, `createdAt`, `updatedAt`,
`educationLevel` (include).

### 6.3 Subjects — `/subjects`

Pola identik classes. `GET` (staff) mengembalikan `{ "data": { "items": [Subject], "meta" } }`;
`POST`/`PATCH`/`DELETE` admin. `Subject`: `id`, `name` (unik),
`createdAt`, `updatedAt`. NotFound "Mata pelajaran tidak ditemukan.".

### 6.4 Memberships (penempatan siswa) — `/memberships`

| Method | Path | Admin | Request | Success / Errors |
|---|---|---|---|---|
| `GET` | `/memberships` | ya | query list admin | `{ "data": { "items": [ClassStudent+class+student], "meta" } }`; filter opsional `classId` |
| `POST` | `/memberships` | ya | body `{ "classId": int>0, "studentId": int>0 }` | `{ "data": ClassStudent+class+student }` (isActive selalu `true`) |
| `PATCH` | `/memberships/:id` | ya | params id; body `{ "isActive": boolean }` | `{ "data": ClassStudent }`; `404` "Penempatan siswa tidak ditemukan." |

Query list membership (`membershipListSchema`): strict, `page`(1)/`limit`(20,max100)/
`sort`(`createdAt` default)/`order`(`desc` default) + `classId` (filter penempatan
per kelas).

- `404 NOT_FOUND` "Siswa tidak ditemukan." (studentId harus user ber-role
  STUDENT) / "Kelas tidak ditemukan.".
- `409 ACTIVE_CLASS_MEMBERSHIP_EXISTS` "Siswa sudah memiliki kelas aktif."
  (satu kelas aktif per siswa — keputusan D2; perpindahan = nonaktifkan dulu).
- `ClassStudent`: `id`, `classId`, `studentId`, `isActive`, `createdAt`,
  `updatedAt`.

### 6.5 Assignments (penugasan guru) — `/assignments`

| Method | Path | Auth | Request | Success / Errors |
|---|---|---|---|---|
| `GET` | `/assignments` | TEACHER only | — | `{ "data": [ Assignment+class.educationLevel+subject ] }` — hanya assignment aktif milik sendiri |
| `GET` | `/assignments/manage` | ADMIN only | query list admin | `{ "data": { "items": [Assignment+class+subject+teacher], "meta" } }`; filter opsional `teacherId` |
| `POST` | `/assignments` | ADMIN only | body `{ "teacherId", "classId", "subjectId": int>0 }` | `{ "data": Assignment+class+subject+teacher }` (isActive true) |
| `PATCH` | `/assignments/:id` | ADMIN only | params id; body `{ "isActive": boolean }` | `{ "data": TeacherAssignment }`; `404` "Penugasan tidak ditemukan." |

Query list assignment admin (`assignmentListSchema`): strict, `page`(1)/
`limit`(20,max100)/`sort`(`createdAt` default)/`order`(`desc` default) +
`teacherId` (filter penugasan per guru).

- `404 NOT_FOUND`: "Guru tidak ditemukan." / "Kelas tidak ditemukan." /
  "Mata pelajaran tidak ditemukan."
- `409 DUPLICATE_ASSIGNMENT` "Penugasan aktif sudah ada." (triplet
  teacher/class/subject aktif unik).
- `TeacherAssignment`: `id`, `teacherId`, `classId`, `subjectId`, `isActive`,
  `createdAt`, `updatedAt`.

### 6.6 My Classes (siswa) — `/my-classes`

| Method | Path | Auth | Success |
|---|---|---|---|
| `GET` | `/my-classes` | STUDENT only | `{ "data": [ ClassStudent+class.educationLevel ] }` — hanya membership aktif milik sendiri |

`403 FORBIDDEN` "Hanya siswa yang dapat melihat kelas aktifnya." untuk role
lain.

---

## 7. Users (manajemen admin) — `/api/v1/users`

Semua route `[authenticate, authorize('ADMIN')]`.

### 7.1 `GET /api/v1/users`

- Query (`userListSchema`) — strict: `page`(1)/`limit`(20,max100)/
  `sort`(`name`|`createdAt`)/`order`(`asc`|`desc`), `role`
  (`STUDENT`|`TEACHER`|`ADMIN`) opsional, `search` (≤100, cocok `username` ATAU
  `name`, contains) opsional.
- Success `200`: `{ "data": { "items": [publicUser], "meta": {...} } }`.

### 7.2 `POST /api/v1/users`

- Body (`createUserSchema`) — strict:
  - `username`: 1–100; `password`: 8–128; `role`: enum; `name`: 1–150
  - `email?` (nullable, email ≤255), `phone?` (nullable ≤30), `birthDate?`
    (nullable date)
  - `studentNumber?` (1–50) dan `educationLevelId?` — wajib keduanya jika
    `role = STUDENT`, selain itu `400 VALIDATION_ERROR` "Profil siswa
    membutuhkan nomor siswa dan jenjang."
- Success `200`: `{ "data": <publicUser> }`. TEACHER dibuat dengan profil kosong;
  ADMIN tanpa profil.
- Errors: `400 VALIDATION_ERROR`, `409 DUPLICATE_USERNAME` "Username sudah
  digunakan.", `403 FORBIDDEN`.

### 7.3 `PATCH /api/v1/users/:id/password`

- Auth: ADMIN.
- Params: `id` int > 0 (coerce). Body (`resetUserPasswordSchema`) — strict:
  `password` 8–128 dan `passwordConfirmation` (harus sama).
- Success `200`: `{ "data": { "message": "Password berhasil direset." } }`.
- Errors: `404 NOT_FOUND` "Pengguna tidak ditemukan." — termasuk jika target
  **Admin** (password admin tidak dapat direset lewat endpoint ini, keputusan
  D6).
- Password admin: gunakan forgot-password.

---

## 8. Banners — `/api/v1/banners`

### 8.1 `GET /api/v1/banners` (banner aktif)

- Auth: wajib, semua role (muncul di beranda yang ter-autentikasi).
- Query (`activeBannerQuerySchema`) — strict: `at?` (date coerce, default
  waktu server).
- Success `200`: `{ "data": [ Banner ] }` — hanya `isActive: true` dengan
  `displayStartAt <= at` (atau null) dan `displayEndAt >= at` (atau null),
  urut `createdAt desc`.

### 8.2 `GET /api/v1/banners/manage`

- Auth: ADMIN. Success `200`: `{ "data": { "items": [ Banner ], "meta" } }` —
  semua banner, urut `createdAt desc`.
- Query (`bannerListSchema`) — strict: `page`(1)/`limit`(20,max100)/
  `sort`(`createdAt` default)/`order`(`desc` default) + filter
  `isActive?` (`true`|`false`) dan `search?` (title contains, ≤100).

### 8.3 `POST /api/v1/banners`

- Auth: ADMIN.
- Body (`bannerSchema`) — strict:
  - `title`: 1–200 (wajib)
  - `imageUrl?`: URL ≤500, nullable
  - `content?`: ≤10000, nullable
  - `isActive?`: boolean, default `false`
  - `displayStartAt?`, `displayEndAt?`: date, nullable — jika keduanya ada
    wajib `displayEndAt > displayStartAt`
  - superRefine: `imageUrl` ATAU `content` wajib ada.
- Success `200`: `{ "data": Banner }` dengan `createdById` = admin pengirim.

### 8.4 `PATCH /api/v1/banners/:id`

- Auth: ADMIN. Params `id`; body (`bannerPatchSchema`) partial dari field di
  atas. Service menggabungkan dengan nilai tersimpan lalu memvalidasi urutan
  window: jika hasil merge menimbulkan `displayEndAt <= displayStartAt` →
  `400 VALIDATION_ERROR` "Waktu akhir harus setelah waktu mulai."
  (fieldError `displayEndAt`).
- Success `200`: `{ "data": Banner }`; `404 NOT_FOUND` "Banner tidak ditemukan."

### 8.5 `DELETE /api/v1/banners/:id`

- Auth: ADMIN. Success `200`: `{ "data": <deleted row> }`; `404 NOT_FOUND`
  "Banner tidak ditemukan."

---

## 9. Attendance Sessions — `/api/v1/attendance-sessions`

### 9.1 `POST /api/v1/attendance-sessions`

- Auth: `[authenticate, authorize('TEACHER')]`.
- Body (`attendanceSessionSchema`) — strict:
  - `assignmentId`: int > 0
  - `sessionDate`: string `YYYY-MM-DD` (regex)
  - `startAt`, `endAt`: ISO 8601 **dengan offset** (wajib `datetime({offset:true})`)
  - `timezone`: string ≤100 — **wajib sama persis** dengan `SCHOOL_TIMEZONE`
- Rules service:
  - Assignment wajib milik guru dan aktif →
    `403 ASSIGNMENT_FORBIDDEN` "Penugasan tidak aktif atau bukan milik Anda."
  - `timezone` tidak valid / beda dari sekolah →
    `400 INVALID_TIMEZONE` (fieldError `timezone`)
  - `endAt <= startAt` → `400 INVALID_TIME_RANGE` (fieldError `endAt`)
  - `sessionDate` tidak sama dengan tanggal kalender sekolah dari start/end →
    `400 INVALID_SESSION_DATE` (fieldError `sessionDate`)
  - Parsing gagal → `400 INVALID_DATETIME`
- Duplikat (assignment + tanggal + pasangan waktu) → **`409
  DUPLICATE_ATTENDANCE_SESSION`** "Sesi absensi untuk pertemuan tersebut sudah
  ada." (keputusan D3; tidak mengembalikan sesi existing).
- Success `200`: `{ "data": sessionMetadata }`. QR dibuat otomatis (payload
  opaque 43-char, tidak ada PII) dan **tidak** dikembalikan di response ini —
  ambil lewat `GET /:id/qr`.

Contoh:

```http
POST /api/v1/attendance-sessions
Content-Type: application/json
x-csrf-token: <csrf_token>

{
  "assignmentId": 60,
  "sessionDate": "2026-09-17",
  "startAt": "2026-09-17T08:00:00+07:00",
  "endAt": "2026-09-17T09:00:00+07:00",
  "timezone": "Asia/Jakarta"
}
```

```json
{
  "data": {
    "id": 10, "assignmentId": 60, "classId": 30, "className": "XII IPA 1",
    "subjectId": 40, "subjectName": "Matematika",
    "sessionDate": "2026-09-17T00:00:00.000Z",
    "startAt": "2026-09-17T01:00:00.000Z",
    "endAt": "2026-09-17T02:00:00.000Z",
    "createdAt": "2026-09-16T02:00:00.000Z"
  }
}
```

### 9.2 `GET /api/v1/attendance-sessions`

- Auth: `[authenticate, authorize('ADMIN','TEACHER')]`.
- ADMIN: semua sesi. TEACHER: hanya sesi dari **assignment aktif miliknya**.
- Success `200`: `{ "data": [ sessionMetadata, ... ] }`. **Tidak terpaginasi**;
  urut `sessionDate desc, startAt desc`.
- `403 FORBIDDEN` untuk role lain.

### 9.3 `GET /api/v1/attendance-sessions/:id/qr`

- Auth: `[authenticate, authorize('ADMIN','TEACHER')]`. Params `id` int > 0.
- TEACHER: hanya sesi miliknya (assignment aktif); ADMIN: semua.
- Success `200`: `{ "data": { ...sessionMetadata, "qrPayload": "43-char-opaque" } }`.
- Errors: `404 NOT_FOUND` "Sesi absensi tidak ditemukan." (termasuk saat bukan
  milik guru — tidak membocorkan keberadaan), `400 VALIDATION_ERROR` (id).

Sesi yang assignment-nya sudah dinonaktifkan tetap tidak muncul untuk guru.

---

## 10. Scan — `POST /api/v1/attendance-scans`

- Auth: `[authenticate, authorize('STUDENT')]`. Rate limit: 120/60 detik
  (`SCAN_RATE_LIMIT`).
- Body (`attendanceScanSchema`) — strict: `qrPayload`: string 1–255.
- Alur validasi service (urutan tetap):
  1. Format payload harus cocok `/^[A-Za-z0-9_-]{43}$/` (opaque base64url
     32-byte) → `400 INVALID_QR_PAYLOAD` "QR Code tidak valid." (sebelum lookup).
  2. Sesi tidak ditemukan **atau assignment nonaktif** →
     `404 ATTENDANCE_SESSION_NOT_FOUND` "Sesi absensi tidak ditemukan."
  3. Siswa bukan anggota aktif kelas sesi →
     `403 CLASS_MEMBERSHIP_REQUIRED` "Anda bukan anggota kelas sesi ini."
  4. Waktu server `now()` (bukan waktu client):
     - sebelum `startAt - 15 menit` atau sesudah `endAt` →
       `409 ATTENDANCE_WINDOW_CLOSED` "Sesi absensi belum dibuka atau sudah
       ditutup." — **tidak membuat record**.
     - `<= startAt + 15 menit` → `HADIR`, `lateMinutes: 0`
     - setelah itu sampai `endAt` → `TERLAMBAT`,
       `lateMinutes = floor((waktuScan - startAt) / 1 menit)`
  5. Insert `attendance_records` dalam transaction. Unik `(session_id,
     student_id)` = perlindungan terakhir: bila `P2002`, re-read record existing
     dan kembalikan idempotent.
- Success `200`: `{ "data": scanMetadata }`.
  - Pertama kali: `duplicate: false`.
  - Duplikat (sequential atau concurrent): `200` dengan `duplicate: true`,
    `id`/status/time record yang sudah ada — **bukan error, bukan record
    kedua**.
- Errors lain: `400 VALIDATION_ERROR` (body strict juga menolak field seperti
  `scannedAt` dari client), `401`, `403`, `404`, `409`, `429 RATE_LIMITED`.

Contoh:

```http
POST /api/v1/attendance-scans
Content-Type: application/json
x-csrf-token: <csrf_token>

{ "qrPayload": "Pm8kQ3ZxR0VhY0ZvTzhYZVdITVE1U0ltTW9UV0l4d1FB" }
```

Boundary yang dikunci (waktu server):

| Waktu scan | Status | lateMinutes |
|---|---|---|
| `startAt - 15:00` | HADIR | 0 |
| `startAt` | HADIR | 0 |
| `startAt + 15:00` | HADIR | 0 |
| `startAt + 15:00.001` | TERLAMBAT | 15 |
| `endAt` | TERLAMBAT | `endAt - startAt` (menit) |

---

## 11. History, Detail Kelas, dan Report Admin — `/api/v1/attendance` & `/api/v1/reports`

Semua memakai `attendanceReportQuerySchema` (strict):

- `from?`, `to?`: date (coerce); superRefine `to > from` (fieldError `to`)
- `status?`: `HADIR` | `TERLAMBAT` | `TIDAK_HADIR`
- `classId?`, `assignmentId?`: int > 0
- `page`(1), `limit`(20, max 100), `sort`(`sessionDate`|`scannedAt`|`status`,
  default `sessionDate`), `order`(`desc` default |`asc`)
- Field tak dikenal (mis. `studentId`) → `400 VALIDATION_ERROR`; ini juga yang
  mencegah siswa melebarkan scope lewat query.

Perilaku bersama:

- Item = `reportMetadata` (lihat 2.4), termasuk `TIDAK_HADIR` computed saat
  dibaca.
- Pair `(sessionId, studentId)` selalu keluar **satu** baris: record scan ATAU
  `TIDAK_HADIR` computed — tidak ada duplikasi.
- Scope diterapkan sebelum query:
  - Siswa → hanya kelas aktif miliknya (`studentId` dari token, tidak bisa
    diganti).
  - Guru → hanya **classId** yang diminta + assignment aktif miliknya.
  - Admin → global.

### 11.1 `GET /api/v1/attendance/today` — jadwal siswa "bisa absen" hari ini

- Auth: STUDENT only. Tanpa parameter query. Keputusan produk: D10
  (docs/DECISIONS.md).
- Mengembalikan sesi pada **tanggal kalender sekolah hari ini** (dihitung dari
  waktu server + `SCHOOL_TIMEZONE`; bukan jam client) pada kelas aktif siswa,
  hanya assignment aktif, urut `startAt` naik.
- Success `200`: `{ "data": [ scheduleItem, ... ] }` (array, tidak terpaginasi).
  `scheduleItem`:

  ```json
  {
    "id": 10,
    "assignmentId": 60,
    "classId": 30,
    "className": "XII IPA 1",
    "subjectId": 40,
    "subjectName": "Matematika",
    "teacherName": "Guru Demo",
    "sessionDate": "2026-09-17T00:00:00.000Z",
    "startAt": "2026-09-17T01:00:00.000Z",
    "endAt": "2026-09-17T02:00:00.000Z",
    "createdAt": "2026-09-16T02:00:00.000Z",
    "windowStatus": "BISA_ABSEN",
    "attendanceStatus": null,
    "scanned": false
  }
  ```

- Aturan status dihitung server (bukan client):
  - `windowStatus`: `BELUM_DIBUKA` (sebelum `startAt - 15 menit`) |
    `BISA_ABSEN` (`startAt - 15 menit` s.d. `endAt`, inklusif) | `SELESAI`
    (setelah `endAt`).
  - `attendanceStatus`: `HADIR`/`TERLAMBAT` dari record yang sudah ada; atau
    `TIDAK_HADIR` computed bila sesi sudah selesai tanpa record (D4); atau
    `null` bila belum selesai dan belum discan.
  - `scanned`: `true` bila siswa sudah memiliki record untuk sesi tersebut.
- Errors: `401 UNAUTHENTICATED`, `403 FORBIDDEN` "Hanya siswa yang dapat melihat
  jadwal hari ini." untuk role lain.

### 11.2 `GET /api/v1/attendance/history` — riwayat siswa

- Auth: STUDENT only.
- Success `200`: `{ "data": { "items": [reportMetadata], "meta": {...} } }`.
- Error role lain: `403 FORBIDDEN` "Hanya siswa yang dapat melihat riwayat
  pribadi."

### 11.3 `GET /api/v1/attendance/classes/:id` — detail kehadiran kelas (guru)

- Auth: TEACHER only. Params `id` = classId (int > 0).
- Success `200`: `{ "data": { "items": [reportMetadata], "meta": {...} } }`.
  Guru tanpa assignment untuk kelas itu → `items: []` (empty, bukan 403).
- Error role lain: `403 FORBIDDEN` "Hanya guru yang dapat melihat detail
  kehadiran kelas."

### 11.4 `GET /api/v1/reports/attendance` — laporan global (admin)

- Auth: ADMIN only.
- Success `200`: `{ "data": { "items": [reportMetadata], "meta": {...} } }`.
- Tanpa data: `items: []`, `meta.total: 0`, `totalPages: 0` (HTTP `200`).
- Error role lain: `403 FORBIDDEN` "Hanya admin yang dapat melihat laporan
  global."

### 11.5 `GET /api/v1/reports/attendance/export` — export XLSX

- Auth: `[authenticate, authorize('ADMIN','TEACHER')]`.
- Query: `attendanceReportQuerySchema` (pagination diabaikan untuk export —
  paksa `page=1`, `limit=100`, `sort=sessionDate`, `order=desc`; filter lain
  tetap berlaku).
- TEACHER: export terbatas assignment aktif miliknya (dan `classId` jika
  diberikan); ADMIN: global.
- Success `200` (binary):
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="laporan-kehadiran-{from}-{to}.xlsx"`
    dengan `from`/`to` dalam `YYYYMMDD`, atau `awal`/`akhir` bila filter tidak
    diberikan.
  - Workbook sheet `Kehadiran`, kolom (keputusan D7): `Tanggal sesi`,
    `Kelas`, `Mata pelajaran`, `Nama siswa`, `NIM`, `Status`, `Menit
    terlambat`, `Waktu scan`. Tanggal diformat locale `id-ID` di timezone
    sekolah.
- Errors:
  - `403 FORBIDDEN` "Anda tidak memiliki akses export laporan."
  - `404 NO_DATA_TO_EXPORT` "Tidak ada data untuk diekspor." (JSON, empty
    export — keputusan D7)
  - `429 EXPORT_BUSY` "Terlalu banyak export sedang diproses. Silakan coba
    lagi nanti." (concurrency limit = 2)
  - `400 VALIDATION_ERROR` (query tidak dikenal / rentang invalid)

---

## 12. Ringkasan Matriks Endpoint

| Method | Path | Auth | Role | Kategori |
|---|---|---|---|---|
| `GET` | `/health/live` | — | — | Health |
| `GET` | `/health/ready` | — | — | Health |
| `POST` | `/api/v1/auth/login` | — | semua | Auth |
| `POST` | `/api/v1/auth/logout` | — | semua | Auth |
| `POST` | `/api/v1/auth/forgot-password` | — | semua | Auth |
| `GET` | `/api/v1/me` | cookie | semua | Profil |
| `PATCH` | `/api/v1/me` | cookie | semua | Profil |
| `GET` | `/api/v1/academic/education-levels` | cookie | ADMIN | Academic |
| `POST` | `/api/v1/academic/education-levels` | cookie | ADMIN | Academic |
| `PATCH` | `/api/v1/academic/education-levels/:id` | cookie | ADMIN | Academic |
| `DELETE` | `/api/v1/academic/education-levels/:id` | cookie | ADMIN | Academic |
| `GET` | `/api/v1/academic/classes` | cookie | ADMIN, TEACHER* | Academic |
| `POST` | `/api/v1/academic/classes` | cookie | ADMIN | Academic |
| `PATCH` | `/api/v1/academic/classes/:id` | cookie | ADMIN | Academic |
| `DELETE` | `/api/v1/academic/classes/:id` | cookie | ADMIN | Academic |
| `GET` | `/api/v1/academic/subjects` | cookie | ADMIN, TEACHER* | Academic |
| `POST` | `/api/v1/academic/subjects` | cookie | ADMIN | Academic |
| `PATCH` | `/api/v1/academic/subjects/:id` | cookie | ADMIN | Academic |
| `DELETE` | `/api/v1/academic/subjects/:id` | cookie | ADMIN | Academic |
| `GET` | `/api/v1/academic/memberships` | cookie | ADMIN | Academic |
| `POST` | `/api/v1/academic/memberships` | cookie | ADMIN | Academic |
| `PATCH` | `/api/v1/academic/memberships/:id` | cookie | ADMIN | Academic |
| `GET` | `/api/v1/academic/assignments` | cookie | TEACHER | Academic |
| `GET` | `/api/v1/academic/assignments/manage` | cookie | ADMIN | Academic |
| `POST` | `/api/v1/academic/assignments` | cookie | ADMIN | Academic |
| `PATCH` | `/api/v1/academic/assignments/:id` | cookie | ADMIN | Academic |
| `GET` | `/api/v1/academic/my-classes` | cookie | STUDENT | Academic |
| `GET` | `/api/v1/users` | cookie | ADMIN | Users |
| `POST` | `/api/v1/users` | cookie | ADMIN | Users |
| `PATCH` | `/api/v1/users/:id/password` | cookie | ADMIN | Users |
| `GET` | `/api/v1/banners` | cookie | semua | Banner |
| `GET` | `/api/v1/banners/manage` | cookie | ADMIN | Banner |
| `POST` | `/api/v1/banners` | cookie | ADMIN | Banner |
| `PATCH` | `/api/v1/banners/:id` | cookie | ADMIN | Banner |
| `DELETE` | `/api/v1/banners/:id` | cookie | ADMIN | Banner |
| `POST` | `/api/v1/attendance-sessions` | cookie | TEACHER | Sesi |
| `GET` | `/api/v1/attendance-sessions` | cookie | ADMIN, TEACHER* | Sesi |
| `GET` | `/api/v1/attendance-sessions/:id/qr` | cookie | ADMIN, TEACHER* | QR |
| `POST` | `/api/v1/attendance-scans` | cookie | STUDENT | Scan |
| `GET` | `/api/v1/attendance/history` | cookie | STUDENT | Riwayat |
| `GET` | `/api/v1/attendance/classes/:id` | cookie | TEACHER* | Detail kelas |
| `GET` | `/api/v1/attendance/today` | cookie | STUDENT | Jadwal hari ini |
| `GET` | `/api/v1/reports/attendance` | cookie | ADMIN | Report global |
| `GET` | `/api/v1/reports/attendance/export` | cookie | ADMIN, TEACHER* | Export |

`*` = TEACHER dibatasi assignment aktif miliknya (scope di service, bukan
klien).

---

## 13. Catatan Antarmuka Frontend (berdasarkan frontend/GUIDE.md)

- Axios tunggal di `lib/apiClient.js`, base `VITE_API_BASE_URL`, kirim cookie
  (`withCredentials`) dan `x-csrf-token` pada mutasi.
- Export dipanggil sebagai binary; nama file dari header `Content-Disposition`.
- Mapping `code → pesan` terpusat; fallback tidak menampilkan stack/detail DB.
- 401 → hapus state user, arahkan ke `/login`; 403 → halaman akses ditolak.
- Label UI boleh berbeda dari enum API; mapping terpusat `HADIR`,
  `TERLAMBAT`, `TIDAK_HADIR`.
- **Gap yang diketahui (sudah ditutup):** endpoint `GET /api/v1/attendance/today`
  (jadwal siswa "bisa absen" hari ini) kini tersedia sesuai keputusan D10
  (docs/DECISIONS.md). Frontend memakai endpoint ini untuk `Absensi hari ini`,
  `Jadwal terdekat`, dan badge `Bisa absen`/`Belum dibuka`/`Selesai` — tanpa
  menghitung status dari jam lokal.

---

## Appendix: Contract Consistency Check

Metode verifikasi yang dijalankan saat dokumen ini dibuat:

1. **Enumeration rute nyata.** Stack router dari `createApp({ mockPrisma, env
   test })` di-traverse dan memproduksi daftar pasangan method + path berikut
   (subset yang tertangkap, digabung dengan pemetaan mount dari
   `src/routes/index.js`):
   - `/health/live`, `/health/ready`
   - `/api/v1/auth/login|logout|forgot-password`
   - `/api/v1/me` (GET, PATCH)
   - `/api/v1/academic/education-levels` (+`:id`), `classes` (+`:id`),
     `subjects` (+`:id`), `memberships` (+`:id`), `assignments` (+`:id`),
     `my-classes`
   - `/api/v1/users` (GET, POST), `/api/v1/users/:id/password`
   - `/api/v1/banners` (GET, POST), `/manage`, `/:id` (PATCH, DELETE)
   - `/api/v1/attendance-sessions` (GET, POST), `/:id/qr`
   - `/api/v1/attendance-scans` (POST)
   - `/api/v1/attendance/history`, `/api/v1/attendance/classes/:id`,
     `/api/v1/attendance/today`
   - `/api/v1/reports/attendance`, `/api/v1/reports/attendance/export`
   Tidak ada path tambahan di luar tabel Section 12. Tidak ada metode yang
   terlewat.
2. **Kecocokan skema Zod.** Setiap `src/schemas/*.js` dibaca dan dibandingkan
   dengan request schema di dokumen ini (field, type, batas, strict, superRefine).
3. **Kecocokan error code service.** Setiap `AppError(status, code, message)`
   di `src/services/*` dan `src/middleware/*` dicocokkan ke tabel error per
   endpoint. Termasuk status khusus: `408 REQUEST_TIMEOUT` (middleware timeout),
   `503 NOT_READY` (health), `429 EXPORT_BUSY` (semaphore export), `429
   RATE_LIMITED` (rate limit global).
4. **Keputusan terkunci.** Perilaku dikonfirmasi terhadap `docs/DECISIONS.md`:
   `TIDAK_HADIR` computed (D4), sesi duplikat `409` (D3), satu kelas aktif
   (D2), forgot-password untuk semua role termasuk Admin (D8), password 8–128
   dan reset manual tanpa target Admin (D6), nama file export
   `laporan-kehadiran-{from}-{to}.xlsx` + `404 NO_DATA_TO_EXPORT` (D7),
   timezone UTC + configurable (D1).
5. **Test.** `npm test` (unit + integration) di `backend/` hijau: 11 file,
   60 test. Menutup login/logout/forgot, role rejection, create session,
   invalid/duplicate scan (sequential + concurrent + P2002), boundary
   `-15/0/+15` menit, history scope, teacher class detail scope, admin global
   report, dan export workbook (kolom + nama file + empty `NO_DATA_TO_EXPORT`).
   `npm run lint`: tanpa error.

### Perbedaan yang ditemukan dan perbaikan

- `docs/openapi.yaml` tertinggal dari implementasi di beberapa titik (status
  `201` pada create, `204` pada logout, `500` pada `/health/ready`, skema
  request/response yang tidak lengkap, security pada `GET /banners`). Karena
  implementasi + test adalah acuan yang benar (kontrak HTTP yang berjalan
  adalah `200` untuk create dan logout), **`docs/openapi.yaml` diselaraskan**
  dengan dokumen ini dan implementasi.
- Hasil akhir: `docs/API_CONTRACT.md` ⟷ `src/routes/**` ⟷
  `src/schemas/**` ⟷ `src/services/**` konsisten dan didukung test.

### Open items / risiko yang dicatat tanpa mengubah kontrak

1. **`GET /api/v1/attendance/today`** (jadwal siswa "bisa absen" hari ini)
   ditambahkan dan dikunci lewat keputusan D10 (docs/DECISIONS.md). Tanpa
   parameter query; hanya tanggal kalender sekolah hari ini. Pebaruan jadi
   open untuk rentang multi-hari ("Besok") bila product meminta.
2. **Seed demo session** (`qrPayload: "dev-session-matematika-20260917"`)
   tidak memenuhi format opaque `/^[A-Za-z0-9_-]{43}$/`, sehingga **tidak dapat
   discan** lewat endpoint scan (akan `400 INVALID_QR_PAYLOAD`). Sesi QR lain
   yang dibuat lewat API selalu valid karena dibuat `createQrPayload()`.
   Disarankan memperbaiki seed sebelum fase demo frontend.
3. **Email duplikat tidak tertangani secara eksplisit** pada `PATCH /me`,
   `POST /users`, dan forgot-password bila email unik dilanggar (Prisma
   `P2002` → saat ini jatuh ke `500 INTERNAL_SERVER_ERROR`). Diluar scope
   kontrak; buka issue/migration test bila ingin menetapkan `409`.
4. `GET /api/v1/users` search cocok `username` ATAU `name`. Listing
   penempatan/assignment untuk admin memakai `GET /memberships` (filter
   `classId`) dan `GET /assignments/manage` (filter `teacherId`) yang
   ditambahkan bersama F5 (lihat §6.4 dan §6.5).