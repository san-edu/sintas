import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { Skeleton } from '../../components/common/Skeleton'
import {
  ClassAttendanceDesktopTable,
  ClassAttendanceMobileList,
} from '../../features/teacher/AttendanceViews'
import { useClassAttendance } from '../../features/teacher/hooks/useClassAttendance'
import { useExportReport } from '../../features/teacher/hooks/useExportReport'
import { useIsOnline } from '../../hooks/useIsOnline'
import { HISTORY_STATUS_OPTIONS } from '../../lib/attendanceStatus'
import { schoolDateOffset, todaySchoolDate } from '../../lib/dateTime'
import { getErrorMessage } from '../../lib/errorMapping'
import { historyFilterSchema } from '../../schemas/history'

const DEFAULT_FILTERS = {
  from: schoolDateOffset(-6),
  to: todaySchoolDate(),
  status: '',
}

function FieldError({ id, message }) {
  return message ? (
    <p id={id} className="mt-1 text-sm text-danger-700">{message}</p>
  ) : null
}

const inputClass =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-black focus:outline-none'

export default function TeacherClassAttendancePage() {
  const online = useIsOnline()
  const { classId: classIdParam } = useParams()
  const classId = Number(classIdParam)
  const [applied, setApplied] = useState({ ...DEFAULT_FILTERS, page: 1 })
  const [exportMessage, setExportMessage] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(historyFilterSchema),
    defaultValues: DEFAULT_FILTERS,
  })

  const filters = {
    from: applied.from || undefined,
    to: applied.to || undefined,
    status: applied.status || undefined,
    page: applied.page,
  }
  const attendance = useClassAttendance(classId, filters)
  const exportReport = useExportReport()

  const items = attendance.data?.items ?? []
  const total = attendance.data?.meta?.total ?? 0
  const totalPages = attendance.data?.meta?.totalPages ?? 0
  const page = filters.page

  const onApply = (values) => {
    setApplied((current) => ({
      ...current,
      from: values.from || '',
      to: values.to || '',
      status: values.status ?? '',
      page: 1,
    }))
  }

  const onReset = () => {
    reset(DEFAULT_FILTERS)
    setApplied({ ...DEFAULT_FILTERS, page: 1 })
  }

  const onExport = async () => {
    setExportMessage(null)
    try {
      await exportReport.mutateAsync({
        classId,
        from: applied.from || undefined,
        to: applied.to || undefined,
        status: applied.status || undefined,
      })
      setExportMessage({ tone: 'success', text: 'Laporan kehadiran sedang diunduh.' })
    } catch (error) {
      setExportMessage({ tone: 'error', text: getErrorMessage(error) })
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link
          to="/app/teacher/sessions"
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-blue-500"
        >
          <ArrowBackRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          Kembali ke daftar sesi
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">
          Detail kehadiran kelas
        </h1>
        <p className="mt-1 text-sm text-slate-700">
          Kehadiran dihitung server per pertemuan, termasuk status tidak hadir
          untuk sesi yang sudah berakhir.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onApply)}
        className="rounded-xl border border-black/10 bg-white p-4"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="attendance-from" className="block text-sm font-medium text-slate-700">
              Dari tanggal
            </label>
            <input
              id="attendance-from"
              type="date"
              className={inputClass}
              aria-invalid={errors.from ? true : undefined}
              aria-describedby={errors.from ? 'attendance-from-error' : undefined}
              {...register('from')}
            />
            <FieldError id="attendance-from-error" message={errors.from?.message} />
          </div>
          <div>
            <label htmlFor="attendance-to" className="block text-sm font-medium text-slate-700">
              Sampai tanggal
            </label>
            <input
              id="attendance-to"
              type="date"
              className={inputClass}
              aria-invalid={errors.to ? true : undefined}
              aria-describedby={errors.to ? 'attendance-to-error' : undefined}
              {...register('to')}
            />
            <FieldError id="attendance-to-error" message={errors.to?.message} />
          </div>
          <div>
            <label htmlFor="attendance-status" className="block text-sm font-medium text-slate-700">
              Status
            </label>
            <select id="attendance-status" className={inputClass} {...register('status')}>
              {HISTORY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <SearchRoundedIcon className="h-4! w-4!" aria-hidden="true" />
              Terapkan
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50"
            >
              <RefreshRoundedIcon className="h-4! w-4!" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-700" aria-live="polite">
          {attendance.isPending
            ? 'Memuat kehadiran…'
            : total > 0
              ? `${total} catatan ditemukan.`
              : 'Belum ada catatan pada periode ini.'}
        </p>
        <button
          type="button"
          onClick={onExport}
          disabled={exportReport.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-blue-500 hover:bg-blue-100/50 disabled:opacity-60"
        >
          <DownloadRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          {exportReport.isPending ? 'Menyiapkan…' : 'Export XLSX'}
        </button>
      </div>

      {exportMessage ? (
        <p
          role={exportMessage.tone === 'error' ? 'alert' : 'status'}
          className={
            exportMessage.tone === 'error'
              ? 'rounded-lg bg-red-500 px-3 py-2 text-sm text-white'
              : 'rounded-lg bg-green-500/10 px-3 py-2 text-sm font-semibold text-green-600'
          }
        >
          {exportMessage.text}
        </p>
      ) : null}

      <SectionState
        query={attendance}
        online={online}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            title="Belum ada catatan pada periode ini"
            message="Coba ubah rentang tanggal atau filter status."
            action={
              <button
                type="button"
                onClick={onReset}
                className="mt-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Ubah filter
              </button>
            }
          />
        }
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((value) => (
              <Skeleton key={value} className="h-20 w-full" />
            ))}
          </div>
        }
        errorTitle="Detail kehadiran tidak dapat dimuat."
      >
        <ClassAttendanceMobileList items={items} />
        <ClassAttendanceDesktopTable items={items} />

        <nav
          aria-label="Navigasi halaman kehadiran"
          className="flex items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={() => setApplied((current) => ({ ...current, page: page - 1 }))}
            disabled={page <= 1}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-slate-700">
            Halaman {page} dari {totalPages || 1}
          </span>
          <button
            type="button"
            onClick={() => setApplied((current) => ({ ...current, page: page + 1 }))}
            disabled={page >= totalPages}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Berikutnya
          </button>
        </nav>
      </SectionState>
    </section>
  )
}
