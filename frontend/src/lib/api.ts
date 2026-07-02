import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject JWT token into every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      // Axios 1.x uses AxiosHeaders — set via both methods for maximum compatibility
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
)

// Response interceptor: do NOT auto-redirect or clear tokens here.
// Auth state is managed by AppLayout and LoginPage, not by a global interceptor.
// This eliminates the race condition where stale 401s wipe a freshly stored token.

export default api
