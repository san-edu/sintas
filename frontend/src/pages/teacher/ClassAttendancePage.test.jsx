import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, reportItem, teacherUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

const CLASS_URL = `${API_BASE_URL}/attendance/classes/30`
const EXPORT_URL = `${API_BASE_URL}/reports/attendance/export`

function classHandler(items) {
  return http.get(CLASS_URL, () =>
    HttpResponse.json({
      data: {
        items,
        meta: { page: 1, limit: 20, total: items.length, totalPages: 1 },
      },
    }),
  )
}

function renderAttendance(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: teacherUser } }),
    ),
    ...handlers,
  )
  renderApp(['/app/teacher/classes/30/attendance'])
}

describe('halaman detail kehadiran kelas guru', () => {
  it('menampilkan catatan kehadiran dari server', async () => {
    renderAttendance([classHandler([reportItem({ id: 1, status: 'TERLAMBAT' })])])

    expect(await screen.findByText('1 catatan ditemukan.')).toBeInTheDocument()
    expect(screen.getAllByText('Matematika').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Terlambat').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/16 menit/).length).toBeGreaterThan(0)
  })

  it('mengunduh export XLSX dengan scope kelas', async () => {
    const user = userEvent.setup()
    let exportUrl = ''
    renderAttendance([
      classHandler([reportItem({ id: 1 })]),
      http.get(EXPORT_URL, ({ request }) => {
        exportUrl = request.url
        return new HttpResponse(new Blob(['xlsx']), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition':
              'attachment; filename="laporan-kehadiran-20260911-20260917.xlsx"',
          },
        })
      }),
    ])

    await screen.findByText('1 catatan ditemukan.')
    await user.click(screen.getByRole('button', { name: 'Export XLSX' }))

    expect(
      await screen.findByText('Laporan kehadiran sedang diunduh.'),
    ).toBeInTheDocument()
    expect(new URL(exportUrl).searchParams.get('classId')).toBe('30')
  })

  it('menampilkan pesan error export saat tidak ada data', async () => {
    const user = userEvent.setup()
    renderAttendance([
      classHandler([reportItem({ id: 1 })]),
      http.get(EXPORT_URL, () =>
        HttpResponse.json(
          {
            error: {
              code: 'NO_DATA_TO_EXPORT',
              message: 'Tidak ada data untuk diekspor.',
            },
          },
          { status: 404 },
        ),
      ),
    ])

    await screen.findByText('1 catatan ditemukan.')
    await user.click(screen.getByRole('button', { name: 'Export XLSX' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tidak ada data untuk diekspor.',
    )
  })
})
