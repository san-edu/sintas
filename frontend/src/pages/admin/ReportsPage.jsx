import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded'
import { useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { Pagination } from '../../components/common/Pagination'
import { Skeleton } from '../../components/common/Skeleton'
import { useIsOnline } from '../../hooks/useIsOnline'
import { getErrorMessage } from '../../lib/errorMapping'
import { reportFilterSchema, reportFiltersToQuery } from '../../schemas/admin'
import { useClasses } from '../../features/admin/hooks/useAcademicMasters'
import { useGlobalReport } from '../../features/admin/hooks/useGlobalReport'
import { useExportReport } from '../../features/teacher/hooks/useExportReport'
import { ReportDesktopTable, ReportMobileList } from '../../features/admin/views/ReportViews'

const BASE_FILTERS = { from: '', to: '', status: '', classId: '' }
const LIMIT = 20
const EMPTY_FILTERS = { from: undefined, to: undefined, status: undefined, classId: undefined }

const inputClass =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-black focus:outline-none'

export default function AdminReportsPage() {
  const online = useIsOnline()
  const [draft, setDraft] = useState(BASE_FILTERS)
  const [applied, setApplied] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [page, setPage] = useState(1)
  const exportReport = useExportReport()

  const classesQuery = useClasses({ page: 1, limit: 100 })
  const classes = classesQuery.data?.items ?? []

  const query = applied ?? EMPTY_FILTERS
  const reportQuery = useGlobalReport({ ...query, page, limit: LIMIT })
  const items = reportQuery.data?.items ?? []
  const meta = reportQuery.data?.meta ?? { total: 0, totalPages: 0 }

  const applyFilters = (event) => {
    event.preventDefault()
    const result = reportFilterSchema.safeParse(draft)
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors)
      return
    }
    setFieldErrors({})
    setApplied(reportFiltersToQuery(result.data))
    setPage(1)
  }

  const handleExport = () => {
    const result = reportFilterSchema.safeParse(draft)
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors)
      return
    }
    setFieldErrors({})
    exportReport.mutate(reportFiltersToQuery(result.data))
  }

  const isFiltered = applied !== null
  const fromError = fieldErrors.from?.[0]

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Laporan kehadiran</h1>
          <p className="mt-1 text-sm text-slate-700">
            Rekap seluruh sesi di sekolah. Filter opsional untuk mempersempit cakupan.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportReport.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-blue-500 hover:bg-blue-100/50 disabled:opacity-60"
        >
          <DownloadRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          {exportReport.isPending ? 'Mengekspor…' : 'Export XLSX'}
        </button>
      </div>

      <form
        onSubmit={applyFilters}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-black/10 bg-white p-4"
        noValidate
      >
        <div className="min-w-56">
          <label htmlFor="report-from" className="block text-sm font-medium text-slate-700">
            Dari tanggal
          </label>
          <input
            id="report-from"
            type="date"
            value={draft.from}
            onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
            aria-invalid={fromError ? true : undefined}
            aria-describedby={fromError ? 'report-from-error' : undefined}
            className={inputClass}
          />
          {fromError ? (
            <p id="report-from-error" className="mt-1 text-xs text-danger-700">
              {fromError}
            </p>
          ) : null}
        </div>
        <div className="min-w-56">
          <label htmlFor="report-to" className="block text-sm font-medium text-slate-700">
            Sampai tanggal
          </label>
          <input
            id="report-to"
            type="date"
            value={draft.to}
            onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="min-w-40">
          <label htmlFor="report-class" className="block text-sm font-medium text-slate-700">
            Kelas
          </label>
          <select
            id="report-class"
            value={draft.classId}
            onChange={(event) => setDraft((current) => ({ ...current, classId: event.target.value }))}
            className={inputClass}
          >
            <option value="">Semua kelas</option>
            {classes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-40">
          <label htmlFor="report-status" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="report-status"
            value={draft.status}
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
            className={inputClass}
          >
            <option value="">Semua status</option>
            <option value="HADIR">Hadir</option>
            <option value="TERLAMBAT">Terlambat</option>
            <option value="TIDAK_HADIR">Tidak hadir</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          <ManageSearchRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          Terapkan
        </button>
        {isFiltered ? (
          <button
            type="button"
            onClick={() => {
              setDraft(BASE_FILTERS)
              setApplied(null)
              setFieldErrors({})
              setPage(1)
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50"
          >
            Reset filter
          </button>
        ) : null}
      </form>

      <SectionState
        query={reportQuery}
        online={online}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            title={isFiltered ? 'Tidak ada data laporan' : 'Belum ada data laporan'}
            message={
              isFiltered
                ? 'Ubah rentang tanggal, kelas, atau status, lalu terapkan kembali.'
                : 'Data akan muncul setelah sesi absensi berjalan.'
            }
          />
        }
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2].map((value) => (
              <Skeleton key={value} className="h-16 w-full" />
            ))}
          </div>
        }
        errorTitle="Laporan tidak dapat dimuat."
      >
        <ReportMobileList items={items} />
        <ReportDesktopTable items={items} />

        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          label="laporan"
          onChange={setPage}
        />

        {exportReport.isError ? (
          <p role="alert" className="text-sm text-danger-700">
            {getErrorMessage(exportReport.error)}
          </p>
        ) : null}
      </SectionState>
    </section>
  )
}
