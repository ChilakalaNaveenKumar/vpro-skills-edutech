import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

// Single axios instance used by every service module so base URL, headers,
// and auth-token interceptor logic live in one place - same purpose as
// web/src/services/apiClient.ts.
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the stored JWT (if any) to every outgoing request. Public
// endpoints (courses/batches listings, login) simply ignore an
// Authorization header they don't need. Unlike the web version's
// synchronous localStorage read, getToken() here is async (SecureStore has
// no sync API) - axios supports an async request interceptor, so this
// still runs before every request is sent.
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
