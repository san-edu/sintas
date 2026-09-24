// Probe izin kamera satu kali sebelum qr-scanner dinyalakan, supaya browser
// prompt hanya muncul setelah aksi pengguna ("Izinkan kamera") dan error dapat
// diklasifikasikan (denied/unavailable) — qr-scanner mengaburkan penyebab
// (docs/PROMPT_GUIDE.md F3).
export async function requestCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return 'unavailable'
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach((track) => track.stop())
    return 'granted'
  } catch (error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
      return 'denied'
    }
    return 'unavailable'
  }
}

// Status kamera yang diketahui frame scanner.
export const CAMERA_STATUS = Object.freeze({
  IDLE: 'idle',
  STARTING: 'starting',
  READY: 'ready',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error',
})