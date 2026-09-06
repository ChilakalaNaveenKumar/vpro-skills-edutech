/**
 * Loads GA4, Google Ads and the Meta Pixel, and reports events to whichever of
 * them are configured.
 *
 * Every ID comes from the environment. With none set - a local checkout, a
 * preview build, or production before the ad accounts exist - nothing loads,
 * nothing is requested, and the consent notice does not appear either, because
 * there would be nothing to consent to. That is deliberate: a site that shows a
 * cookie banner while setting no cookies trains people to dismiss the question
 * without reading it.
 */

import { onConsentChange, readConsent } from './consent'

// `any` throughout the global declarations below: these describe third-party
// globals whose real signatures are variadic and untyped, and inventing a
// narrower type here would only be a guess that future calls have to fight.
declare global {
  interface Window {
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
    fbq?: ((...args: any[]) => void) & { callMethod?: (...args: any[]) => void; queue?: any[] }
    _fbq?: unknown
  }
}

const env = import.meta.env

/** e.g. G-XXXXXXXXXX */
export const GA4_ID = (env.VITE_GA4_MEASUREMENT_ID as string | undefined)?.trim() || ''
/** e.g. AW-123456789 */
export const GOOGLE_ADS_ID = (env.VITE_GOOGLE_ADS_ID as string | undefined)?.trim() || ''
/**
 * The label half of a Google Ads conversion action, e.g. AbC-D_efGh. Google
 * shows it as "AW-123456789/AbC-D_efGh"; only the part after the slash goes
 * here. Without it, Google Ads loads and attributes page views but records no
 * conversions, so the campaign has nothing to optimise towards.
 */
export const GOOGLE_ADS_CONVERSION_LABEL =
  (env.VITE_GOOGLE_ADS_CONVERSION_LABEL as string | undefined)?.trim() || ''
/** e.g. 1234567890123456 */
export const META_PIXEL_ID = (env.VITE_META_PIXEL_ID as string | undefined)?.trim() || ''

/** True when at least one tag is configured, so there is something to ask about. */
export const TRACKING_CONFIGURED = Boolean(GA4_ID || GOOGLE_ADS_ID || META_PIXEL_ID)

let loaded = false

function injectScript(src: string): void {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

function loadGoogle(): void {
  if (!GA4_ID && !GOOGLE_ADS_ID) return

  window.dataLayer = window.dataLayer || []
  // The real gtag is `function gtag(){dataLayer.push(arguments)}` - it pushes
  // the arguments object itself, not an array of them. A rest-parameter version
  // pushes the wrong shape and the tag silently ignores every call.
  function gtag() {
    window.dataLayer!.push(arguments)
  }
  window.gtag = gtag as typeof window.gtag

  window.gtag!('js', new Date())

  // One script serves both products; the first configured ID loads it.
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID || GOOGLE_ADS_ID}`)

  if (GA4_ID) {
    // Routing is client-side, so automatic page_view would only ever fire once.
    // trackPageview below sends them instead.
    window.gtag!('config', GA4_ID, { send_page_view: false })
  }
  if (GOOGLE_ADS_ID) {
    window.gtag!('config', GOOGLE_ADS_ID)
  }
}

function loadMetaPixel(): void {
  if (!META_PIXEL_ID) return

  // Meta's snippet, transcribed rather than eval'd from a string. The queue
  // matters: calls made before the script arrives are replayed once it does.
  const fbq: any = function (...args: any[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args)
    else fbq.queue.push(args)
  }
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq

  injectScript('https://connect.facebook.net/en_US/fbevents.js')
  window.fbq!('init', META_PIXEL_ID)
}

/**
 * Loads every configured tag, once, and only with consent.
 *
 * `initTags` calls this from main.tsx before the app renders, so a throw here
 * would take the whole site down rather than just the measurement. Marked
 * loaded before the attempt, so a tag that fails half way is not retried into
 * a duplicate on the next consent event.
 */
export function loadTags(): void {
  if (loaded || !TRACKING_CONFIGURED) return
  if (readConsent() !== 'granted') return
  loaded = true
  safely('load', () => {
    loadGoogle()
    loadMetaPixel()
  })
}

/**
 * Call once at start-up. Loads immediately for a returning visitor who already
 * accepted, and waits for the notice otherwise.
 */
export function initTags(): void {
  safely('init', () => {
    loadTags()
    onConsentChange((consent) => {
      if (consent === 'granted') {
        loadTags()
        // The page view that was in progress when they accepted still counts.
        trackPageview(window.location.pathname + window.location.search)
      }
    })
  })
}

/**
 * Third-party tags run their own code in this page, and a broken or partially
 * blocked one can throw. That must never reach the caller: `trackLead` is
 * called on the way to opening WhatsApp, and an exception there would stop the
 * enquiry the visitor came to send. Measurement is the least important thing
 * happening at that moment.
 */
function safely(what: string, report: () => void): void {
  try {
    report()
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`analytics: ${what} failed`, error)
  }
}

export function trackPageview(path: string): void {
  if (!loaded) return
  safely('pageview', () => {
    if (GA4_ID) {
      window.gtag?.('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      })
    }
    window.fbq?.('track', 'PageView')
  })
}

/**
 * A visitor asking to be contacted - the only thing on this site worth calling
 * a conversion. Every route to it ends in the same place: a WhatsApp message.
 */
export function trackLead(detail: { cta: string; chapter: string; course?: string }): void {
  if (!loaded) return

  safely('lead', () => {
    if (GA4_ID) {
      window.gtag?.('event', 'generate_lead', {
        cta: detail.cta,
        chapter: detail.chapter,
        course: detail.course,
      })
    }

    if (GOOGLE_ADS_ID && GOOGLE_ADS_CONVERSION_LABEL) {
      window.gtag?.('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
      })
    }

    window.fbq?.('track', 'Lead', {
      content_name: detail.course ?? detail.cta,
      content_category: detail.chapter,
    })
  })
}
