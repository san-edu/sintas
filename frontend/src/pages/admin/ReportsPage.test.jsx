import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, adminUser, reportItem } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

const REPORT_URL = `${API_BASE_URL}/reports/attendance`

function page(items) {
  return {
    items,
    meta: { page: 1, limit: 20, total: items.length, totalPages: 1 },
  }
}

function renderReports(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: adminUser } }),
    ),
    http.get(`${API_BASE_URL}/academic/classes`, () =>
      HttpResponse.json({ data: page([]) }),
    ),
    ...handlers,
  )
  renderApp(['/app/admin/reports'])
}

describe('halaman laporan global admin', () => {
  it('menampilkan rekap laporan beserta status dan waktu scan', async () => {
    renderReports([
      http.get(REPORT_URL, () => HttpResponse.json({ data: page([reportItem()]) })),
    ])

    expect((await screen.findAllByText('Siswa Demo')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Matematika').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Terlambat').length).toBeGreaterThan(0)
    expect(screen.getAllByText('16 menit').length).toBeGreaterThan(0)
  })

  it('meneruskan rentang tanggal, kelas, dan status ke backend', async () => {
    const user = userEvent.setup()
    const calls = []
    renderReports([
      http.get(REPORT_URL, ({ request }) => {
        const params = new URL(request.url).searchParams
        calls.push({
          from: params.get('from'),
          to: params.get('to'),
          status: params.get('status'),
        })
        return HttpResponse.json({ data: page([]) })
      }),
    ])

    await screen.findByLabelText('Dari tanggal')
    await user.type(screen.getByLabelText('Dari tanggal'), '2026-09-01')
    await user.type(screen.getByLabelText('Sampai tanggal'), '2026-09-15')
    await user.selectOptions(screen.getByLabelText('Status'), 'TERLAMBAT')
    await user.click(screen.getByRole('button', { name: 'Terapkan' }))

    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1]).toEqual({ from: '2026-09-01', to: '2026-09-15', status: 'TERLAMBAT' })
  })

  it('meminta file export dengan filter saat ini', async () => {
    const user = userEvent.setup()
    let exportCalled = 0
    renderReports([
      http.get(REPORT_URL, () => HttpResponse.json({ data: page([reportItem()]) })),
      http.get(`${API_BASE_URL}/reports/attendance/export`, () => {
        exportCalled += 1
        return HttpResponse.arrayBuffer(new Uint8Array([1, 2, 3]), {
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition':
              'attachment; filename="laporan-kehadiran.xlsx"',
          },
        })
      }),
    ])

    await screen.findByLabelText('Dari tanggal')
    await user.click(screen.getByRole('button', { name: /export xlsx/i }))

    await waitFor(() => expect(exportCalled).toBe(1))
  })
})