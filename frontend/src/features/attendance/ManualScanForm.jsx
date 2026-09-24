import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import PrimaryButton from '../../components/common/PrimaryButton'
import { manualScanSchema } from '../../schemas/scan'

const inputClass =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-ink-900 focus:outline-none'

// Fallback manual bila kamera tidak tersedia/ditolak (docs/PROMPT_GUIDE.md F3).
// Payload dikirim sama persis ke POST /attendance-scans; status ditentukan
// server, bukan validasi client.
export function ManualScanForm({ initialPayload = '', isPending, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(manualScanSchema),
    defaultValues: { qrPayload: initialPayload },
  })

  return (
    <form
      onSubmit={handleSubmit(
        ({ qrPayload }) => onSubmit(qrPayload),
        () => {},
      )}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor="manual-qr-payload" className="block text-sm font-medium text-slate-700">
          Kode QR
        </label>
        <input
          id="manual-qr-payload"
          type="text"
          autoComplete="off"
          spellCheck="false"
          className={inputClass}
          aria-invalid={errors.qrPayload ? true : undefined}
          aria-describedby={
            errors.qrPayload ? 'manual-qr-payload-error' : undefined
          }
          placeholder="Salin kode dari guru, lalu tempel di sini"
          {...register('qrPayload')}
        />
        {errors.qrPayload ? (
          <p id="manual-qr-payload-error" className="mt-1 text-sm text-red-500">
            {errors.qrPayload.message}
          </p>
        ) : null}
      </div>
      <PrimaryButton
        type="submit"
        disabled={isPending}
        className="uppercase"
      >
        {isPending ? 'Memproses…' : 'Kirim absensi'}
      </PrimaryButton>
    </form>
  )
}
