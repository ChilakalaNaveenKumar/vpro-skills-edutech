import * as SecureStore from 'expo-secure-store'

// Centralizes the JWT's SecureStore key so apiClient's request interceptor
// and AuthContext never duplicate the string literal - same purpose as
// web/src/utils/tokenStorage.ts, but backed by expo-secure-store (encrypted
// on-device storage) instead of localStorage, and async since SecureStore
// has no synchronous API.
const TOKEN_STORAGE_KEY = 'vpro_access_token'

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token)
  } catch {
    // SecureStore can throw in rare cases (device storage full, keychain
    // unavailable, etc.) - a failed write just means the session won't
    // survive an app restart, not a reason to crash the login flow.
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY)
  } catch {
    // See setToken - safe to ignore.
  }
}
