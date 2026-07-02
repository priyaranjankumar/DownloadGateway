import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { QUERY_KEYS } from '@/lib/constants'
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
  return useMutation<TokenResponse, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const { data } = await api.post<TokenResponse>('/auth/login', credentials)
      return data
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token)
      // Force a FULL page reload. This is critical:
      // - Destroys all React state and React Query cache
      // - Kills all in-flight/retrying background HTTP requests
      // - The fresh page load reads the token from localStorage
      // - All new queries fire with the Authorization header
      // Using navigate() instead causes a race condition where stale
      // unauthenticated requests return 401 and interfere with the new session.
      window.location.href = '/'
    },
  })
}

export function useLogout() {
  return () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
}

export function useSetup() {
  return useMutation<UserResponse, Error, SetupRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<UserResponse>('/auth/setup', payload)
      return data
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
