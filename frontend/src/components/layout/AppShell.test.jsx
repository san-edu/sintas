import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL, server } from '../../test/server'
import { renderApp, studentUser, teacherUser } from '../../test/fixtures'

describe('app shell dan navigasi per role', () => {
  it('menampilkan navigasi Beranda, Jadwal, Riwayat, dan Profil untuk siswa', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
    )
    renderApp(['/app/student'])
    await screen.findByRole('heading', { name: 'Halo, Siswa' })
    expect(screen.getAllByRole('link', { name: 'Beranda' }).length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: 'Jadwal' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: 'Riwayat' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: 'Profil' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByRole('link', { name: 'Jadwal' }).getAttribute('href'),
    ).toBe('/app/student/schedule')
  })

  it('menampilkan navigasi Beranda dan Profil untuk guru', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: teacherUser } }),
      ),
    )
    renderApp(['/app/teacher'])
    await screen.findByRole('heading', { name: 'Beranda Guru' })
    expect(
      screen.getByRole('link', { name: 'Beranda' }).getAttribute('href'),
    ).toBe('/app/teacher')
    expect(
      screen.getByRole('link', { name: 'Profil' }).getAttribute('href'),
    ).toBe('/app/teacher/profile')
  })

  it('keluar mengarahkan kembali ke halaman masuk', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: teacherUser } }),
      ),
      http.post(`${API_BASE_URL}/auth/logout`, () =>
        HttpResponse.json({ data: { message: 'Logout berhasil.' } }),
      ),
    )
    renderApp(['/app/teacher'])
    await screen.findByRole('heading', { name: 'Beranda Guru' })
    await user.click(screen.getByRole('button', { name: 'Menu akun' }))
    await user.click(screen.getByRole('menuitem', { name: 'Keluar' }))
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
  })
})