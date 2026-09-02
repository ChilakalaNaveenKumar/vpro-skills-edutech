import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Wraps admin-only routes (/admin/...). Same loading/redirect shape as
// ProtectedRoute.tsx, plus a role check: an anonymous visitor goes to
// /login (same as ProtectedRoute), but a logged-in non-admin goes to
// /dashboard rather than /login, since they ARE authenticated - they're
// just not allowed into this section.
export default function AdminRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
