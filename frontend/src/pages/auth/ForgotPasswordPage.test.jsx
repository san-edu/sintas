import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL, server } from '../../test/server'
import { renderApp } from '../../test/fixtures'

async function fillValidForm(user) {
  await user.type(screen.getByLabelText('Email'), 'siswa@school.test')
  await user.type(screen.getByLabelText('Tanggal lahir'), '2005-03-14')
  await user.type(screen.getByLabelText('Password baru'), 'password-123')
  await user.type(screen.getByLabelText('Konfirmasi password'), 'password-123')
}

describe('halaman lupa password', () => {
  it('menampilkan error saat email tidak valid', async () => {
    const user = userEvent.setup()
    renderApp(['/forgot-password'])
    await screen.findByRole('heading', { name: 'Pulihkan password' })
    await user.type(screen.getByLabelText('Email'), 'bukan-email')
    await user.click(screen.getByRole('button', { name: 'Kirim' }))
    expect(await screen.findByText('Email tidak valid.')).toBeInTheDocument()
  })

  it('menampilkan error saat konfirmasi password tidak sama', async () => {
    const user = userEvent.setup()
    renderApp(['/forgot-password'])
    await screen.findByRole('heading', { name: 'Pulihkan password' })
    await fillValidForm(user)
    await user.clear(screen.getByLabelText('Konfirmasi password'))
    await user.type(screen.getByLabelText('Konfirmasi password'), 'password-999')
    await user.click(screen.getByRole('button', { name: 'Kirim' }))
    expect(
      await screen.findByText('Konfirmasi password tidak sama.'),
    ).toBeInTheDocument()
  })

  it('mengembalikan pengguna ke login dengan pesan sukses saat reset berhasil', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/auth/forgot-password`, () =>
        HttpResponse.json({ data: { message: 'Password berhasil diubah.' } }),
      ),
    )
    renderApp(['/forgot-password'])
    await screen.findByRole('heading', { name: 'Pulihkan password' })
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Kirim' }))
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(
      await screen.findByText('Password berhasil diubah. Silakan masuk kembali.'),
    ).toBeInTheDocument()
  })

  it('menampilkan pesan umum saat data pemulihan tidak sesuai', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/auth/forgot-password`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'RESET_DATA_INVALID',
              message: 'Data pemulihan password tidak sesuai.',
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderApp(['/forgot-password'])
    await screen.findByRole('heading', { name: 'Pulihkan password' })
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Kirim' }))
    expect(
      await screen.findByText('Data pemulihan password tidak sesuai.'),
    ).toBeInTheDocument()
  })
})