import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { getErrorMessage, getFieldErrors } from '../../../lib/errorMapping'
import { classSchema, educationLevelSchema, subjectSchema, toClassPayload } from '../../../schemas/admin'
import {
  useCreateClass,
  useCreateEducationLevel,
  useCreateSubject,
  useUpdateClass,
  useUpdateEducationLevel,
  useUpdateSubject,
} from '../hooks/useAcademicMasters'
import { DialogShell, FieldError, inputClass } from './DialogShell'

const CONFIG = {
  educationLevel: {
    title: 'Jenjang',
    noun: 'jenjang',
    schema: educationLevelSchema,
  },
  subject: {
    title: 'Mata pelajaran',
    noun: 'mata pelajaran',
    schema: subjectSchema,
  },
  class: {
    title: 'Kelas',
    noun: 'kelas',
    schema: classSchema,
  },
}

export function MasterFormDialog({ open, type, item, levels, onClose }) {
  const [rootError, setRootError] = useState(null)
  const config = CONFIG[type]
  const isEdit = Boolean(item)
  const createLevel = useCreateEducationLevel()
  const updateLevel = useUpdateEducationLevel()
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const createClass = useCreateClass()
  const updateClass = useUpdateClass()

  const submitting = [createLevel, updateLevel, createSubject, updateSubject, createClass, updateClass]
    .some((mutation) => mutation.isPending)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(config.schema),
    defaultValues:
      type === 'class'
        ? { name: item?.name ?? '', educationLevelId: item ? String(item.educationLevelId) : '' }
        : { name: item?.name ?? '', educationLevelId: '' },
  })

  const onSubmit = (values) => {
    setRootError(null)
    const payload = type === 'class' ? toClassPayload(values) : { name: values.name.trim() }
    const options = {
      educationLevel: { create: createLevel, update: updateLevel },
      subject: { create: createSubject, update: updateSubject },
      class: { create: createClass, update: updateClass },
    }[type]
    const mutation = isEdit ? options.update : options.create
    mutation
      .mutateAsync(isEdit ? { id: item.id, data: payload } : payload)
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
      title={`${isEdit ? 'Ubah' : 'Tambah'} ${config.title}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {rootError}
          </p>
        ) : null}

        <div>
          <label htmlFor="master-name" className="block text-sm font-medium text-slate-700">
            Nama
          </label>
          <input
            id="master-name"
            className={inputClass}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'master-name-error' : undefined}
            {...register('name')}
          />
          <FieldError id="master-name-error" message={errors.name?.message} />
        </div>

        {type === 'class' ? (
          <div>
            <label htmlFor="master-level" className="block text-sm font-medium text-slate-700">
              Jenjang
            </label>
            <select
              id="master-level"
              className={inputClass}
              aria-invalid={errors.educationLevelId ? true : undefined}
              aria-describedby={errors.educationLevelId ? 'master-level-error' : undefined}
              {...register('educationLevelId')}
            >
              <option value="">Pilih jenjang</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
            <FieldError id="master-level-error" message={errors.educationLevelId?.message} />
          </div>
        ) : null}

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
            {submitting ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : `Tambah ${config.title}`}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}