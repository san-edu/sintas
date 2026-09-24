import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { roleHome } from '../lib/permissions'
import { clearUserScopedCache } from '../lib/queryClient'
import {
  authKeys,
  forgotPassword,
  login,
  logout,
  updateMe,
} from '../services/authService'
import { useSessionStore } from '../stores/sessionStore'

export function useAuthLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess(user) {
      clearUserScopedCache(queryClient)
      useSessionStore.getState().setUser(user)
      queryClient.setQueryData(authKeys.session, user)
      navigate(roleHome(user.role), { replace: true })
    },
  })
}

export function useAuthLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess() {
      clearUserScopedCache(queryClient)
      queryClient.removeQueries({ queryKey: authKeys.session })
      useSessionStore.getState().clearSession()
      navigate('/login', { replace: true })
    },
  })
}

export function useAuthForgotPassword() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: forgotPassword,
    onSuccess() {
      navigate('/login', { replace: true, state: { passwordReset: true } })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMe,
    onSuccess(user) {
      queryClient.setQueryData(authKeys.session, user)
      useSessionStore.getState().setUser(user)
    },
  })
}