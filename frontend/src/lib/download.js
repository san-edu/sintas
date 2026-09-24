// Nama file export diambil dari header Content-Disposition yang dikirim
// backend (frontend/GUIDE.md section 5); fallback hanya bila header absen.
export function filenameFromDisposition(
  disposition,
  fallback = 'laporan-kehadiran.xlsx',
) {
  if (!disposition) return fallback
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  if (!match) return fallback
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

// Mengunduh Blob dari response API tanpa merender datanya ke DOM.
export function downloadBlob(blob, filename) {
  if (typeof URL.createObjectURL !== 'function') return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
