import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { adminUser, renderApp, teacherUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

describe('akses role halaman siswa', () => {
  it('guru tidak dapat membuka halaman jadwal siswa', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: teacherUser } }),
      ),
    )
    renderApp(['/app/student/schedule'])
    expect(
      await screen.findByRole('heading', { name: 'Akses ditolak' }),
    ).toBeInTheDocument()
  })

  it('admin tidak dapat membuka halaman riwayat siswa', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: adminUser } }),
      ),
    )
    renderApp(['/app/student/history'])
    expect(
      await screen.findByRole('heading', { name: 'Akses ditolak' }),
    ).toBeInTheDocument()
  })
})