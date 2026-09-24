import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, sessionQrItem, teacherUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

function renderQr(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: teacherUser } }),
    ),
    ...handlers,
  )
  return renderApp(['/app/teacher/sessions/10/qr'])
}

describe('halaman QR sesi guru', () => {
  it('menampilkan QR Code dan metadata sesi dari server', async () => {
    const { container } = renderQr([
      http.get(`${API_BASE_URL}/attendance-sessions/10/qr`, () =>
        HttpResponse.json({ data: sessionQrItem() }),
      ),
    ])

    expect(
      await screen.findByRole('heading', { name: 'QR sesi absensi' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Matematika')).toBeInTheDocument()
    expect(screen.getByText('XII IPA 1')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('menampilkan error saat QR tidak dapat dimuat', async () => {
    renderQr([
      http.get(`${API_BASE_URL}/attendance-sessions/10/qr`, () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Sesi tidak ditemukan.' } },
          { status: 404 },
        ),
      ),
    ])

    expect(
      await screen.findByText('QR sesi tidak dapat dimuat.'),
    ).toBeInTheDocument()
  })
})
