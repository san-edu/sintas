# AGENTS.md

Project "SINTAS" — attendance SPA (STUDENT/TEACHER/ADMIN) for a single school. All product/architecture docs are in **Indonesian**; user-facing errors are also Indonesian. Status enums stay `HADIR`/`TERLAMBAT`/`TIDAK_HADIR`.

## Layout & commands

Two independent npm packages, **no root package.json, no workspaces, no typechecking (JS only)**. Run every command from inside `backend/` or `frontend/` with the `workdir` set, never from repo root. Root only has `backend/`, `frontend/`, `docs/`.

Backend (`backend/`, Express 5 + Prisma + MySQL + Vitest, ESM `"type":"module"`):
- `npm run dev` — `node --watch src/server.js` (port 3000)
- `npm run test:unit` / `npm run test:integration` / `npm test` (unit + integration together)
- `npm run lint` — `eslint .`
- DB: see below

Frontend (`frontend/`, React 19 + Vite + Tailwind 4):
- `npm run dev` (port 5173), `npm run lint`, `npm run build`
- No test stack installed yet.

## Backend architecture (non-negotiable)

- `src/app.js` exports `createApp({ prisma, logger, env })` — dependency-injected factory, **no `app.listen` here**. `src/server.js` owns startup + graceful shutdown. `createApp` reads `getEnv()` if no env is passed.
- All routers are factories (`createXRouter({ prisma, env })`) registered once in `src/routes/index.js`.
- Layering: route → middleware → controller → service → repository → database. Controllers are thin; business rules live in services; pure domain + zod live in `src/domain/` and `src/schemas/`. Put attendance-status logic in `src/domain/attendanceStatus.js`, not in controllers.
- Env is Zod-validated in `src/config/env.js`. `DATABASE_URL` is required. Production rejects the dev JWT secret and localhost CORS origins. `.env` is gitignored (copy `.env.example`).
- Auth: login sets an **HttpOnly cookie** (`AUTH_COOKIE_NAME`, default `auth_token`); JWT is signed with `jose`. No localStorage tokens. CSRF middleware (GET requests mint a `csrf_token` cookie; state-changing requests with an Origin + auth cookie need `x-csrf-token` header) — keep it intact when touching auth.
- Error contract everywhere: `{ error: { code, message, fieldErrors? } }` with 400/401/403/404/409/429. Duplicate session → `409 DUPLICATE_ATTENDANCE_SESSION`. Duplicate scan → `200` returning the existing record with `duplicate: true` (idempotent, enforced by unique `(session_id, student_id)`).

## Time & attendance rules

- Store all timestamps as **UTC**; `SCHOOL_TIMEZONE` (IANA, default `Asia/Jakarta`) converts at the service/response boundary.
- Scan window opens `start_at - 15 min`, closes `end_at`. `<= start_at + 15 min` → `HADIR` (lateMinutes 0); after that until `end_at` → `TERLAMBAT`; outside the window → rejected without a record.
- `TIDAK_HADIR` is **computed on read** (never stored); `attendance_records` only contains scans.
- Scan time always comes from the server — never trust a client timestamp. Boundary tests freeze time via `vi.useFakeTimers` + `vi.setSystemTime`.

## Testing (backend)

- **No live MySQL is needed to run the suite.** Even "integration" tests inject a mock `prisma` object into `createApp`; "integration" means HTTP-through-the-factory. Real-DB concerns (transaction isolation, pool saturation, burst-load) are explicitly out of scope here — see `backend/OPERATIONS.md`.
- No vitest config file; suite roots are `tests/unit` and `tests/integration`.
- Guard rules: never break the scan-path constraint (no banner/report/export queries in a scan), keep duplicate/concurrent scan idempotency tests green.

## Database / migrations / seed

Schema changes flow via Prisma from `backend/prisma/schema.prisma`:
- dev: `npx prisma migrate dev` then restart dev server; `npx prisma migrate deploy` for non-dev environments
- `npm run prisma:seed` is idempotent, dev-only, refuses `NODE_ENV=production`; seeds three demo users (`student.demo`, `teacher.demo`, `admin.demo` — password via `SEED_PASSWORD`, default `Sintas-Dev-Only-ChangeMe`) and one demo session.
- Destructive dev reset: `npx prisma migrate reset --force` (+ reseed). Never run reset/seed against production.

## Frontend

- Still a bare Vite template (`src/App.jsx` is a placeholder). `frontend/GUIDE.md` describes the *target* structure and stack (react-router, react-query, axios, zustand, react-hook-form+zod, headlessui, lucide-react, qr-scanner) that is **not installed yet** — stand it up before building features. Don't add Redux, localStorage token storage, dynamic QR, or Excel libs without a new architecture decision.
- API base comes from `VITE_API_BASE_URL`; send credentials as cookies (`withCredentials`) to match the backend.

## Docs that must be read before changing behavior

`backend/GUIDE.md`, `frontend/GUIDE.md`, `docs/DECISIONS.md` (locked choices: one active class per student, computed TIDAK_HADIR, duplicate session → 409, banner fields, password 8–128, export filename `laporan-kehadiran-{from}-{to}.xlsx` / empty export `404 NO_DATA_TO_EXPORT`, admin shares login+forgot-password), `docs/PRD.md`, and `docs/openapi.yaml` (keep in sync with routes). `docs/PROMPT_GUIDE.md` contains the phased build plan and checkpoints.

Do not add features beyond the PRD, and don't silently guess product decisions — log them in `docs/DECISIONS.md` instead.