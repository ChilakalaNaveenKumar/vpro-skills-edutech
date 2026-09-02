import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import { CONTACT, whatsappUrl } from '../content/contact'
import LiveTicker from '../components/LiveTicker'
import { NAV_SECTIONS } from '../content/sections'

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

// Section anchors, shown only on the journey route. The last entry becomes the
// header's primary button, so it is peeled off the anchor list.
const ANCHORS = NAV_SECTIONS.slice(0, -1)
const PRIMARY_ANCHOR = NAV_SECTIONS[NAV_SECTIONS.length - 1]

// Shared chrome for public-facing pages.
//
// The journey route ("/") runs the paper-technical system: warm paper ground, a
// faint hairline grid, and orange used only as a signal. Every other route keeps
// the plain light shell the app pages already use, so this redesign cannot
// change how the portal or admin screens look.
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
  // The marketing surface: the home journey and every course page.
  const journey =
    location.pathname === '/' || location.pathname.startsWith('/courses')

  function handleLogout() {
    logout()
    setIsMenuOpen(false)
    navigate('/')
  }

  function navLinkClass(to: string) {
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`)
    if (journey) {
      return `rounded px-2 py-1 text-[color:var(--on-ink-mute)] transition-colors hover:text-[color:var(--on-ink)] ${FOCUS_RING}`
    }
    return `rounded px-2 py-1 ${FOCUS_RING} ${
      isActive ? 'font-medium text-brand-600' : 'text-gray-600 hover:text-gray-900'
    }`
  }

  const primaryLink =
    user?.role === 'ADMIN'
      ? { to: '/admin', label: 'Admin Panel' }
      : { to: '/dashboard', label: 'Dashboard' }

  const headerClass = journey
    ? 'sticky top-0 z-40 border-b border-[color:var(--rule)] bg-[color-mix(in_oklch,var(--ink),transparent_18%)] px-4 py-3.5 backdrop-blur-md'
    : 'sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur'

  return (
    <div
      data-journey={journey ? '' : undefined}
      className={`flex min-h-screen flex-col ${journey ? '' : 'bg-white'}`}
    >

      {journey && <LiveTicker />}

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
              ANCHORS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`rounded px-1 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[color:var(--on-ink-faint)] transition-colors hover:text-[color:var(--on-ink)] ${FOCUS_RING}`}
                >
                  {section.label}
                </a>
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
              <a
                href={`#${PRIMARY_ANCHOR.id}`}
                className={`rounded-full bg-[color:var(--signal)] px-5 py-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[color:var(--ink)] transition-[filter] duration-200 hover:brightness-110 ${FOCUS_RING}`}
              >
                Book a free demo
              </a>
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
            {journey &&
              NAV_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded px-2 py-2 text-[color:var(--on-ink-mute)] ${FOCUS_RING}`}
                >
                  {section.label}
                </a>
              ))}
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
            <div>
              <p className={journey ? 'display text-lg text-[color:var(--on-ink)]' : 'font-display text-base text-white'}>
                VPro Skills
              </p>
              <p className="mt-1">{CONTACT.location}</p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={whatsappUrl('footer_whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded ${FOCUS_RING} hover:text-[color:var(--signal)]`}
              >
                WhatsApp {CONTACT.phoneDisplay}
              </a>
              <a href={`tel:${CONTACT.phoneDial}`} className={`rounded ${FOCUS_RING} hover:text-[color:var(--signal)]`}>
                Call {CONTACT.phoneDisplay}
              </a>
            </div>
            <nav className="flex flex-col gap-2">
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
