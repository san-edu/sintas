import { z } from 'zod'

// Validasi form awal manual fallback saja; backend tetap memvalidasi ulang
// payload (frontend/GUIDE.md section 2). Format opaque base64url 43 karakter
// mengikuti kontrak backend (docs/API_CONTRACT.md section 10).
export const scanPayloadRegex = /^[A-Za-z0-9_-]{43}$/

export const manualScanSchema = z.object({
  qrPayload: z
    .string()
    .trim()
    .min(1, 'Kode QR wajib diisi.')
    .max(255, 'Kode QR terlalu panjang.')
    .refine(
      (value) => scanPayloadRegex.test(value),
      'Format kode QR tidak dikenali. Periksa kembali kode dari guru.',
    ),
})