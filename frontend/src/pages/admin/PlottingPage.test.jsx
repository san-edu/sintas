import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { adminUser, renderApp } from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

function page(items) {
  return { items, meta: { page: 1, limit: 20, total: items.length, totalPages: 1 } }
}

const classes = [
  { id: 30, name: 'XII IPA 1', educationLevelId: 3 },
  { id: 31, name: 'XII IPA 2', educationLevelId: 3 },
]
const teachers = [{ id: 2, username: 'teacher.demo', role: 'TEACHER', name: 'Guru Demo' }]
const students = [{ id: 1, username: 'student.demo', role: 'STUDENT', name: 'Siswa Demo' }]
const subjects = [{ id: 40, name: 'Matematika' }]

function renderPlotting(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () => HttpResponse.json({ data: { user: adminUser } })),
    http.get(`${API_BASE_URL}/academic/classes`, () => HttpResponse.json({ data: page(classes) })),
    http.get(`${API_BASE_URL}/academic/subjects`, () => HttpResponse.json({ data: page(subjects) })),
    http.get(`${API_BASE_URL}/users`, ({ request }) => {
      const role = new URL(request.url).searchParams.get('role')
      return HttpResponse.json({ data: page(role === 'TEACHER' ? teachers : students) })
    }),
    ...handlers,
  )
  renderApp(['/app/admin/plotting'])
}

describe('halaman penempatan admin', () => {
  it('menambah penugasan guru dengan payload guru/kelas/mapel', async () => {
    const user = userEvent.setup()
    let body = null
    renderPlotting([
      http.get(`${API_BASE_URL}/academic/assignments/manage`, () =>
        HttpResponse.json({ data: page([]) }),
      ),
      http.post(`${API_BASE_URL}/academic/assignments`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 61 } })
      }),
    ])

    await user.click(await screen.findByRole('tab', { name: 'Guru pada kelas' }))
    await user.click(screen.getByRole('button', { name: 'Tambah' }))

    const dialog = await screen.findByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Guru'), '2')
    await user.selectOptions(within(dialog).getByLabelText('Kelas'), '30')
    await user.selectOptions(within(dialog).getByLabelText('Mata pelajaran'), '40')
    await user.click(within(dialog).getByRole('button', { name: 'Tambah penugasan' }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ teacherId: 2, classId: 30, subjectId: 40 })
  })

  it('menonaktifkan penugasan lewat konfirmasi', async () => {
    const user = userEvent.setup()
    let body = null
    renderPlotting([
      http.get(`${API_BASE_URL}/academic/assignments/manage`, () =>
        HttpResponse.json({
          data: page([
            {
              id: 60,
              teacherId: 2,
              classId: 30,
              subjectId: 40,
              isActive: true,
              createdAt: '2026-09-01T02:00:00.000Z',
              class: { id: 30, name: 'XII IPA 1' },
              subject: { id: 40, name: 'Matematika' },
              teacher: { id: 2, name: 'Guru Demo' },
            },
          ]),
        }),
      ),
      http.patch(`${API_BASE_URL}/academic/assignments/60`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 60, isActive: false } })
      }),
    ])

    await user.click(await screen.findByRole('tab', { name: 'Guru pada kelas' }))
    await user.click(await screen.findByRole('button', { name: 'Nonaktifkan Guru Demo' }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Nonaktifkan' }))

    await waitFor(() => expect(body).toEqual({ isActive: false }))
  })

  it('menambah penempatan siswa dengan payload kelas/siswa', async () => {
    const user = userEvent.setup()
    let body = null
    renderPlotting([
      http.get(`${API_BASE_URL}/academic/memberships`, () => HttpResponse.json({ data: page([]) })),
      http.post(`${API_BASE_URL}/academic/memberships`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 1 } })
      }),
    ])

    await user.click(await screen.findByRole('button', { name: 'Tambah' }))

    const dialog = await screen.findByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Siswa'), '1')
    await user.selectOptions(within(dialog).getByLabelText('Kelas'), '30')
    await user.click(within(dialog).getByRole('button', { name: 'Tambah penempatan' }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ classId: 30, studentId: 1 })
  })
})
