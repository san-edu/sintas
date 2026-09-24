import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

export function DialogShell({ open, title, description, onClose, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-bold text-ink-900">
                {title}
              </DialogTitle>
              {description ? (
                <p className="mt-1 text-sm text-slate-700">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="rounded-lg p-1.5 text-slate-700 hover:bg-blue-100/50 hover:text-ink-900"
            >
              <CloseRoundedIcon className="h-5! w-5!" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export function FieldError({ id, message }) {
  return message ? (
    <p id={id} className="mt-1 text-sm text-danger-700">
      {message}
    </p>
  ) : null
}

export const inputClass =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-black focus:outline-none'
