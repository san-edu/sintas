# Backend Operations

## Environment and startup

Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and `SCHOOL_TIMEZONE` from the deployment secret/configuration store. Production rejects the development JWT secret and localhost CORS. `REQUEST_TIMEOUT_MS` defaults to 10 seconds and `SCAN_RATE_LIMIT` defaults to 120 requests per IP per minute; use a shared rate-limit store when running more than one instance.

Run migrations before routing traffic:

```bash
npm run prisma:generate
npx prisma migrate deploy
```

Run `npm run prisma:seed` only in non-production development environments. Never run `prisma migrate reset` or the seed against production.

## Backup and migration rollback

1. Take and verify a MySQL backup before applying a migration. Record the backup timestamp and migration identifier.
2. Apply migrations with `prisma migrate deploy`, then run readiness and smoke tests before opening traffic.
3. Prefer a forward fix migration. Do not edit an applied migration. If rollback is required, stop writes, restore the verified backup into an isolated database, validate foreign keys and attendance counts, then switch traffic through the deployment platform.
4. Keep backups according to the school's approved retention policy and test restore at least once per release cycle.

The application does not automatically delete attendance records in the MVP. Destructive cleanup requires a separately reviewed operational procedure.

## Burst scan test requirement

Before production traffic, run a MySQL-backed load test covering 06:45-07:00 with valid scans, retries, duplicate scans, invalid QR payloads, and concurrent scans for the same student/session. Measure response time, 429 rate, duplicate/conflict count, database errors, and pool saturation. The repository's mocked integration tests do not prove transaction isolation or pool exhaustion; those remain deployment validation requirements.
