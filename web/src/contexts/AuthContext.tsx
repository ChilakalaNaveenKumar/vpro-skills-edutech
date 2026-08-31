import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser, login as loginRequest } from '../services/authService'
import { clearToken, getToken, setToken } from '../utils/tokenStorage'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  // True only while the initial rehydration (checking a stored token via
  // GET /api/auth/me) is in flight - lets ProtectedRoute avoid bouncing a
  // logged-in user to /login for a frame on page refresh.
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // No stored token at all means there's nothing to rehydrate - start
  // "not loading" immediately instead of setting state inside the effect
  // just to flip it back off on the same tick.
  const [isLoading, setIsLoading] = useState<boolean>(() => getToken() !== null)

  useEffect(() => {
    if (!getToken()) {
      return
    }

    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) setUser(currentUser)
      })
      .catch(() => {
        // Stored token is missing, expired, or the account was
        // deactivated - treat it as logged out rather than stuck loading.
        clearToken()
        if (isMounted) setUser(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function login(email: string, password: string): Promise<User> {
    const { access_token } = await loginRequest({ email, password })
    setToken(access_token)
    const currentUser = await getCurrentUser()
    setUser(currentUser)
    return currentUser
  }

  function logout(): void {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
