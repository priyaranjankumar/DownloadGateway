import axios from 'axios'
import { ROUTES } from './constants'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject JWT token into headers if it exists
api.interceptors.request.use(
  (config: any) => {
    // Attach timestamp to track when the request was initiated
    config.sentAt = Date.now()

    const token = localStorage.getItem('token')
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`)
      } else {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercept 401 responses to auto-logout or redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const loginTimeStr = localStorage.getItem('loginTime')
      const loginTime = loginTimeStr ? parseInt(loginTimeStr) : 0
      const sentAt = error.config?.sentAt || 0

      // Only clean token and redirect if the request was sent AFTER our last login session was created.
      // This prevents stale, in-flight background requests (sent before login) from deleting the new token.
      if (sentAt >= loginTime) {
        if (window.location.pathname !== ROUTES.LOGIN) {
          localStorage.removeItem('token')
          window.location.href = ROUTES.LOGIN
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
