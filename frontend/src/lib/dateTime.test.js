import { describe, expect, it } from 'vitest'
import { schoolDateTimeIso } from './dateTime'

describe('schoolDateTimeIso', () => {
  it('membentuk ISO 8601 dengan offset timezone sekolah', () => {
    expect(schoolDateTimeIso('2026-09-17', '08:00')).toBe(
      '2026-09-17T08:00:00+07:00',
    )
  })

  it('mengembalikan string kosong bila input tidak lengkap', () => {
    expect(schoolDateTimeIso('', '08:00')).toBe('')
    expect(schoolDateTimeIso('2026-09-17', '')).toBe('')
  })
})
