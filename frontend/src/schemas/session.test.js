import { describe, expect, it } from 'vitest'
import { sessionFormSchema, toSessionPayload } from './session'

describe('sessionFormSchema', () => {
  const valid = {
    assignmentId: '60',
    sessionDate: '2026-09-17',
    start: '08:00',
    end: '09:00',
  }

  it('menerima nilai yang valid', () => {
    expect(sessionFormSchema.safeParse(valid).success).toBe(true)
  })

  it('menolak jam selesai yang tidak setelah jam mulai', () => {
    const result = sessionFormSchema.safeParse({ ...valid, start: '10:00', end: '09:00' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(['end'])
  })

  it('menolak tanggal non-ISO', () => {
    const result = sessionFormSchema.safeParse({ ...valid, sessionDate: '17-09-2026' })
    expect(result.success).toBe(false)
  })
})

describe('toSessionPayload', () => {
  it('menyusun payload kontrak dengan offset timezone sekolah', () => {
    expect(
      toSessionPayload({
        assignmentId: '60',
        sessionDate: '2026-09-17',
        start: '08:00',
        end: '09:00',
      }),
    ).toEqual({
      assignmentId: 60,
      sessionDate: '2026-09-17',
      startAt: '2026-09-17T08:00:00+07:00',
      endAt: '2026-09-17T09:00:00+07:00',
      timezone: 'Asia/Jakarta',
    })
  })
})
