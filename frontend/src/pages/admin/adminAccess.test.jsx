import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, studentUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

describe('akses role halaman admin', () => {
  it.each(['/app/admin', '/app/admin/banners', '/app/admin/users'])(
    'siswa tidak dapat membuka %s',
    async (path) => {
      server.use(
        http.get(`${API_BASE_URL}/me`, () =>
          HttpResponse.json({ data: { user: studentUser } }),
        ),
      )
      renderApp([path])
      expect(
        await screen.findByRole('heading', { name: 'Akses ditolak' }),
      ).toBeInTheDocument()
    },
  )
})