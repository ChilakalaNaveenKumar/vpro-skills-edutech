import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Seo from '../seo/Seo'

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

  return (
    <>
      {/* One <Seo> for the whole signed-in area rather than one per page.
          index.html no longer carries a title, so without this these tabs
          would be blank; and since none of these pages should be indexed,
          there is nothing per-page for a title to earn. */}
      <Seo
        path="/dashboard"
        title="Your dashboard"
        description="Your courses, assessments and results."
        noIndex
      />
      <Outlet />
    </>
  )
}
