import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, adminUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

const BANNERS_URL = `${API_BASE_URL}/banners/manage`

function managedBanner(overrides) {
  return {
    id: 5,
    title: 'Gelombang Ujian',
    imageUrl: null,
    content: 'Seleksi dimulai 21 September.',
    isActive: true,
    displayStartAt: null,
    displayEndAt: null,
    createdById: 3,
    createdAt: '2026-09-10T02:00:00.000Z',
    updatedAt: '2026-09-10T02:00:00.000Z',
    ...overrides,
  }
}

function page(items) {
  return {
    items,
    meta: { page: 1, limit: 20, total: items.length, totalPages: 1 },
  }
}

function renderBanners(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: adminUser } }),
    ),
    ...handlers,
  )
  renderApp(['/app/admin/banners'])
}

describe('halaman banner admin', () => {
  it('menampilkan daftar banner beserta statusnya', async () => {
    renderBanners([
      http.get(BANNERS_URL, () => HttpResponse.json({ data: page([managedBanner()]) })),
    ])

    expect((await screen.findAllByText('Gelombang Ujian')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Aktif')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Seleksi dimulai 21 September.').length).toBeGreaterThan(0)
  })

  it('membuat banner baru dan mengirim payload sesuai kontrak', async () => {
    const user = userEvent.setup()
    const banners = [managedBanner()]
    let body = null
    renderBanners([
      http.get(BANNERS_URL, () => HttpResponse.json({ data: page(banners) })),
      http.post(`${API_BASE_URL}/banners`, async ({ request }) => {
        body = await request.json()
        const created = managedBanner({ id: 9, title: body.title, content: body.content })
        banners.push(created)
        return HttpResponse.json({ data: created })
      }),
    ])

    await screen.findAllByText('Gelombang Ujian')
    await user.click(screen.getByRole('button', { name: 'Banner baru' }))

    await user.type(screen.getByLabelText('Judul'), 'Libur Nasional')
    await user.type(screen.getByLabelText('Konten'), 'Kegiatan belajar-mengajar diliburkan.')
    await user.click(screen.getByRole('button', { name: 'Buat banner' }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({
      title: 'Libur Nasional',
      imageUrl: null,
      content: 'Kegiatan belajar-mengajar diliburkan.',
      isActive: true,
      displayStartAt: null,
      displayEndAt: null,
    })
    expect((await screen.findAllByText('Libur Nasional')).length).toBeGreaterThan(0)
  })

  it('menghapus banner setelah konfirmasi', async () => {
    const user = userEvent.setup()
    const banners = [managedBanner()]
    let deleteCount = 0
    renderBanners([
      http.get(BANNERS_URL, () => HttpResponse.json({ data: page(banners) })),
      http.delete(`${API_BASE_URL}/banners/5`, () => {
        deleteCount += 1
        banners.length = 0
        return HttpResponse.json({ data: { deleted: true } })
      }),
    ])

    await screen.findAllByText('Gelombang Ujian')
    await user.click(screen.getAllByRole('button', { name: 'Hapus' })[0])

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText('Hapus banner "Gelombang Ujian"'),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Hapus' }))

    await waitFor(() => expect(deleteCount).toBe(1))
    expect(await screen.findByText('Belum ada banner')).toBeInTheDocument()
  })
})