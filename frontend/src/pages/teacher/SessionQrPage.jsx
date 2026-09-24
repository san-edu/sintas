import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { Skeleton } from '../../components/common/Skeleton'
import { QrDisplay } from '../../features/teacher/QrDisplay'
import { useSessionQr } from '../../features/teacher/hooks/useSessionQr'
import { useIsOnline } from '../../hooks/useIsOnline'
import { formatSchoolDate, formatSchoolTime } from '../../lib/dateTime'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
        <Icon className="h-5! w-5!" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xs text-slate-700">{label}</span>
        <span className="block font-semibold text-ink-900">{value}</span>
      </span>
    </div>
  )
}

export default function TeacherSessionQrPage() {
  const online = useIsOnline()
  const { sessionId } = useParams()
  const id = Number(sessionId)
  const qrQuery = useSessionQr(id)
  const session = qrQuery.data

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <Link
          to="/app/teacher/sessions"
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-blue-500"
        >
          <ArrowBackRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          Kembali ke daftar sesi
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">QR sesi absensi</h1>
        <p className="mt-1 text-sm text-slate-700">
          Tampilkan QR Code ini di kelas. Siswa memindai untuk mencatat kehadiran
          selama jendela absensi.
        </p>
      </div>

      <SectionState
        query={qrQuery}
        online={online}
        empty={
          <EmptyState
            title="Sesi tidak ditemukan"
            message="Sesi mungkin sudah tidak tersedia atau bukan milik Anda."
          />
        }
        skeleton={
          <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
            <Skeleton className="h-72 w-72" />
            <Skeleton className="h-56 w-full" />
          </div>
        }
        errorTitle="QR sesi tidak dapat dimuat."
      >
        {session ? (
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <QrDisplay
              payload={session.qrPayload}
              title={`QR ${session.subjectName ?? 'sesi'} ${session.className ?? ''}`.trim()}
            />
            <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
              <DetailRow icon={MenuBookRoundedIcon} label="Mata pelajaran" value={session.subjectName ?? '—'} />
              <DetailRow icon={SchoolRoundedIcon} label="Kelas" value={session.className ?? '—'} />
              <DetailRow
                icon={CalendarMonthRoundedIcon}
                label="Tanggal sesi"
                value={formatSchoolDate(session.sessionDate)}
              />
              <DetailRow
                icon={ScheduleRoundedIcon}
                label="Jendela absensi"
                value={`${formatSchoolTime(session.startAt)}–${formatSchoolTime(session.endAt)}`}
              />
              <p className="rounded-lg bg-blue-100 p-3 text-sm text-slate-700">
                Dibuka 15 menit sebelum jam mulai hingga jam selesai. Status
                kehadiran dan keterlambatan dihitung server saat pemindaian.
              </p>
              <Link
                to={`/app/teacher/classes/${session.classId}/attendance`}
                className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-blue-500 hover:bg-blue-100/50"
              >
                Lihat detail kehadiran kelas
              </Link>
            </div>
          </div>
        ) : null}
      </SectionState>
    </section>
  )
}
