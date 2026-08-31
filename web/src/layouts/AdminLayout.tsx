import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'

// Shared chrome for the admin section (Phase 8; brand/responsive/focus
// polish added in Phase 9, recolored + given a "back to site" link post-
// launch - see docs/ARCHITECTURE.md's "Design system" section). Topics and
// Questions aren't nav items here - they're reached by drilling in from
// Batches/Topics respectively. The Courses tab itself was removed
// 2026-08-31 (the admin picks a course from a fixed dropdown when
// creating a batch instead of managing courses as their own section) -
// /admin/courses and /admin/courses/:courseId/topics still work, just
// without a top-level nav link; "Manage Topics" is reached from each
// batch card on the Batches page instead.
const NAV_ITEMS = [
  { to: '/admin/batches', label: 'Batches' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/results', label: 'Results' },
]

export default function AdminLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#admin-main-content" className="skip-link rounded bg-brand-600 px-3 py-2 text-sm text-white">
        Skip to main content
      </a>

      <header className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">Admin Panel</h1>
          </div>
          <Link
            to="/"
            className={`rounded px-2 py-1 text-sm text-gray-600 hover:text-brand-600 ${FOCUS_RING}`}
          >
            ← Back to site
          </Link>
        </div>

        <nav className="mt-4 flex flex-wrap gap-x-1 gap-y-2 text-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-md px-3 py-1.5 ${FOCUS_RING} ${
                  isActive
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <div id="admin-main-content" className="p-4 sm:p-8">
        <Outlet />
      </div>
    </div>
  )
}
