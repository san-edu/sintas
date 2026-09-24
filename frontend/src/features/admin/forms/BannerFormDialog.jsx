import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { getErrorMessage, getFieldErrors } from '../../../lib/errorMapping'
import {
  bannerFormSchema,
  bannerToForm,
  toBannerPayload,
} from '../../../schemas/admin'
import { useCreateBanner, useUpdateBanner } from '../hooks/useManageBanners'
import { DialogShell, FieldError, inputClass } from './DialogShell'

const EMPTY_FORM = {
  title: '',
  imageUrl: '',
  content: '',
  isActive: true,
  displayStartAt: '',
  displayEndAt: '',
}

export function BannerFormDialog({ open, banner, onClose }) {
  const [rootError, setRootError] = useState(null)
  const createBanner = useCreateBanner()
  const updateBanner = useUpdateBanner()
  const isEdit = Boolean(banner)
  const submitting = createBanner.isPending || updateBanner.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: banner ? bannerToForm(banner) : EMPTY_FORM,
  })

  const onSubmit = (values) => {
    setRootError(null)
    const payload = toBannerPayload(values)
    const mutation = isEdit ? updateBanner : createBanner
    mutation
      .mutateAsync(isEdit ? { id: banner.id, data: payload } : payload)
      .then(() => onClose())
      .catch((error) => {
        const entries = Object.entries(getFieldErrors(error))
        if (entries.length === 0) setRootError(getErrorMessage(error))
        else setRootError(entries.map(([, messages]) => messages[0]).join(' '))
      })
  }

  return (
    <DialogShell
      open={open}
      title={isEdit ? 'Ubah banner' : 'Banner baru'}
      description="Banner tampil di beranda pengguna sesuai periode dan statusnya."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {rootError}
          </p>
        ) : null}

        <div>
          <label htmlFor="banner-title" className="block text-sm font-medium text-slate-700">
            Judul
          </label>
          <input
            id="banner-title"
            className={inputClass}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'banner-title-error' : undefined}
            {...register('title')}
          />
          <FieldError id="banner-title-error" message={errors.title?.message} />
        </div>

        <div>
          <label htmlFor="banner-image" className="block text-sm font-medium text-slate-700">
            URL gambar
          </label>
          <input
            id="banner-image"
            type="url"
            placeholder="https://…"
            className={inputClass}
            aria-invalid={errors.imageUrl ? true : undefined}
            aria-describedby={errors.imageUrl ? 'banner-image-error' : undefined}
            {...register('imageUrl')}
          />
          <FieldError id="banner-image-error" message={errors.imageUrl?.message} />
        </div>

        <div>
          <label htmlFor="banner-content" className="block text-sm font-medium text-slate-700">
            Konten
          </label>
          <textarea
            id="banner-content"
            rows={3}
            className={inputClass}
            aria-invalid={errors.content ? true : undefined}
            aria-describedby={errors.content ? 'banner-content-error' : undefined}
            {...register('content')}
          />
          <FieldError id="banner-content-error" message={errors.content?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="banner-start" className="block text-sm font-medium text-slate-700">
              Mulai tampil
            </label>
            <input
              id="banner-start"
              type="datetime-local"
              className={inputClass}
              {...register('displayStartAt')}
            />
          </div>
          <div>
            <label htmlFor="banner-end" className="block text-sm font-medium text-slate-700">
              Selesai tampil
            </label>
            <input
              id="banner-end"
              type="datetime-local"
              className={inputClass}
              aria-invalid={errors.displayEndAt ? true : undefined}
              aria-describedby={errors.displayEndAt ? 'banner-end-error' : undefined}
              {...register('displayEndAt')}
            />
            <FieldError id="banner-end-error" message={errors.displayEndAt?.message} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-body-md text-ink-900">
          <input type="checkbox" className="h-4 w-4 rounded-radius-sm" {...register('isActive')} />
          Tampilkan banner ini
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Buat banner'}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}