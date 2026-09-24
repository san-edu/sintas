import { create } from 'zustand'

export const initialSessionState = {
  user: null,
  status: 'loading',
  sessionExpired: false,
}

export const useSessionStore = create((set) => ({
  ...initialSessionState,
  setUser(user) {
    set({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
      sessionExpired: false,
    })
  },
  setUnauthenticated({ expired = false } = {}) {
    set((state) => ({
      user: null,
      status: 'unauthenticated',
      sessionExpired: expired || state.sessionExpired,
    }))
  },
  handleUnauthorized() {
    set((state) =>
      state.status === 'authenticated'
        ? { user: null, status: 'unauthenticated', sessionExpired: true }
        : state,
    )
  },
  clearSession() {
    set({ user: null, status: 'unauthenticated', sessionExpired: false })
  },
}))