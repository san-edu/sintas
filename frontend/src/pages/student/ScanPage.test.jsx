import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp, scheduleItem, studentUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

// qr-scanner di-mock penuh: instance + callback decode disimpan agar test dapat
// memicu decode dan mengontrol hasil hasCamera (docs/PROMPT_GUIDE.md F3).
const qrMock = vi.hoisted(() => {
  class MockQrScanner {
    static instances = []
    static hasCamera = vi.fn(async () => true)
    constructor(video, onDecode) {
      this.video = video
      this.onDecode = onDecode
      this.start = vi.fn(async () => {})
      this.stop = vi.fn(() => {})
      this.destroy = vi.fn(() => {})
      MockQrScanner.instances.push(this)
    }
  }
  return { MockQrScanner }
})

vi.mock('qr-scanner', () => ({ default: qrMock.MockQrScanner }))

const QR = 'Q'.padEnd(43, 'x')
const HADIR = {
  id: 999,
  sessionId: 10,
  scannedAt: '2026-09-17T01:03:00.000Z',
  status: 'HADIR',
  lateMinutes: 0,
  duplicate: false,
}
const INVALID_QR = {
  error: { code: 'INVALID_QR_PAYLOAD', message: 'QR Code tidak valid.' },
}

function mockCamera({ granted = true } = {}) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => {
        if (!granted) {
          const error = new Error('permission denied')
          error.name = 'NotAllowedError'
          throw error
        }
        return { getTracks: () => [{ stop: vi.fn() }] }
      }),
    },
  })
}

function installDefaults(items = []) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: studentUser } }),
    ),
    http.get(`${API_BASE_URL}/attendance/today`, () =>
      HttpResponse.json({ data: items }),
    ),
  )
}

// Memasang handler POST scan dan mencatat setiap body request.
function installScanHandler(responder) {
  const requests = []
  server.use(
    http.post(`${API_BASE_URL}/attendance-scans`, async ({ request }) => {
      const body = await request.json()
      requests.push(body)
      return responder(body, requests.length)
    }),
  )
  return requests
}

// Melewati precheck + izin kamera hingga kamera 'ready' (frame ter-mount).
async function startCamera(user) {
  await user.click(await screen.findByRole('button', { name: 'Mulai memindai' }))
  await user.click(screen.getByRole('button', { name: 'Izinkan kamera' }))
  await screen.findByText(/Scan otomatis berhenti saat kode terdeteksi/)
}

function emitDecode(payload = QR) {
  const instance = qrMock.MockQrScanner.instances.at(-1)
  instance.onDecode({ data: payload, cornerPoints: [{ x: 1, y: 1 }] })
}

