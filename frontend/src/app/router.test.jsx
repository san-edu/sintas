import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { queryClient } from '../lib/queryClient'
import { useSessionStore } from '../stores/sessionStore'
import { API_BASE_URL, server } from '../test/server'
import { AppRoutes } from './router'
import { SessionProvider } from './session/SessionProvider'

const studentUser = {
  id: 1,
  username: 'student.demo',
  role: 'STUDENT',
  name: 'Siswa Demo',
  email: 'student.demo@school.test',
  phone: null,
  birthDate: null,
}

function renderApp(initialEntries) {
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <AppRoutes />
        </MemoryRouter>
      </SessionProvider>
    </QueryClientProvider>,
  )
}

describe('routing dan guard', () => {
  it('mengarahkan pengguna yang belum login ke halaman masuk', async () => {
    renderApp(['/app/student'])
    expect(
      await screen.findByRole('heading', { name: 'Masuk' }),
    ).toBeInTheDocument()
  })

  it('mengarahkan / ke halaman masuk saat belum login', async () => {
    renderApp(['/'])
    expect(
      await screen.findByRole('heading', { name: 'Masuk' }),
    ).toBeInTheDocument()
  })

  it('mengarahkan / ke beranda sesuai role saat sudah login', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
    )
    renderApp(['/'])
    expect(
      await screen.findByRole('heading', { name: 'Halo, Siswa' }),
    ).toBeInTheDocument()
  })

  it('menandai sesi berakhir ketika /me mengembalikan 401 setelah login', async () => {
    useSessionStore.setState({
      user: studentUser,
      status: 'authenticated',
      sessionExpired: false,
    })
    renderApp(['/app/student'])
    expect(
      await screen.findByText('Sesi Anda berakhir. Silakan masuk kembali.'),
    ).toBeInTheDocument()
  })

  it('menampilkan halaman akses ditolak saat role tidak sesuai route', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({
          data: { user: { ...studentUser, role: 'TEACHER' } },
        }),
      ),
    )
    renderApp(['/app/admin'])
    expect(
      await screen.findByRole('heading', { name: 'Akses ditolak' }),
    ).toBeInTheDocument()
  })

  it('mengalihkan /app ke beranda sesuai role saat sudah login', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
    )
    renderApp(['/app'])
    expect(
      await screen.findByRole('heading', { name: 'Halo, Siswa' }),
    ).toBeInTheDocument()
  })

  it('mengarahkan guru ke beranda guru setelah redirect role', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({
          data: { user: { ...studentUser, id: 2, role: 'TEACHER' } },
        }),
      ),
    )
    renderApp(['/app'])
    expect(
      await screen.findByRole('heading', { name: 'Beranda Guru' }),
    ).toBeInTheDocument()
  })

  it('mengarahkan admin ke beranda admin setelah redirect role', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({
          data: { user: { ...studentUser, id: 3, role: 'ADMIN' } },
        }),
      ),
    )
    renderApp(['/app'])
    expect(
      await screen.findByRole('heading', { name: 'Beranda Admin' }),
    ).toBeInTheDocument()
  })
})

describe('alur login', () => {
  it('mengarahkan siswa ke beranda sesuai role setelah login', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
    )
    renderApp(['/login'])
    await screen.findByRole('heading', { name: 'Masuk' })
    await user.type(screen.getByLabelText('Username'), 'student.demo')
    await user.type(screen.getByLabelText('Password'), 'password-123')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(
      await screen.findByRole('heading', { name: 'Halo, Siswa' }),
    ).toBeInTheDocument()
  })

  it('menampilkan pesan error dari backend saat kredensial salah', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Username atau password tidak sesuai.',
            },
          },
          { status: 401 },
        ),
      ),
    )
    renderApp(['/login'])
    await screen.findByRole('heading', { name: 'Masuk' })
    await user.type(screen.getByLabelText('Username'), 'student.demo')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(
      await screen.findByText('Username atau password tidak sesuai.'),
    ).toBeInTheDocument()
  })
})