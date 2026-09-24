import { describe, expect, it } from 'vitest'
import { isOpaqueQrPayload } from '../../src/domain/attendanceQr.js'
import { normalizeSessionTimes } from '../../src/domain/attendanceSession.js'

const valid = {
  sessionDate: '2026-09-17',
  startAt: '2026-09-17T08:00:00+07:00',
  endAt: '2026-09-17T09:00:00+07:00',
  timezone: 'Asia/Jakarta',
}

describe('attendance session domain', () => {
  it('normalizes valid local session times to Date values', () => {
    const result = normalizeSessionTimes(valid, 'Asia/Jakarta')
    expect(result.sessionDate.toISOString()).toBe('2026-09-17T00:00:00.000Z')
    expect(result.startAt.toISOString()).toBe('2026-09-17T01:00:00.000Z')
  })

  it('rejects an invalid time range and mismatched timezone', () => {
    expect(() => normalizeSessionTimes({ ...valid, endAt: valid.startAt }, 'Asia/Jakarta')).toThrow('Waktu selesai harus setelah waktu mulai')
    expect(() => normalizeSessionTimes(valid, 'Asia/Makassar')).toThrow('Timezone harus sesuai timezone sekolah')
  })

  it('accepts only opaque 32-byte base64url payloads', () => {
    expect(isOpaqueQrPayload('a'.repeat(43))).toBe(true)
    expect(isOpaqueQrPayload('session-60-teacher-2')).toBe(false)
    expect(isOpaqueQrPayload(`${'a'.repeat(42)}!`)).toBe(false)
  })
})
