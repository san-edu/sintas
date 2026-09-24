import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

export function ErrorState({ title = 'Terjadi kesalahan', message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-black/10 bg-white px-6 py-8 text-center"
    >
      <WarningAmberRoundedIcon
        className="h-8! w-8! text-danger-700"
        aria-hidden="true"
      />
      <h2 className="text-base font-bold text-ink-900">{title}</h2>
      {message ? (
        <p className="max-w-md text-sm text-slate-700">{message}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  )
}
