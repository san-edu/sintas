import InboxRoundedIcon from '@mui/icons-material/InboxRounded'

export function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-black/10 bg-white px-6 py-8 text-center">
      <InboxRoundedIcon className="h-8! w-8! text-slate-700" aria-hidden="true" />
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      {message ? <p className="max-w-md text-sm text-slate-700">{message}</p> : null}
      {action}
    </div>
  )
}
