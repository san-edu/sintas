import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import QrScanner from 'qr-scanner'
import { requestCameraPermission } from './cameraPermission'

// Area scan dibatasi kotak tengah 1:1 (matching frame rasio 1:1) supaya QR
// di luar frame tidak terbaca, dan video tetap object-cover full width.
// PENTING: `object-cover` memotong video ke tengah, jadi kotak scan harus
// digeser dengan offset crop; kalau tidak, area yang dipindai tidak sama
// dengan bingkai yang dilihat siswa (QR di tengah/bawah jadi lambat terbaca).
function scanRegion(video) {
  const width = video.videoWidth || 720
  const height = video.videoHeight || 720
  const size = Math.min(width, height)
  const offsetX = (width - size) / 2
  const offsetY = (height - size) / 2
  const margin = Math.round(size * 0.1)
  return {
    x: Math.round(offsetX + margin),
    y: Math.round(offsetY + margin),
    width: Math.round(size - margin * 2),
    height: Math.round(size - margin * 2),
    downScaledWidth: 480,
    downScaledHeight: 480,
  }
}

// Frame scanner qr-scanner dengan rasio 1:1 responsif. Lifecycle kamera hidup
// di sini: probe izin (user gesture) → start → status; decode → stop lalu
// `onDetect(payload)`. `stop()` imperatif dipakai parent menghentikan stream.
export const QrScannerFrame = forwardRef(function QrScannerFrame(
  { onDetect, onStatusChange },
  ref,
) {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const onDetectRef = useRef(onDetect)
  const onStatusChangeRef = useRef(onStatusChange)

  useEffect(() => {
    onDetectRef.current = onDetect
    onStatusChangeRef.current = onStatusChange
  }, [onDetect, onStatusChange])

  useImperativeHandle(
    ref,
    () => ({
      stop() {
        scannerRef.current?.stop()
      },
    }),
    [],
  )

  useEffect(() => {
    let cancelled = false

    async function init() {
      onStatusChangeRef.current?.('starting')

      let supported
      try {
        supported = await QrScanner.hasCamera()
      } catch {
        supported = false
      }
      if (cancelled) return
      if (!supported) {
        onStatusChangeRef.current?.('unavailable')
        return
      }

      const permission = await requestCameraPermission()
      if (cancelled) return
      if (permission !== 'granted') {
        onStatusChangeRef.current?.(permission)
        return
      }

      const video = videoRef.current
      if (!video) {
        onStatusChangeRef.current?.('error')
        return
      }

      const scanner = new QrScanner(
        video,
        (result) => {
          const payload = typeof result === 'string' ? result : result.data
          if (!payload) return
          scanner.stop()
          onDetectRef.current?.(payload)
        },
        {
          preferredCamera: 'environment',
          maxScansPerSecond: 20,
          calculateScanRegion: scanRegion,
          returnDetailedScanResult: true,
        },
      )
      scannerRef.current = scanner

      try {
        await scanner.start()
      } catch {
        if (!cancelled) onStatusChangeRef.current?.('error')
        return
      }
      if (cancelled) return
      onStatusChangeRef.current?.('ready')
    }

    init()

    return () => {
      cancelled = true
      scannerRef.current?.destroy()
      scannerRef.current = null
    }
  }, [])

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
      <video
        ref={videoRef}
        playsInline
        muted
        aria-label="Tampilan kamera untuk memindai QR Code"
        className="h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[10%] rounded-xl border-2 border-white/80 shadow-[0_0_0_100vmax_rgba(19,34,56,0.35)]"
      />
    </div>
  )
})

export function QrScannerSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="aspect-square w-full animate-pulse rounded-radius-md bg-ink-900/10"
    />
  )
}