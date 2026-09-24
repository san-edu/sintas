import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp, studentUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

describe('akses role halaman guru', () => {
  it('siswa tidak dapat membuka halaman penugasan guru', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
    )
    renderApp(['/app/teacher/assignments'])
    expect(
      await screen.findByRole('heading', { name: 'Akses ditolak' }),
    ).toBeInTheDocument()
  })

  it('siswa tidak dapat membuka halaman sesi guru', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
    )
    renderApp(['/app/teacher/sessions'])
    expect(
      await screen.findByRole('heading', { name: 'Akses ditolak' }),
    ).toBeInTheDocument()
  })
})
