import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { assignmentItem, renderApp, teacherUser } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

const ASSIGNMENTS_URL = `${API_BASE_URL}/academic/assignments`

function renderAssignments(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: teacherUser } }),
    ),
    ...handlers,
  )
  renderApp(['/app/teacher/assignments'])
}

describe('halaman penugasan guru', () => {
  it('menampilkan penugasan aktif dengan tautan buat sesi yang memilih penugasan', async () => {
    renderAssignments([
      http.get(ASSIGNMENTS_URL, () =>
        HttpResponse.json({ data: [assignmentItem()] }),
      ),
    ])

    expect(await screen.findByText('Matematika')).toBeInTheDocument()
    expect(screen.getByText(/XII IPA 1/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Buat sesi' })
    expect(link).toHaveAttribute(
      'href',
      '/app/teacher/sessions/new?assignmentId=60',
    )
  })

  it('menampilkan state kosong saat tidak ada penugasan', async () => {
    renderAssignments([
      http.get(ASSIGNMENTS_URL, () => HttpResponse.json({ data: [] })),
    ])

    expect(
      await screen.findByRole('heading', { name: 'Belum ada penugasan aktif' }),
    ).toBeInTheDocument()
  })

  it('menampilkan error dan memuat ulang data', async () => {
    const user = userEvent.setup()
    renderAssignments([
      http.get(ASSIGNMENTS_URL, () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Server error.' } },
          { status: 500 },
        ),
      ),
    ])

    expect(
      await screen.findByText('Penugasan tidak dapat dimuat.'),
    ).toBeInTheDocument()

    server.use(
      http.get(ASSIGNMENTS_URL, () =>
        HttpResponse.json({ data: [assignmentItem({ subject: { id: 41, name: 'Fisika' } })] }),
      ),
    )
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('Fisika')).toBeInTheDocument()
  })
})
