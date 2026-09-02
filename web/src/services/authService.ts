import apiClient from './apiClient'
import type { LoginRequest, TokenResponse, User } from '../types'

// POST /api/auth/login takes JSON (not the OAuth2 form-encoded convention),
// per docs/ARCHITECTURE.md's Authentication section.
export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/api/auth/login', payload)
  return response.data
}

// GET /api/auth/me - used both to hydrate the logged-in user's profile
// right after login and to rehydrate auth state from a stored token on
// page load.
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/api/auth/me')
  return response.data
}
