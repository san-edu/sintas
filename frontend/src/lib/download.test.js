import { describe, expect, it } from 'vitest'
import { filenameFromDisposition } from './download'

describe('filenameFromDisposition', () => {
  it('mengambil nama file dari header filename biasa', () => {
    expect(
      filenameFromDisposition(
        'attachment; filename="laporan-kehadiran-20260911-20260917.xlsx"',
      ),
    ).toBe('laporan-kehadiran-20260911-20260917.xlsx')
  })

  it('mendekode filename* UTF-8', () => {
    expect(
      filenameFromDisposition("attachment; filename*=UTF-8''laporan%20kehadiran.xlsx"),
    ).toBe('laporan kehadiran.xlsx')
  })

  it('memakai fallback saat header tidak ada', () => {
    expect(filenameFromDisposition(undefined)).toBe('laporan-kehadiran.xlsx')
  })
})
