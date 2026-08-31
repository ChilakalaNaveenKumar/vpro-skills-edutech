import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'

// Time-of-day greeting instead of a bare "Hi, {name}" - reads warmer and
// more deliberate in the header than a flat label (user feedback,
// post-launch redesign round 2).
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Shared header/footer chrome for public-facing pages (Phase 9 redesign;
// recolored + restyled post-launch with the real brand logo - see
// docs/ARCHITECTURE.md's "Design system" section).
//
// Two rounds of post-launch nav feedback, both real UX issues, not just
// taste:
// 1) The nav used to show the signed-in user's bare full_name as the
//    dashboard link's text (e.g. "Admin" for the demo admin account)
//    right next to the actual admin-only "Admin" panel link - visually
//    indistinguishable for any user literally named "Admin".
// 2) For an admin, having both a "Dashboard" link (the student "My
//    Courses" view - meaningless for an account that isn't enrolled in
//    anything) and a separate "Admin Panel" link was redundant. Admins now
//    get a single primary nav link straight to the Admin Panel; students
//    still get a single "Dashboard" link. The user's name moved out of
//    the link entirely into a plain, non-clickable, time-of-day greeting.
export default function PublicLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    setIsMenuOpen(false)
    navigate('/')
  }

  function navLinkClass(to: string) {
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`)
    return `rounded px-2 py-1 ${FOCUS_RING} ${
      isActive ? 'font-medium text-brand-600' : 'text-gray-600 hover:text-gray-900'
    }`
  }

  const primaryLink =
    user?.role === 'ADMIN' ? { to: '/admin', label: 'Admin Panel' } : { to: '/dashboard', label: 'Dashboard' }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a href="#main-content" className="skip-link rounded bg-brand-600 px-3 py-2 text-sm text-white">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className={`rounded ${FOCUS_RING}`}>
            <Logo />
          </Link>

          {/* Inline nav from sm upward */}
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            {user ? (
              <>
                <span className="text-gray-500">
                  {getGreeting()}, <span className="font-medium text-ink">{user.full_name}</span>
                </span>
                <span className="h-4 w-px bg-gray-200" aria-hidden="true" />
                <Link to={primaryLink.to} className={navLinkClass(primaryLink.to)}>
                  {primaryLink.label}
                </Link>
                <Link to="/results" className={navLinkClass('/results')}>
                  My Results
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`rounded px-2 py-1 text-gray-600 hover:text-gray-900 ${FOCUS_RING}`}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className={navLinkClass('/login')}>
                Student Login
              </Link>
            )}
          </nav>

          {/* Hamburger toggle below sm */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className={`rounded p-2 text-gray-700 sm:hidden ${FOCUS_RING}`}
          >
            {isMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu panel below sm */}
        {isMenuOpen && (
          <nav className="mt-3 flex flex-col gap-1 text-sm sm:hidden">
            {user ? (
              <>
                <span className="px-2 py-1 text-gray-500">
                  {getGreeting()}, <span className="font-medium text-ink">{user.full_name}</span>
                </span>
                <Link
                  to={primaryLink.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={navLinkClass(primaryLink.to)}
                >
                  {primaryLink.label}
                </Link>
                <Link
                  to="/results"
                  onClick={() => setIsMenuOpen(false)}
                  className={navLinkClass('/results')}
                >
                  My Results
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`rounded px-2 py-1 text-left text-gray-600 hover:text-gray-900 ${FOCUS_RING}`}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className={navLinkClass('/login')}
              >
                Student Login
              </Link>
            )}
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-ink px-4 py-6 text-sm text-gray-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} VPRO Skills EduTech</span>
          <span className="text-gray-400">Practical, instructor-led tech training.</span>
        </div>
      </footer>
    </div>
  )
}
