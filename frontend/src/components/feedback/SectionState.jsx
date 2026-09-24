import { getErrorMessage, isNetworkError } from '../../lib/errorMapping'
import { ErrorState } from './ErrorState'
import { OfflineNotice } from './OfflineNotice'

// Penyederhana render loading/offline/error/empty untuk satu section yang
// memakai query React Query. Merender `children` hanya bila data layak
// ditampilkan (loading selesai, online, tanpa error, dan tidak kosong).
export function SectionState({
  query,
  online = true,
  isEmpty = false,
  empty = null,
  skeleton = null,
  errorTitle = 'Data tidak dapat dimuat.',
  children,
}) {
  if (query.isPending && !query.data) return skeleton

  const offline = !online || isNetworkError(query.error)
  if (offline) {
    return (
      <OfflineNotice
        updatedAt={query.dataUpdatedAt}
        onRetry={() => query.refetch()}
      />
    )
  }
  if (query.isError) {
    return (
      <ErrorState
        title={errorTitle}
        message={getErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    )
  }
  if (isEmpty) return empty
  return children ?? null
}