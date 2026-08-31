import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

// Single axios instance used by every service module so base URL, headers,
// and auth-token interceptor logic live in one place.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the stored JWT (if any) to every outgoing request. Public
// endpoints (courses/batches listings, login) simply ignore an
// Authorization header they don't need.
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
