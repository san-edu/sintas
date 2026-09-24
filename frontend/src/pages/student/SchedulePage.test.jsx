import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, scheduleItem, studentUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

function renderSchedule(items) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: studentUser } }),
    ),
    http.get(`${API_BASE_URL}/attendance/today`, () =>
      HttpResponse.json({ data: items }),
    ),
  )
  renderApp(['/app/student/schedule'])
}

describe('halaman jadwal siswa', () => {
  it('mengelompokkan sesi sesuai status dari server', async () => {
    renderSchedule([
      scheduleItem({ id: 1, windowStatus: 'BISA_ABSEN' }),
      scheduleItem({
        id: 2,
        windowStatus: 'BISA_ABSEN',
        attendanceStatus: 'TERLAMBAT',
        scanned: true,
      }),
      scheduleItem({ id: 3, windowStatus: 'BELUM_DIBUKA' }),
      scheduleItem({
        id: 4,
        windowStatus: 'SELESAI',
        attendanceStatus: 'HADIR',
        scanned: true,
      }),
    ])

    expect(
      await screen.findByRole('heading', { name: /Bisa absen/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Belum dibuka/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Selesai/ })).toBeInTheDocument()
    expect(screen.getByText('2 sesi')).toBeInTheDocument()
    expect(screen.getAllByText('Terlambat').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hadir').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Guru Demo/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^\d{2}\.\d{2}$/).length).toBeGreaterThan(0)
    const scanLinks = screen.getAllByRole('link', { name: 'Absen sekarang' })
    expect(scanLinks).toHaveLength(1)
    expect(scanLinks[0]).toHaveAttribute('href', '/app/student/scan?session=1')
  })

  it('menampilkan label persis field server meski bertentangan dengan jam', async () => {
    renderSchedule([
      scheduleItem({
        id: 1,
        startAt: '2099-01-01T01:00:00.000Z',
        endAt: '2099-01-01T02:00:00.000Z',
        windowStatus: 'BISA_ABSEN',
      }),
    ])

    expect(
      await screen.findByRole('heading', { name: /Bisa absen/ }),
    ).toBeInTheDocument()
  })

  it('menampilkan state kosong saat tidak ada sesi', async () => {
    renderSchedule([])
    expect(
      await screen.findByRole('heading', {
        name: 'Belum ada pelajaran pada tanggal ini',
      }),
    ).toBeInTheDocument()
  })

  it('menampilkan error dan bisa dimuat ulang', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
      http.get(`${API_BASE_URL}/attendance/today`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Terjadi kesalahan server.',
            },
          },
          { status: 500 },
        ),
      ),
    )
    renderApp(['/app/student/schedule'])

    expect(await screen.findByText('Jadwal tidak dapat dimuat.')).toBeInTheDocument()

    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
      http.get(`${API_BASE_URL}/attendance/today`, () =>
        HttpResponse.json({
          data: [scheduleItem({ id: 5, windowStatus: 'BISA_ABSEN' })],
        }),
      ),
    )
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('heading', { name: /Bisa absen/ })).toBeInTheDocument()
  })

  it('menampilkan pemberitahuan offline saat jaringan terputus', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
      http.get(`${API_BASE_URL}/attendance/today`, () => HttpResponse.error()),
    )
    renderApp(['/app/student/schedule'])
    expect(await screen.findByText('Koneksi terputus.')).toBeInTheDocument()
  })
})
