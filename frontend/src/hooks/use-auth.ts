import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { LoginRequest, TokenResponse, UserResponse, SetupRequest, ChangePasswordRequest } from '@/types/auth'

export function useCurrentUser() {
  const token = localStorage.getItem('token')
  return useQuery<UserResponse | null>({
    queryKey: QUERY_KEYS.CURRENT_USER,
    queryFn: async () => {
      if (!token) return null
      try {
        const { data } = await api.get<UserResponse>('/auth/me')
        return data
      } catch (err) {
        return null
      }
    },
    enabled: !!token,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation<TokenResponse, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const { data } = await api.post<TokenResponse>('/auth/login', credentials)
      return data
    },
    onSuccess: (data) => {
      localStorage.setItem('loginTime', Date.now().toString())
      localStorage.setItem('token', data.access_token)
      queryClient.clear()
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    localStorage.removeItem('token')
    queryClient.clear()
    window.location.href = ROUTES.LOGIN
  }
}

export function useSetup() {
  const queryClient = useQueryClient()
  return useMutation<UserResponse, Error, SetupRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<UserResponse>('/auth/setup', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER })
    },
  })
}

export function useChangePassword() {
  return useMutation<any, Error, ChangePasswordRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/change-password', payload)
      return data
    },
  })
}
