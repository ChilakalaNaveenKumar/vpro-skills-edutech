import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import CtaLink from '../components/CtaLink'
import { CONTACT } from '../content/contact'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'

// Time-of-day greeting instead of a bare "Hi, {name}" - reads warmer and
// more deliberate in the header than a flat label (user feedback,
// post-launch redesign round 2).
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// The header carries route navigation only. In-page section navigation is the
// SectionRail's job on the home page, and duplicating it here was actively
// harmful: the anchor list rendered on every marketing page, but the sections it
// points at only exist on "/", so on a course page or About the whole nav was
// dead links. Paid traffic frequently lands directly on a course page, so that
// was a dead end for exactly the visitors we pay for.
const ROUTES = [
  { to: '/courses', label: 'Courses' },
  { to: '/batches', label: 'Batch schedule' },
  { to: '/about', label: 'About' },
]

// Shared chrome for public-facing pages.
//
// The exact marketing allowlist receives the dark editorial shell. Everything
// else keeps the light app shell, so portal and admin screens cannot inherit
// these scoped theme tokens.
//
// Two rounds of post-launch nav feedback, both real UX issues, not just taste:
// 1) The nav used to show the signed-in user's bare full_name as the dashboard
//    link's text, visually indistinguishable from the admin-only "Admin" link.
// 2) Admins got both a student "Dashboard" link and an "Admin Panel" link.
//    Admins now get one primary link; the name is a plain greeting.
export default function PublicLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // The marketing surface: home, courses, the batch schedule and about.
  const journey =
    location.pathname === '/' ||
    location.pathname.startsWith('/courses') ||
    location.pathname === '/batches' ||
    location.pathname === '/about'

  function handleLogout() {
    logout()
    setIsMenuOpen(false)
    navigate('/')
  }

  function isCurrent(to: string) {
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  function navLinkClass(to: string) {
    if (journey) {
      // The active route has to be visible here too. Without it a visitor deep in
      // /courses/<slug> has no indication of where they are in the site.
      return `rounded px-2 py-1 transition-colors ${FOCUS_RING} ${
        isCurrent(to)
          ? 'text-[color:var(--on-ink)]'
          : 'text-[color:var(--on-ink-mute)] hover:text-[color:var(--on-ink)]'
      }`
    }
    return `rounded px-2 py-1 ${FOCUS_RING} ${
      isCurrent(to) ? 'font-medium text-brand-600' : 'text-gray-600 hover:text-gray-900'
    }`
  }

  function railLinkClass(to: string) {
    return `mono rounded px-1 py-1 transition-colors ${FOCUS_RING} ${
      isCurrent(to) ? 'text-[color:var(--signal)]' : 'text-[color:var(--on-ink-faint)] hover:text-[color:var(--on-ink)]'
    }`
  }

  const primaryLink =
    user?.role === 'ADMIN'
      ? { to: '/admin', label: 'Admin Panel' }
      : { to: '/dashboard', label: 'Dashboard' }

  const headerClass = journey
    ? 'sticky top-0 z-40 border-b border-[color:var(--rule)] bg-[color-mix(in_srgb,var(--ink),transparent_12%)] px-[var(--gutter)] py-4 backdrop-blur-md'
    : 'sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur'

  return (
    <div
      data-journey={journey ? '' : undefined}
      className={`flex min-h-screen flex-col ${journey ? '' : 'bg-white'}`}
    >

      <a href="#main-content" className="skip-link rounded bg-brand-600 px-3 py-2 text-sm text-white">
        Skip to main content
      </a>

      <header className={headerClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <Link to="/" className={`rounded ${FOCUS_RING}`}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-5 text-sm md:flex">
            {journey &&
              ROUTES.map((route) => (
                <Link
                  key={route.to}
                  to={route.to}
                  aria-current={isCurrent(route.to) ? 'page' : undefined}
                  className={railLinkClass(route.to)}
                >
                  {route.label}
                </Link>
              ))}

            {user ? (
              <>
                <span className={journey ? 'text-[color:var(--on-ink-faint)]' : 'text-gray-500'}>
                  {getGreeting()},{' '}
                  <span className="font-medium text-[color:var(--on-ink)]">{user.full_name}</span>
                </span>
                <Link to={primaryLink.to} className={navLinkClass(primaryLink.to)}>
                  {primaryLink.label}
                </Link>
                <Link to="/results" className={navLinkClass('/results')}>
                  My Results
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`rounded px-2 py-1 ${
                    journey ? 'text-[color:var(--on-ink-mute)] hover:text-[color:var(--on-ink)]' : 'text-gray-600 hover:text-gray-900'
                  } ${FOCUS_RING}`}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={
                  journey
                    ? `rounded px-1 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[color:var(--on-ink-faint)] transition-colors hover:text-[color:var(--on-ink)] ${FOCUS_RING}`
                    : navLinkClass('/login')
                }
              >
                Student login
              </Link>
            )}

            {journey && (
              <Link
                to="/batches"
                className={`btn-primary ${FOCUS_RING}`}
              >
                Reserve my seat
              </Link>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className={`rounded p-2 md:hidden ${journey ? 'text-[color:var(--on-ink)]' : 'text-gray-700'} ${FOCUS_RING}`}
          >
            {isMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {isMenuOpen && (
          <nav
            className={`mt-3 flex flex-col gap-1 p-3 text-sm md:hidden ${
              journey ? 'border border-[color:var(--rule)] bg-[color:var(--ink-2)]' : ''
            }`}
          >
            {journey && (
              <>
                {ROUTES.map((route) => (
                  <Link
                    key={route.to}
                    to={route.to}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isCurrent(route.to) ? 'page' : undefined}
                    className={navLinkClass(route.to)}
                  >
                    {route.label}
                  </Link>
                ))}

                <Link
                  to="/batches"
                  onClick={() => setIsMenuOpen(false)}
                  className={`btn-primary mt-1 ${FOCUS_RING}`}
                >
                  Reserve my seat
                </Link>
              </>
            )}
            {user ? (
              <>
                <span className={`px-2 py-1 ${journey ? 'text-[color:var(--on-ink-faint)]' : 'text-gray-500'}`}>
                  {getGreeting()}, <span className="font-medium text-[color:var(--on-ink)]">{user.full_name}</span>
                </span>
                <Link
                  to={primaryLink.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={navLinkClass(primaryLink.to)}
                >
                  {primaryLink.label}
                </Link>
                <Link to="/results" onClick={() => setIsMenuOpen(false)} className={navLinkClass('/results')}>
                  My Results
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`rounded px-2 py-1 text-left ${
                    journey ? 'text-[color:var(--on-ink-mute)]' : 'text-gray-600 hover:text-gray-900'
                  } ${FOCUS_RING}`}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className={navLinkClass('/login')}>
                Student login
              </Link>
            )}
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer
        className={
          journey
            ? 'relative z-10 border-t border-[color:var(--rule)] px-6 py-14 text-sm text-[color:var(--on-ink-mute)]'
            : 'border-t border-gray-200 bg-ink px-4 py-6 text-sm text-gray-300'
        }
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className={journey ? 'text-[color:var(--on-ink)]' : ''}>
              <p className={journey ? 'display text-lg text-[color:var(--on-ink)]' : 'font-display text-base text-white'}>
                VPro Skills
              </p>
              <p className="mt-1">{CONTACT.location}</p>
            </div>
            <div className="flex flex-col gap-2">
              <CtaLink
                cta="footer_whatsapp"
                chapter="footer"
                className={`flex flex-col gap-1 rounded ${FOCUS_RING} hover:text-[color:var(--signal)]`}
              >
                <span className={journey ? 'mono text-[color:var(--on-ink-faint)]' : ''}>WhatsApp</span>
                <span className={journey ? 'text-[color:var(--on-ink)]' : ''}>{CONTACT.phoneDisplay}</span>
              </CtaLink>
              <a
                href={`tel:${CONTACT.phoneDial}`}
                className={`flex flex-col gap-1 rounded ${FOCUS_RING} hover:text-[color:var(--signal)]`}
              >
                <span className={journey ? 'mono text-[color:var(--on-ink-faint)]' : ''}>Call</span>
                <span className={journey ? 'text-[color:var(--on-ink)]' : ''}>{CONTACT.phoneDisplay}</span>
              </a>
            </div>
            <nav className={`flex flex-col gap-2 ${journey ? 'text-[color:var(--on-ink)]' : ''}`}>
              <Link to="/privacy" className={`rounded ${FOCUS_RING} hover:text-[color:var(--signal)]`}>
                Privacy Policy
              </Link>
              <Link to="/terms" className={`rounded ${FOCUS_RING} hover:text-[color:var(--signal)]`}>
                Terms &amp; Conditions
              </Link>
              <Link to="/data-deletion" className={`rounded ${FOCUS_RING} hover:text-[color:var(--signal)]`}>
                Data Deletion
              </Link>
            </nav>
          </div>
          <p className={journey ? 'text-[color:var(--on-ink-faint)]' : 'text-gray-400'}>
            © {new Date().getFullYear()} VProSkills.com. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
