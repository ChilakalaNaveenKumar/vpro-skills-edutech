import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { denyConsent, grantConsent, readConsent } from '../analytics/consent'
import { TRACKING_CONFIGURED } from '../analytics/tags'

/**
 * Asks before any advertising tag is loaded.
 *
 * Three things make this honest rather than decorative:
 *
 *  - it only appears when a tracking ID is actually configured, so it is never
 *    a banner about nothing;
 *  - Decline is a real answer that leaves the scripts unfetched, not a
 *    "restricted mode"; and
 *  - the two buttons weigh the same. A greyed-out Decline next to a bright
 *    Accept is the pattern regulators single out, and there is no version of
 *    this site where nagging someone into being measured is worth it.
 *
 * It sits above the floating WhatsApp and call buttons, and pushes them up
 * while it is on screen, so it cannot bury the thing a visitor came to press.
 */
export default function ConsentNotice() {
  const [visible, setVisible] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!TRACKING_CONFIGURED) return
    if (readConsent() !== 'unset') return
    // A moment's delay so it slides in after the page has settled rather than
    // being the first thing that moves.
    const timer = window.setTimeout(() => setVisible(true), 700)
    return () => window.clearTimeout(timer)
  }, [])

  // How far to lift the floating buttons. Measured rather than guessed: this
  // notice is two lines on a wide screen and five on a narrow one, and a fixed
  // offset would either leave a gap or still cover the buttons. Re-measured on
  // resize because the wrap point moves with the viewport.
  useEffect(() => {
    document.body.classList.toggle('has-consent-notice', visible)
    if (!visible) {
      document.body.style.removeProperty('--consent-notice-height')
      return
    }

    const measure = () => {
      const height = panel.current?.offsetHeight
      if (height) {
        document.body.style.setProperty('--consent-notice-height', `${height + 16}px`)
      }
    }
    measure()

    const observer = new ResizeObserver(measure)
    if (panel.current) observer.observe(panel.current)
    return () => observer.disconnect()
  }, [visible])

  useEffect(
    () => () => {
      document.body.classList.remove('has-consent-notice')
      document.body.style.removeProperty('--consent-notice-height')
    },
    [],
  )

  if (!visible) return null

  function accept() {
    grantConsent()
    setVisible(false)
  }

  function decline() {
    denyConsent()
    setVisible(false)
  }

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Cookies and measurement"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-[color:var(--rule)] bg-[color:var(--ink)]/95 backdrop-blur-md"
    >
      <div className="shell flex flex-col gap-4 py-5 min-[901px]:flex-row min-[901px]:items-center min-[901px]:justify-between min-[901px]:gap-8">
        <p className="max-w-[68ch] text-[14.5px] leading-[1.55] text-[color:var(--on-ink-mute)]">
          We would like to measure which pages and adverts bring people here, using Google and Meta
          cookies. Nothing is loaded until you say yes, and saying no changes nothing else about
          the site.{' '}
          <Link
            to="/privacy"
            className="text-[color:var(--signal)] underline underline-offset-4 hover:opacity-80"
          >
            How we handle your data
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button type="button" onClick={decline} className="btn-secondary btn-compact flex-1">
            Decline
          </button>
          <button type="button" onClick={accept} className="btn-secondary btn-compact flex-1">
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
