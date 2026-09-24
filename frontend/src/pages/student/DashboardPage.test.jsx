import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { activeBanner, renderApp, scheduleItem, studentUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

const TODAY_HANDLER = (items) =>
  http.get(`${API_BASE_URL}/attendance/today`, () =>
    HttpResponse.json({ data: items }),
  )

function renderDashboard(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: studentUser } }),
    ),
    ...handlers,
  )
  renderApp(['/app/student'])
}

describe('dashboard siswa', () => {
  it('menampilkan sapaan, banner, ringkasan, dan jadwal dari server', async () => {
    renderDashboard([
      TODAY_HANDLER([
        scheduleItem({
          id: 1,
          windowStatus: 'SELESAI',
          attendanceStatus: 'HADIR',
          scanned: true,
        }),
        scheduleItem({ id: 2, windowStatus: 'BISA_ABSEN' }),
        scheduleItem({ id: 3, windowStatus: 'BELUM_DIBUKA' }),
      ]),
      http.get(`${API_BASE_URL}/banners`, () =>
        HttpResponse.json({ data: [activeBanner] }),
      ),
    ])

    expect(
      await screen.findByRole('heading', { name: 'Halo, Siswa' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Ujian Tengah Semester')).toBeInTheDocument()
    expect(await screen.findByText('1 dari 3 sesi')).toBeInTheDocument()
    expect(screen.getByText('Belum mengikuti 2 sesi hari ini.')).toBeInTheDocument()
    expect(screen.getByText('Hadir')).toBeInTheDocument()
    expect(screen.getByText('Bisa absen')).toBeInTheDocument()
    expect(screen.getByText('Belum dibuka')).toBeInTheDocument()
    const scanCta = screen.getByRole('link', { name: 'Mulai absen' })
    expect(scanCta).toHaveAttribute('href', '/app/student/scan?session=2')
    expect(screen.getAllByText(/Guru Demo/).length).toBeGreaterThan(0)
    expect(
      screen.getByRole('link', { name: /Riwayat absensi/ }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Profil/ }).length).toBeGreaterThan(0)
  })

  it('banner hanya menampilkan isi tanpa gambar saat imageUrl kosong', async () => {
    renderDashboard([
      TODAY_HANDLER([]),
      http.get(`${API_BASE_URL}/banners`, () =>
        HttpResponse.json({ data: [activeBanner] }),
      ),
    ])
    await screen.findByText('Ujian Tengah Semester')
    expect(
      screen.queryByRole('img', { name: /Ujian Tengah Semester/ }),
    ).not.toBeInTheDocument()
  })

  it('menampilkan label persis field server meski bertentangan dengan jam', async () => {
    renderDashboard([
      TODAY_HANDLER([
        scheduleItem({
          id: 1,
          startAt: '2099-01-01T01:00:00.000Z',
          endAt: '2099-01-01T02:00:00.000Z',
          windowStatus: 'BISA_ABSEN',
          attendanceStatus: 'TERLAMBAT',
          scanned: true,
        }),
      ]),
    ])

    await screen.findByText('1 dari 1 sesi')
    expect(screen.getByText('Semua absensi hari ini tercatat.')).toBeInTheDocument()
    expect(screen.getByText('Bisa absen')).toBeInTheDocument()
    expect(screen.getByText('Terlambat')).toBeInTheDocument()
  })

  it('menampilkan state kosong saat tidak ada jadwal dan banner', async () => {
    renderDashboard([TODAY_HANDLER([])])
    expect(
      await screen.findByText('Belum ada sesi hari ini'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Mulai absen' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Belum ada jadwal hari ini' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Lihat jadwal' }).length,
    ).toBeGreaterThan(0)
  })

  it('menampilkan error jadwal dan bisa dimuat ulang', async () => {
    const user = userEvent.setup()
    renderDashboard([
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
    ])

    expect(await screen.findByText('Jadwal tidak dapat dimuat.')).toBeInTheDocument()

    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
      TODAY_HANDLER([scheduleItem({ id: 9, windowStatus: 'BISA_ABSEN' })]),
    )
    await user.click(screen.getAllByRole('button', { name: 'Coba lagi' })[0])
    expect(await screen.findByText('Matematika')).toBeInTheDocument()
  })

  it('menampilkan pemberitahuan offline saat jaringan terputus', async () => {
    renderDashboard([
      http.get(`${API_BASE_URL}/attendance/today`, () => HttpResponse.error()),
    ])
    expect((await screen.findAllByText('Koneksi terputus.')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Data belum dapat dimuat.').length).toBeGreaterThan(0)
  })

  it('banner gagal tidak menggagalkan jadwal dan sebaliknya', async () => {
    renderDashboard([
      http.get(`${API_BASE_URL}/banners`, () =>
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
      TODAY_HANDLER([scheduleItem({ id: 7, windowStatus: 'SELESAI', scanned: true })]),
    ])

    await screen.findByText('Banner tidak dapat dimuat.')
    await waitFor(() => {
      expect(screen.getByText('Matematika')).toBeInTheDocument()
    })
    expect(screen.queryByText('Jadwal tidak dapat dimuat.')).not.toBeInTheDocument()
  })
})