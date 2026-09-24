import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CircularProgress from '@mui/material/CircularProgress'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Skeleton } from '../../components/common/Skeleton'
import { SectionState } from '../../components/feedback/SectionState'
import { useIsOnline } from '../../hooks/useIsOnline'
import { isNetworkError } from '../../lib/errorMapping'
import { CAMERA_STATUS } from '../../features/attendance/cameraPermission'
import { ManualScanForm } from '../../features/attendance/ManualScanForm'
import { QrScannerFrame } from '../../features/attendance/QrScannerFrame'
import { ScanCameraFallback } from '../../features/attendance/ScanCameraFallback'
import { ScanPermissionPrompt } from '../../features/attendance/ScanPermissionPrompt'
import { ScanPrecheck } from '../../features/attendance/ScanPrecheck'
import { ScanResultPanel } from '../../features/attendance/ScanResultPanel'
import { cameraAnnouncement } from '../../features/attendance/scanFlow'
import { useScanAttendance } from '../../features/attendance/hooks/useScanAttendance'
import { useTodaySchedule } from '../../features/attendance/hooks/useTodaySchedule'

const STAGE = Object.freeze({
  PRECHECK: 'precheck',
  PERMISSION: 'permission',
  SCANNING: 'scanning',
  MANUAL: 'manual',
  RESULT: 'result',
})

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-ink-900/60 text-white">
      {children}
    </div>
  )
}

