import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  assignmentItem,
  renderApp,
  sessionItem,
  teacherUser,
} from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

function renderDashboard(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: teacherUser } }),
    ),
    ...handlers,
  )
  renderApp(['/app/teacher'])
}

describe('beranda guru', () => {
  it('menampilkan ringkasan penugasan dan sesi', async () => {
    renderDashboard([
      http.get(`${API_BASE_URL}/academic/assignments`, () =>
        HttpResponse.json({ data: [assignmentItem()] }),
      ),
      http.get(`${API_BASE_URL}/attendance-sessions`, () =>
        HttpResponse.json({ data: [sessionItem()] }),
      ),
    ])

    expect(
      await screen.findByRole('heading', { name: 'Beranda Guru' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Penugasan aktif')).toBeInTheDocument()
    expect(screen.getByText('Sesi dibuat')).toBeInTheDocument()
    expect((await screen.findAllByText('Matematika')).length).toBeGreaterThan(0)
  })

  it('menampilkan ajakan membuat sesi saat belum ada sesi', async () => {
    renderDashboard([
      http.get(`${API_BASE_URL}/academic/assignments`, () =>
        HttpResponse.json({ data: [assignmentItem()] }),
      ),
      http.get(`${API_BASE_URL}/attendance-sessions`, () =>
        HttpResponse.json({ data: [] }),
      ),
    ])

    expect(
      await screen.findByRole('heading', { name: 'Belum ada sesi absensi' }),
    ).toBeInTheDocument()
  })
})
