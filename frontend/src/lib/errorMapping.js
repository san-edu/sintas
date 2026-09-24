import { ApiError } from './apiClient'

const MESSAGE_BY_CODE = {
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
  UNAUTHENTICATED: 'Sesi Anda tidak valid atau sudah berakhir.',
  INVALID_CREDENTIALS: 'Username atau password tidak sesuai.',
  RESET_DATA_INVALID: 'Data pemulihan password tidak sesuai.',
  VALIDATION_ERROR: 'Periksa kembali data yang Anda isi.',
  FORBIDDEN: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
  NOT_FOUND: 'Data tidak ditemukan.',
  DUPLICATE_ATTENDANCE_SESSION: 'Sesi absensi untuk pertemuan tersebut sudah ada.',
  ASSIGNMENT_FORBIDDEN: 'Penugasan tidak aktif atau bukan milik Anda.',
  ATTENDANCE_SESSION_NOT_FOUND: 'Sesi absensi tidak ditemukan.',
  INVALID_TIMEZONE: 'Timezone sesi tidak sesuai konfigurasi sekolah.',
  INVALID_DATETIME: 'Waktu sesi tidak valid.',
  INVALID_TIME_RANGE: 'Waktu selesai harus setelah waktu mulai.',
  INVALID_SESSION_DATE: 'Tanggal sesi harus sesuai tanggal waktu sesi.',
  INVALID_QR_PAYLOAD: 'QR Code tidak valid.',
  ATTENDANCE_WINDOW_CLOSED: 'Sesi absensi belum dibuka atau sudah ditutup.',
  CLASS_MEMBERSHIP_REQUIRED: 'Anda bukan anggota kelas sesi ini.',
  DUPLICATE_USERNAME: 'Username sudah digunakan.',
  ACTIVE_CLASS_MEMBERSHIP_EXISTS: 'Siswa sudah memiliki kelas aktif.',
  DUPLICATE_ASSIGNMENT: 'Penugasan aktif sudah ada.',
  RATE_LIMITED: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  EXPORT_BUSY: 'Terlalu banyak export sedang diproses. Silakan coba lagi nanti.',
  NO_DATA_TO_EXPORT: 'Tidak ada data untuk diekspor.',
  REQUEST_TIMEOUT: 'Permintaan terlalu lama diproses.',
  NOT_READY: 'Layanan belum siap. Silakan coba lagi nanti.',
}

export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return MESSAGE_BY_CODE[error.code] ?? error.message ?? 'Terjadi kesalahan.'
  }
  return 'Terjadi kesalahan. Silakan coba lagi.'
}

export function getFieldErrors(error) {
  return error instanceof ApiError ? (error.fieldErrors ?? {}) : {}
}

export function getErrorCode(error) {
  return error instanceof ApiError ? error.code : null
}

export function isNetworkError(error) {
  return getErrorCode(error) === 'NETWORK_ERROR'
}