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
  (config) => {
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
      // Only clean token and redirect if we are not already on the login page.
      // This prevents stale background retries from wiping out the new token during login.
      if (window.location.pathname !== ROUTES.LOGIN) {
        localStorage.removeItem('token')
        window.location.href = ROUTES.LOGIN
      }
    }
    return Promise.reject(error)
  }
)

export default api
