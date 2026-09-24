import { QRCodeSVG } from 'qrcode.react'

// Menampilkan QR statis dari payload yang dikembalikan backend. Frontend tidak
// membuat, merotasi, atau memvalidasi payload sesi (frontend/GUIDE.md section 6).
export function QrDisplay({ payload, title, size = 256 }) {
  if (!payload) return null
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-black/10 bg-white p-6">
      <div className="rounded-lg bg-white p-4">
        <QRCodeSVG
          value={payload}
          size={size}
          level="M"
          marginSize={2}
          title={title}
        />
      </div>
      <p className="max-w-sm text-center text-sm text-slate-700">
        Arahkan kamera siswa ke QR Code ini selama jendela absensi.
      </p>
    </div>
  )
}
