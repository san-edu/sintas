import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL, server } from '../../test/server'
import { renderApp, studentUser } from '../../test/fixtures'

describe('halaman profil', () => {
  it('menampilkan username dan NIM sebagai data read-only', async () => {
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
    )
    renderApp(['/app/student/profile'])
    await screen.findByRole('heading', { name: 'Profil' })
    expect(screen.getByText('student.demo')).toBeInTheDocument()
    expect(screen.getByText('S-0001')).toBeInTheDocument()
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('NIM')).not.toBeInTheDocument()
  })

  it('menyimpan perubahan profil tanpa username, NIM, atau role', async () => {
    const user = userEvent.setup()
    let requestBody
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
      http.patch(`${API_BASE_URL}/me`, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({
          data: { user: { ...studentUser, name: 'Nama Baru' } },
        })
      }),
    )
    renderApp(['/app/student/profile'])
    await screen.findByRole('heading', { name: 'Profil' })
    const nameInput = screen.getByLabelText('Nama')
    await user.clear(nameInput)
    await user.type(nameInput, 'Nama Baru')
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
    expect(
      await screen.findByText('Profil berhasil disimpan.'),
    ).toBeInTheDocument()
    expect(requestBody.name).toBe('Nama Baru')
    expect(requestBody).not.toHaveProperty('username')
    expect(requestBody).not.toHaveProperty('studentNumber')
    expect(requestBody).not.toHaveProperty('role')
  })

  it('menampilkan error field dari server pada field terkait', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${API_BASE_URL}/me`, () =>
        HttpResponse.json({ data: { user: studentUser } }),
      ),
      http.patch(`${API_BASE_URL}/me`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Periksa kembali data yang Anda isi.',
              fieldErrors: { email: ['Email sudah digunakan.'] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderApp(['/app/student/profile'])
    await screen.findByRole('heading', { name: 'Profil' })
    const emailInput = screen.getByLabelText('Email')
    await user.clear(emailInput)
    await user.type(emailInput, 'lain@school.test')
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
    expect(
      await screen.findByText('Email sudah digunakan.'),
    ).toBeInTheDocument()
  })
})