import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/fixtures'

describe('halaman masuk', () => {
  it('menampilkan error validasi ketika form kosong disubmit', async () => {
    const user = userEvent.setup()
    renderApp(['/login'])
    await screen.findByRole('heading', { name: 'Masuk' })
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByText('Username wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Password wajib diisi.')).toBeInTheDocument()
  })

  it('menampilkan banner password berhasil diubah setelah reset', async () => {
    renderApp([{ pathname: '/login', state: { passwordReset: true } }])
    expect(
      await screen.findByText('Password berhasil diubah. Silakan masuk kembali.'),
    ).toBeInTheDocument()
  })
})