export default function StudentScanPage() {
  const online = useIsOnline()
  const [searchParams] = useSearchParams()
  const sessionId = Number(searchParams.get('session'))

  const today = useTodaySchedule()
  const items = today.data ?? []
  const sessionItem = Number.isInteger(sessionId) && sessionId > 0
      ? (items.find((item) => item.id === sessionId) ?? null)
      : null

  const mutation = useScanAttendance()
  const submittingRef = useRef(false)

  const [stage, setStage] = useState(STAGE.PRECHECK)
  const [camera, setCamera] = useState(CAMERA_STATUS.IDLE)
  const [scanAttempt, setScanAttempt] = useState(0)
  const [lastPayload, setLastPayload] = useState('')
  const [scanResult, setScanResult] = useState(null)

  const busy = mutation.isPending

  const submitScan = (payload) => {
    if (submittingRef.current) return
    submittingRef.current = true
    mutation.mutate(payload, {
      onSuccess: (data) => {
        submittingRef.current = false
        setScanResult({ kind: 'success', data })
        setStage(STAGE.RESULT)
      },
      onError: (error) => {
        submittingRef.current = false
        setScanResult({ kind: 'error', error })
        setStage(STAGE.RESULT)
      },
    })
  }

  const handleDetect = (payload) => {
    if (submittingRef.current) return
    setLastPayload(payload)
    submitScan(payload)
  }

  const handleBegin = () => setStage(STAGE.PERMISSION)

  const handleAllowCamera = () => {
    setCamera(CAMERA_STATUS.IDLE)
    setScanAttempt((value) => value + 1)
    setStage(STAGE.SCANNING)
  }

  const handleRetryScan = () => {
    setScanResult(null)
    setCamera(CAMERA_STATUS.IDLE)
    setScanAttempt((value) => value + 1)
    setStage(STAGE.SCANNING)
  }

  const handleOpenManual = () => setStage(STAGE.MANUAL)

  const handleManualSubmit = (payload) => {
    setLastPayload(payload)
    submitScan(payload)
  }

  const handleBackToPrecheck = () => {
    setScanResult(null)
    setStage(STAGE.PRECHECK)
  }

  const showStarting = camera === CAMERA_STATUS.IDLE || camera === CAMERA_STATUS.STARTING
  const announceText =
    camera === CAMERA_STATUS.DENIED ||
    camera === CAMERA_STATUS.UNAVAILABLE ||
    camera === CAMERA_STATUS.ERROR
      ? ''
      : busy
        ? 'QR Code terdeteksi. Memproses absensi.'
        : cameraAnnouncement(camera)

  let body

  if (stage === STAGE.RESULT && scanResult) {
    body = (
      <ScanResultPanel
        result={scanResult}
        sessionItem={sessionItem}
        onRetry={handleRetryScan}
        onManual={handleOpenManual}
      />
    )
  } else if (stage === STAGE.SCANNING) {
    body = (
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="relative">
          <QrScannerFrame
            key={scanAttempt}
            onDetect={handleDetect}
            onStatusChange={setCamera}
          />
          {showStarting ? (
            <Overlay>
              <CircularProgress size={24} color="inherit" aria-hidden="true" />
              <p className="text-sm font-semibold">Menyalakan kamera…</p>
            </Overlay>
          ) : null}
          {busy ? (
            <Overlay>
              <CircularProgress size={24} color="inherit" aria-hidden="true" />
              <p className="text-sm font-semibold">Memproses absensi…</p>
            </Overlay>
          ) : null}
        </div>

        {camera === CAMERA_STATUS.READY ? (
          <p className="text-center text-sm text-slate-700">
            Arahkan kamera ke QR Code yang ditampilkan guru. Scan otomatis
            berhenti saat kode terdeteksi.
          </p>
        ) : null}

        <ScanCameraFallback
          camera={camera}
          onRetry={handleRetryScan}
          onManual={handleOpenManual}
          onBack={handleBackToPrecheck}
        />

        {camera === CAMERA_STATUS.READY ? (
          <button
            type="button"
            onClick={handleOpenManual}
            disabled={busy}
            className="flex w-full items-center justify-center rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-500 disabled:opacity-50"
          >
            Masukkan kode manual
          </button>
        ) : null}

        <p role="status" className="sr-only">
          {announceText}
        </p>
      </div>
    )
  } else if (stage === STAGE.MANUAL) {
    body = (
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold text-ink-900">
            Masukkan kode QR manual
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Salin kode QR dari guru lalu tempel di kolom berikut. Kode dikirim ke
            server; status dan keterlambatan ditentukan server.
          </p>
          <div className="mt-4">
            <ManualScanForm
              initialPayload={lastPayload}
              isPending={busy}
              onSubmit={handleManualSubmit}
            />
          </div>
          <button
            type="button"
            onClick={handleBackToPrecheck}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500"
          >
            <ArrowBackRoundedIcon className="h-4! w-4!" />
            Kembali
          </button>
        </div>
      </div>
    )
  } else if (stage === STAGE.PERMISSION) {
    body = (
      <ScanPermissionPrompt
        onAllow={handleAllowCamera}
        onBack={handleBackToPrecheck}
        onManual={handleOpenManual}
      />
    )
  } else {
    const hasSessionFilter = Number.isInteger(sessionId) && sessionId > 0
    if (hasSessionFilter && (today.isPending && !today.data)) {
      body = (
        <div className="mx-auto max-w-md">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )
    } else if (
      hasSessionFilter &&
      (today.isError || !online || isNetworkError(today.error)) &&
      !today.data
    ) {
      body = (
        <SectionState
          query={today}
          online={online}
          skeleton={<Skeleton className="h-64 w-full rounded-lg" />}
          errorTitle="Jadwal tidak dapat dimuat."
          empty={null}
        />
      )
    } else {
      body = (
        <ScanPrecheck
          sessionItem={sessionItem}
          missed={hasSessionFilter && !sessionItem}
          onBegin={handleBegin}
          onManual={handleOpenManual}
        />
      )
    }
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-4">
      <div>
        <Link
          to="/app/student/schedule"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500"
        >
          <ArrowBackRoundedIcon className="h-4! w-4!" />
          Kembali ke jadwal
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink-900">
          {stage === STAGE.RESULT ? 'Hasil scan' : 'Scan QR absensi'}
        </h1>
        {sessionItem ? (
          <p className="mt-1 text-sm text-slate-700">
            {sessionItem.subjectName} • {sessionItem.className}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-700">
            Arahkan kamera ke QR Code yang ditampilkan guru untuk mencatat
            kehadiran.
          </p>
        )}
      </div>

      {body}
    </section>
  )
}
