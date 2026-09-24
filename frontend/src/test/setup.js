import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { queryClient } from '../lib/queryClient'
import { initialSessionState, useSessionStore } from '../stores/sessionStore'
import { server } from './server'

// Headless UI (menu/dialog) memakai ResizeObserver yang belum ada di jsdom.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverMock
}

// Unduhan memakai URL.createObjectURL + ankchor click; jsdom tidak
// mengimplementasikan navigasi ke blob, sehingga di-stub agar tidak memicu
// "Not implemented: navigation to another Document".
if (!URL.createObjectURL) globalThis.URL.createObjectURL = () => 'blob:mock'
if (!URL.revokeObjectURL) globalThis.URL.revokeObjectURL = () => {}
const originalAnchorClick = HTMLAnchorElement.prototype.click
HTMLAnchorElement.prototype.click = function () {
  if (this.download) return
  return originalAnchorClick.call(this)
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Tanpa backoff retry supaya state error/offline langsung muncul di test
// (test mengecek "Coba lagi" untuk memicu refetch secara manual).
queryClient.setDefaultOptions({
  queries: { ...queryClient.getDefaultOptions().queries, retry: 0 },
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  queryClient.clear()
  useSessionStore.setState(initialSessionState)
})

afterAll(() => server.close())