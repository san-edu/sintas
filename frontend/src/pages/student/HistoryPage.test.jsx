import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, reportItem, studentUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

const HISTORY_URL = `${API_BASE_URL}/attendance/history`

function historyHandler(items) {
  return http.get(HISTORY_URL, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const status = url.searchParams.get('status')
    const filtered = status ? items.filter((item) => item.status === status) : items
    return HttpResponse.json({
      data: {
        items: filtered,
        meta: {
          page,
          limit: 20,
          total: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / 20)),
        },
      },
    })
  })
}

function renderHistory(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: studentUser } }),
    ),
    ...handlers,
  )
  renderApp(['/app/student/history'])
}

describe('halaman riwayat siswa', () => {
  it('menampilkan baris riwayat dan meta dari server', async () => {
    renderHistory([
      historyHandler([
        reportItem({ id: 1, status: 'HADIR', scannedAt: '2026-09-16T01:00:00.000Z', lateMinutes: 0 }),
        reportItem({ id: 2, status: 'TERLAMBAT' }),
      ]),
    ])

    expect(await screen.findByText('2 catatan ditemukan.')).toBeInTheDocument()
    expect(screen.getAllByText('Matematika').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Terlambat').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hadir').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/16 menit/).length).toBeGreaterThan(0)
    expect(screen.getByRole('navigation', { name: 'Navigasi halaman riwayat' })).toBeInTheDocument()
    expect(screen.getByText('Halaman 1 dari 1')).toBeInTheDocument()
  })

  it('mengirim rentang default dan status saat filter diterapkan', async () => {
    const user = userEvent.setup()
    let lastUrl = ''
    renderHistory([
      http.get(HISTORY_URL, ({ request }) => {
        lastUrl = request.url
        const url = new URL(request.url)
        const status = url.searchParams.get('status')
        const filtered = status
          ? [reportItem({ id: 2, status: 'TERLAMBAT', subjectName: 'Fisika' })]
          : [
              reportItem({ id: 1, status: 'HADIR' }),
              reportItem({ id: 2, status: 'TERLAMBAT', subjectName: 'Fisika' }),
            ]
        return HttpResponse.json({
          data: {
            items: filtered,
            meta: { page: 1, limit: 20, total: filtered.length, totalPages: 1 },
          },
        })
      }),
    ])

    await screen.findByText('2 catatan ditemukan.')
    const initial = new URL(lastUrl)
    expect(initial.searchParams.get('from')).toBeTruthy()
    expect(initial.searchParams.get('to')).toBeTruthy()
    expect(initial.searchParams.get('page')).toBe('1')
    expect(initial.searchParams.get('status')).toBeNull()

    await user.selectOptions(screen.getByLabelText('Status'), 'TERLAMBAT')
    await user.click(screen.getByRole('button', { name: 'Terapkan' }))

    expect(await screen.findByText('1 catatan ditemukan.')).toBeInTheDocument()
    expect(new URL(lastUrl).searchParams.get('status')).toBe('TERLAMBAT')
    expect(screen.getAllByText('Fisika').length).toBeGreaterThan(0)
    expect(screen.queryByText('Matematika')).not.toBeInTheDocument()
  })

  it('menampilkan error validasi saat dari lebih besar dari sampai', async () => {
    const user = userEvent.setup()
    let requestCount = 0
    renderHistory([
      http.get(HISTORY_URL, () => {
        requestCount += 1
        return HttpResponse.json({
          data: {
            items: [reportItem({ id: 1 })],
            meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        })
      }),
    ])

    await screen.findByText('1 catatan ditemukan.')
    fireEvent.change(screen.getByLabelText('Dari tanggal'), {
      target: { value: '2026-09-20' },
    })
    fireEvent.change(screen.getByLabelText('Sampai tanggal'), {
      target: { value: '2026-09-10' },
    })
    await user.click(screen.getByRole('button', { name: 'Terapkan' }))

    expect(
      await screen.findByText('Tanggal akhir harus setelah tanggal mulai.'),
    ).toBeInTheDocument()
    expect(requestCount).toBe(1)
  })

  it('menampilkan state kosong dan reset memulihkan data default', async () => {
    const user = userEvent.setup()
    renderHistory([
      http.get(HISTORY_URL, ({ request }) => {
        const url = new URL(request.url)
        const restricted = url.searchParams.get('status') === 'HADIR'
        const items = restricted ? [] : [reportItem({ id: 1, status: 'HADIR' })]
        return HttpResponse.json({
          data: {
            items,
            meta: { page: 1, limit: 20, total: items.length, totalPages: 1 },
          },
        })
      }),
    ])

    await screen.findByText('1 catatan ditemukan.')
    await user.selectOptions(screen.getByLabelText('Status'), 'HADIR')
    await user.click(screen.getByRole('button', { name: 'Terapkan' }))

    expect(
      await screen.findByRole('heading', { name: 'Belum ada riwayat pada periode ini' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ubah filter' }))
    expect(await screen.findByText('1 catatan ditemukan.')).toBeInTheDocument()
  })

  it('menampilkan error riwayat dan bisa dimuat ulang', async () => {
    const user = userEvent.setup()
    renderHistory([
      http.get(HISTORY_URL, () =>
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

    expect(await screen.findByText('Riwayat tidak dapat dimuat.')).toBeInTheDocument()

    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
      historyHandler([reportItem({ id: 3, status: 'HADIR' })]),
    )
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('1 catatan ditemukan.')).toBeInTheDocument()
  })

  it('berpindah halaman sesuai meta pagination', async () => {
    const user = userEvent.setup()
    let lastUrl = ''
    renderHistory([
      http.get(HISTORY_URL, ({ request }) => {
        lastUrl = request.url
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? '1')
        return HttpResponse.json({
          data: {
            items: [reportItem({ id: page })],
            meta: { page, limit: 20, total: 25, totalPages: 2 },
          },
        })
      }),
    ])

    await screen.findByText('Halaman 1 dari 2')
    const nextButton = screen.getByRole('button', { name: 'Berikutnya' })
    expect(nextButton).toBeEnabled()
    await user.click(nextButton)

    expect(await screen.findByText('Halaman 2 dari 2')).toBeInTheDocument()
    expect(new URL(lastUrl).searchParams.get('page')).toBe('2')
    expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeDisabled()
  })

  it('membuka dialog detail dari baris riwayat dan menutupnya', async () => {
    const user = userEvent.setup()
    renderHistory([historyHandler([reportItem({ id: 5, status: 'TERLAMBAT' })])])

    await screen.findByText('1 catatan ditemukan.')
    await user.click(screen.getAllByRole('button', { name: /16 menit/ })[0])

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Detail riwayat' })).toBeInTheDocument()
    expect(within(dialog).getByText('16 menit')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Tutup detail' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})