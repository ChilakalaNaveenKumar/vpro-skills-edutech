import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Wraps routes that require a logged-in user (e.g. /dashboard). Shows a
// brief loading state while AuthContext's initial token rehydration is in
// flight, then either renders the nested route or redirects to /login.
export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
