// Centralizes the JWT's localStorage key so apiClient's request
// interceptor and AuthContext never duplicate the string literal.
const TOKEN_STORAGE_KEY = 'vpro_access_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // localStorage can throw in rare cases (private-browsing quota limits,
    // etc.) - a failed write just means the session won't survive a
    // refresh, not a reason to crash the login flow.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // See setToken - safe to ignore.
  }
}
