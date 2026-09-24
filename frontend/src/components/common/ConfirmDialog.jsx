import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'

const CONFIRM_CLASSES = {
  danger: 'bg-red-500 hover:bg-red-600',
  neutral: 'bg-blue-500 hover:bg-blue-600',
}

// Konfirmasi tindakan destruktif/permanen; focus dikembalikan ke tombol asal
// oleh Headless UI, dan tombol confirm dapat diaktifkan dari keyboard.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  busy = false,
  tone = 'danger',
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={() => (busy ? null : onClose())} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <WarningAmberRoundedIcon className="h-5! w-5! text-red-500" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-ink-900">
                {title}
              </DialogTitle>
              {message ? (
                <p className="mt-1 text-sm text-slate-700">{message}</p>
              ) : null}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${CONFIRM_CLASSES[tone] ?? CONFIRM_CLASSES.danger}`}
            >
              {busy ? 'Memproses…' : confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
