import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import CtaLink from '../components/CtaLink'
import { prefersReducedMotion } from '../motion/prefersReducedMotion'
import { CONTACT, HOURS_DISPLAY } from '../content/contact'

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
// The comp's header. Three of these are sections of the home page rather than
// routes; they carry the leading "/" so they still resolve from a course page
// or /batches, where paid traffic often lands directly.
const ROUTES = [
  { to: '/courses', label: 'Courses' },
  { to: '/batches', label: 'Batch schedule' },
  { to: '/#loop', label: 'How it runs' },
  { to: '/#trainer', label: 'Trainer' },
  { to: '/#faq', label: 'FAQ' },
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

  // React Router does not scroll to a hash target, and three header links are
  // home-page sections. Runs after paint so the section exists when we look.
  useEffect(() => {
    if (!location.hash) return
    const target = document.getElementById(location.hash.slice(1))
    if (!target) return
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [location.pathname, location.hash])

  function handleLogout() {
    logout()
    setIsMenuOpen(false)
    navigate('/')
  }

  function isCurrent(to: string) {
    if (to.includes('#')) return false
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
    return `mono whitespace-nowrap tracking-[0.14em] transition-colors ${FOCUS_RING} ${
      isCurrent(to) ? 'text-[color:var(--signal)]' : 'text-[color:var(--on-ink)] hover:text-[color:var(--signal)]'
    }`
  }

  const primaryLink =
    user?.role === 'ADMIN'
      ? { to: '/admin', label: 'Admin Panel' }
      : { to: '/dashboard', label: 'Dashboard' }

  // Fixed rather than sticky on the marketing surface: the hero is a full
  // viewport tall and its canvas has to run behind the header, which a header
  // that occupies flow space would push off the bottom of the screen.
  const headerClass = journey
    ? 'fixed inset-x-0 top-0 z-40 bg-[rgb(20_22_28_/_0.72)] backdrop-blur-md'
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
        <div
          className={
            journey
              ? 'mx-auto flex max-w-[1560px] items-center gap-[clamp(20px,3vw,44px)] px-[44px] py-3.5 max-md:px-[var(--gutter)]'
              : 'mx-auto flex max-w-6xl items-center justify-between gap-6'
          }
        >
          <Link
            to="/"
            className={
              journey
                ? `flex flex-none items-center bg-[color:var(--on-ink)] px-3 py-2 ${FOCUS_RING}`
                : `rounded ${FOCUS_RING}`
            }
          >
            <Logo size={journey ? 'plate' : 'md'} />
          </Link>

          <nav
            className={
              journey
                ? 'ml-auto hidden items-center gap-[clamp(18px,2.2vw,30px)] md:flex'
                : 'hidden items-center gap-5 text-sm md:flex'
            }
          >
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

            {!journey &&
              (user ? (
                <>
                  <span className="text-gray-500">
                    {getGreeting()}, <span className="font-medium">{user.full_name}</span>
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
                    className={`rounded px-2 py-1 text-gray-600 hover:text-gray-900 ${FOCUS_RING}`}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link to="/login" className={navLinkClass('/login')}>
                  Student login
                </Link>
              ))}
          </nav>

          {journey && (
            <div className="ml-[clamp(12px,2vw,26px)] hidden flex-none items-center gap-2.5 md:flex">
              {user ? (
                <>
                  <Link to={primaryLink.to} className={railLinkClass(primaryLink.to)}>
                    {primaryLink.label}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`mono tracking-[0.14em] text-[color:var(--on-ink)] transition-colors hover:text-[color:var(--signal)] ${FOCUS_RING}`}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link to="/login" className={`btn-secondary btn-compact ${FOCUS_RING}`}>
                  Student login
                </Link>
              )}
              <Link to="/batches" className={`btn-primary btn-compact ${FOCUS_RING}`}>
                Reserve my seat
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className={`ml-auto rounded p-2 md:hidden ${journey ? 'text-[color:var(--on-ink)]' : 'text-gray-700'} ${FOCUS_RING}`}
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

      {journey ? (
        <footer className="relative z-10 mx-auto w-full max-w-[1560px] px-[44px] pt-[34px] pb-[60px] shadow-[inset_0_1px_0_0_var(--rule)] max-md:px-[var(--gutter)]">
          <div className="flex flex-wrap justify-between gap-7">
            <div className="flex min-w-0 flex-col gap-[14px]">
              <Link to="/" className={`self-start bg-[color:var(--on-ink)] px-3 py-2 ${FOCUS_RING}`}>
                <Logo size="plate" />
              </Link>
              <p className="max-w-[26ch] text-[14px] leading-[1.6] text-[color:var(--on-ink-faint)]">
                {CONTACT.addressLines.map((line, index) => (
                  <span key={line}>
                    {index > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="mono text-[color:var(--on-ink-faint)]">Talk to us</span>
              <CtaLink
                cta="footer_whatsapp"
                chapter="footer"
                className={`text-[14px] text-[color:var(--on-ink)] ${FOCUS_RING} hover:text-[color:var(--signal)]`}
              >
                WhatsApp {CONTACT.phoneDisplay}
              </CtaLink>
              <a
                href={`tel:${CONTACT.phoneDial}`}
                className={`text-[14px] text-[color:var(--on-ink)] ${FOCUS_RING} hover:text-[color:var(--signal)]`}
              >
                Call {CONTACT.phoneDisplay}
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="mono text-[color:var(--on-ink-faint)]">Hours</span>
              <span className="text-[14px] text-[color:var(--on-ink-faint)]">{HOURS_DISPLAY}</span>
              <Link
                to="/login"
                className={`pt-1.5 text-[14px] text-[color:var(--on-ink)] ${FOCUS_RING} hover:text-[color:var(--signal)]`}
              >
                Student login
              </Link>
            </div>
          </div>

          {/* Not in the comp. The app has these routes and an app-store listing
              has to link them, so they get a quiet row rather than a column. */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[color:var(--on-ink-faint)]">
            <span>© {new Date().getFullYear()} VProSkills.com</span>
            <Link to="/privacy" className={`${FOCUS_RING} hover:text-[color:var(--on-ink)]`}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={`${FOCUS_RING} hover:text-[color:var(--on-ink)]`}>
              Terms &amp; Conditions
            </Link>
            <Link to="/data-deletion" className={`${FOCUS_RING} hover:text-[color:var(--on-ink)]`}>
              Data Deletion
            </Link>
          </div>
        </footer>
      ) : (
        <footer className="border-t border-gray-200 bg-ink px-4 py-6 text-sm text-gray-300">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-base text-white">VPro Skills</p>
                <p className="mt-1">{CONTACT.location}</p>
              </div>
              <div className="flex flex-col gap-2">
                <CtaLink cta="footer_whatsapp" chapter="footer" className={`rounded ${FOCUS_RING}`}>
                  WhatsApp {CONTACT.phoneDisplay}
                </CtaLink>
                <a href={`tel:${CONTACT.phoneDial}`} className={`rounded ${FOCUS_RING}`}>
                  Call {CONTACT.phoneDisplay}
                </a>
              </div>
              <nav className="flex flex-col gap-2">
                <Link to="/privacy" className={`rounded ${FOCUS_RING}`}>
                  Privacy Policy
                </Link>
                <Link to="/terms" className={`rounded ${FOCUS_RING}`}>
                  Terms &amp; Conditions
                </Link>
                <Link to="/data-deletion" className={`rounded ${FOCUS_RING}`}>
                  Data Deletion
                </Link>
              </nav>
            </div>
            <p className="text-gray-400">
              © {new Date().getFullYear()} VProSkills.com. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
