import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser, login as loginRequest } from '../services/authService'
import { clearToken, getToken, setToken } from '../utils/tokenStorage'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  // True while the initial rehydration (checking a stored token via
  // GET /api/auth/me) is in flight - RootNavigator shows a loading view
  // instead of picking a stack while this is true. Unlike
  // web/src/contexts/AuthContext.tsx, this always starts true: the web
  // version can synchronously read localStorage at useState init to skip
  // loading when there's provably no token, but SecureStore has no
  // synchronous API, so that optimization isn't available here.
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    getToken()
      .then((token) => {
        if (!token) {
          return null
        }
        return getCurrentUser()
      })
      .then((currentUser) => {
        if (isMounted && currentUser) setUser(currentUser)
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

  async function login(email: string, password: string): Promise<void> {
    const { access_token } = await loginRequest({ email, password })
    await setToken(access_token)
    const currentUser = await getCurrentUser()
    setUser(currentUser)
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