describe('halaman scan siswa', () => {
  beforeEach(() => {
    qrMock.MockQrScanner.instances.length = 0
    qrMock.MockQrScanner.hasCamera.mockReset()
    qrMock.MockQrScanner.hasCamera.mockResolvedValue(true)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })
  })

  it('menampilkan pre-check generik dan aksi manual tanpa parameter sesi', async () => {
    installDefaults([])
    renderApp(['/app/student/scan'])

    expect(
      await screen.findByRole('heading', { name: 'Arahkan kamera ke QR Code' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Mulai memindai' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Masukkan kode manual' }),
    ).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Mulai memindai' }))
    expect(
      screen.getByRole('heading', { name: 'Akses kamera' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Izinkan kamera' }),
    ).toBeInTheDocument()
  })

  it('menampilkan konteks sesi dari parameter sesi', async () => {
    installDefaults([scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN' })])
    renderApp(['/app/student/scan?session=10'])
    expect(await screen.findByRole('heading', { name: /Matematika/ })).toBeInTheDocument()
    expect(screen.getByText('XII IPA 1')).toBeInTheDocument()
    expect(screen.getByText('Bisa absen')).toBeInTheDocument()
    expect(screen.getByText('Guru Demo')).toBeInTheDocument()
  })

  it('menandai sesi tak dikenal namun tetap mengizinkan scan', async () => {
    installDefaults([scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN' })])
    renderApp(['/app/student/scan?session=999'])
    expect(
      await screen.findByText(/Sesi ini tidak ada pada jadwal hari ini/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Mulai memindai' }),
    ).toBeInTheDocument()
  })

  it('mencatat Hadir dari hasil scan dan mengirim payload apa adanya', async () => {
    const user = userEvent.setup()
    const scanRequests = installScanHandler(() =>
      HttpResponse.json({ data: HADIR }),
    )
    installDefaults([
      scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN' }),
    ])
    mockCamera()
    renderApp(['/app/student/scan'])

    await startCamera(user)
    emitDecode()

    expect(await screen.findByRole('heading', { name: 'Absensi tercatat' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hasil scan' })).toBeInTheDocument()
    expect(screen.getByText('Hadir')).toBeInTheDocument()
    expect(scanRequests).toEqual([{ qrPayload: QR }])
    expect(
      screen.getByRole('link', { name: 'Lihat riwayat' }),
    ).toHaveAttribute('href', '/app/student/history')
    expect(
      screen.getByRole('link', { name: 'Kembali ke beranda' }),
    ).toHaveAttribute('href', '/app/student')
  })

  it('menampilkan keterlambatan dari server tanpa menghitung di client', async () => {
    const user = userEvent.setup()
    installScanHandler(() =>
      HttpResponse.json({
        data: { ...HADIR, status: 'TERLAMBAT', lateMinutes: 16 },
      }),
    )
    installDefaults([
      scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN' }),
    ])
    mockCamera()
    renderApp(['/app/student/scan'])

    await startCamera(user)
    emitDecode()

    expect(await screen.findByRole('heading', { name: 'Absensi terlambat' })).toBeInTheDocument()
    expect(screen.getByText('Terlambat')).toBeInTheDocument()
    expect(screen.getByText('Terlambat 16 menit')).toBeInTheDocument()
    expect(screen.queryByText('Absensi tercatat')).not.toBeInTheDocument()
  })

  it('menampilkan hasil duplicate idempotent 200 dari server', async () => {
    const user = userEvent.setup()
    installScanHandler(() =>
      HttpResponse.json({
        data: { ...HADIR, duplicate: true, scannedAt: '2026-09-17T00:59:00.000Z' },
      }),
    )
    installDefaults([
      scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN', scanned: true }),
    ])
    mockCamera()
    renderApp(['/app/student/scan'])

    await startCamera(user)
    emitDecode()

    expect(
      await screen.findByRole('heading', { name: 'Absensi sudah tercatat' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Absensi untuk sesi ini sudah tercatat/)).toBeInTheDocument()
  })

  it('menampilkan panel error QR invalid lalu Coba lagi memindai ulang', async () => {
    const user = userEvent.setup()
    const responder = (body, attempt) =>
      attempt === 1
        ? HttpResponse.json(INVALID_QR, { status: 400 })
        : HttpResponse.json({ data: HADIR })
    const scanRequests = installScanHandler(responder)
    installDefaults([
      scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN' }),
    ])
    mockCamera()
    renderApp(['/app/student/scan'])

    await startCamera(user)
    emitDecode('X'.padEnd(43, 'x'))

    expect(
      await screen.findByRole('heading', { name: 'QR Code tidak valid' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/QR Code yang dipindai tidak dikenali/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    await waitFor(() => expect(qrMock.MockQrScanner.instances).toHaveLength(2))
    await screen.findByText(/Scan otomatis berhenti saat kode terdeteksi/)
    emitDecode()

    expect(await screen.findByRole('heading', { name: 'Absensi tercatat' })).toBeInTheDocument()
    expect(scanRequests).toEqual([
      { qrPayload: 'X'.padEnd(43, 'x') },
      { qrPayload: QR },
    ])
  })

  it('menampilkan panel offline saat jaringan terputus saat scan', async () => {
    const user = userEvent.setup()
    installScanHandler(() => HttpResponse.error())
    installDefaults([
      scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN' }),
    ])
    mockCamera()
    renderApp(['/app/student/scan'])

    await startCamera(user)
    emitDecode()

    expect(
      await screen.findByRole('heading', { name: 'Koneksi terputus' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Absensi belum tercatat. Coba lagi saat koneksi tersedia.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Coba lagi' }),
    ).toBeInTheDocument()
  })

  it('menampilkan fallback manual saat kamera ditolak dan mengirim kode manual', async () => {
    const user = userEvent.setup()
    const scanRequests = installScanHandler(() =>
      HttpResponse.json({ data: HADIR }),
    )
    installDefaults([
      scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN' }),
    ])
    mockCamera({ granted: false })
    renderApp(['/app/student/scan'])

    await user.click(await screen.findByRole('button', { name: 'Mulai memindai' }))
    await user.click(screen.getByRole('button', { name: 'Izinkan kamera' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Akses kamera ditolak')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Masukkan kode manual' }))
    await user.type(screen.getByLabelText('Kode QR'), QR)
    await user.click(screen.getByRole('button', { name: 'Kirim absensi' }))

    expect(await screen.findByRole('heading', { name: 'Absensi tercatat' })).toBeInTheDocument()
    expect(scanRequests).toEqual([{ qrPayload: QR }])
  })

  it('menampilkan fallback saat kamera tidak tersedia dan memakai kode manual', async () => {
    const user = userEvent.setup()
    const scanRequests = installScanHandler(() =>
      HttpResponse.json({ data: HADIR }),
    )
    installDefaults([
      scheduleItem({ id: 10, windowStatus: 'BISA_ABSEN' }),
    ])
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })
    renderApp(['/app/student/scan'])

    await user.click(await screen.findByRole('button', { name: 'Mulai memindai' }))
    await user.click(screen.getByRole('button', { name: 'Izinkan kamera' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Kamera tidak tersedia')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Masukkan kode manual' }))
    await user.type(screen.getByLabelText('Kode QR'), QR)
    await user.click(screen.getByRole('button', { name: 'Kirim absensi' }))

    expect(await screen.findByRole('heading', { name: 'Absensi tercatat' })).toBeInTheDocument()
    expect(scanRequests).toEqual([{ qrPayload: QR }])
  })

  it('menjelaskan sesi belum dibuka saat server menolak scan', async () => {
    const user = userEvent.setup()
    installScanHandler(() =>
      HttpResponse.json(
        {
          error: {
            code: 'ATTENDANCE_WINDOW_CLOSED',
            message: 'Sesi absensi belum dibuka atau sudah ditutup.',
          },
        },
        { status: 409 },
      ),
    )
    installDefaults([
      scheduleItem({ id: 10, windowStatus: 'BELUM_DIBUKA' }),
    ])
    mockCamera()
    renderApp(['/app/student/scan?session=10'])

    await startCamera(user)
    emitDecode()

    expect(
      await screen.findByRole('heading', { name: 'Sesi belum dibuka' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Absensi dibuka pukul/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Kembali ke beranda' }),
    ).toBeInTheDocument()
  })
})