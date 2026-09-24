import { randomBytes } from 'node:crypto'

export function createQrPayload() {
  return randomBytes(32).toString('base64url')
}

export function isOpaqueQrPayload(payload) {
  return typeof payload === 'string' && /^[A-Za-z0-9_-]{43}$/.test(payload)
}