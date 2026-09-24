import CircularProgress from '@mui/material/CircularProgress'

export function PageLoader({ label = 'Memuat…' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3">
        <CircularProgress size={32} aria-hidden="true" />
        <p className="text-sm text-slate-700">{label}</p>
      </div>
    </div>
  )
}
