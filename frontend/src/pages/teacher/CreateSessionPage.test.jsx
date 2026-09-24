import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  assignmentItem,
  renderApp,
  sessionItem,
  sessionQrItem,
  teacherUser,
} from '../../test/fixtures'
import { API_BASE_URL, server } from '../../test/server'

const SESSIONS_URL = `${API_BASE_URL}/attendance-sessions`

function renderCreate(handlers) {
  server.use(
    http.get(`${API_BASE_URL}/me`, () =>
      HttpResponse.json({ data: { user: teacherUser } }),
    ),
    http.get(`${API_BASE_URL}/academic/assignments`, () =>
      HttpResponse.json({ data: [assignmentItem()] }),
    ),
    ...handlers,
  )
  renderApp(['/app/teacher/sessions/new?assignmentId=60'])
}

describe('halaman buat sesi guru', () => {
  it('memilih penugasan dari query dan mengirim payload sesuai kontrak', async () => {
    const user = userEvent.setup()
    let body = null
    renderCreate([
      http.post(SESSIONS_URL, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: sessionItem() })
      }),
      http.get(`${API_BASE_URL}/attendance-sessions/10/qr`, () =>
        HttpResponse.json({ data: sessionQrItem() }),
      ),
    ])

    expect(await screen.findByText('Detail sesi')).toBeInTheDocument()
    expect(screen.getByLabelText('Mata pelajaran dan kelas')).toHaveValue('60')

    fireEvent.change(screen.getByLabelText('Tanggal sesi'), {
      target: { value: '2026-09-17' },
    })
    await user.click(screen.getByRole('button', { name: 'Buat sesi' }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({
      assignmentId: 60,
      sessionDate: '2026-09-17',
      startAt: '2026-09-17T08:00:00+07:00',
      endAt: '2026-09-17T09:00:00+07:00',
      timezone: 'Asia/Jakarta',
    })
    expect(
      await screen.findByRole('heading', { name: 'QR sesi absensi' }),
    ).toBeInTheDocument()
  })

  it('menampilkan error validasi bila jam selesai tidak setelah jam mulai', async () => {
    const user = userEvent.setup()
    let postCount = 0
    renderCreate([
      http.post(SESSIONS_URL, () => {
        postCount += 1
        return HttpResponse.json({ data: sessionItem() })
      }),
    ])

    await screen.findByText('Detail sesi')
    fireEvent.change(screen.getByLabelText('Jam mulai'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('Jam selesai'), { target: { value: '09:00' } })
    await user.click(screen.getByRole('button', { name: 'Buat sesi' }))

    expect(
      await screen.findByText('Waktu selesai harus setelah waktu mulai.'),
    ).toBeInTheDocument()
    expect(postCount).toBe(0)
  })

  it('menampilkan error sesi duplikat dari server', async () => {
    const user = userEvent.setup()
    renderCreate([
      http.post(SESSIONS_URL, () =>
        HttpResponse.json(
          {
            error: {
              code: 'DUPLICATE_ATTENDANCE_SESSION',
              message: 'Sesi absensi untuk pertemuan tersebut sudah ada.',
            },
          },
          { status: 409 },
        ),
      ),
    ])

    await screen.findByText('Detail sesi')
    await user.click(screen.getByRole('button', { name: 'Buat sesi' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sesi absensi untuk pertemuan tersebut sudah ada.',
    )
  })
})
