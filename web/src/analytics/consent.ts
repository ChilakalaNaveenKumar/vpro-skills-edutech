/**
 * Whether the visitor has agreed to advertising measurement.
 *
 * The distinction that matters here: declining does not put the tags into a
 * restricted mode, it stops them being fetched at all. Google's own Consent
 * Mode still loads gtag.js and sends pings when consent is denied, which is
 * defensible in the EU where a consent-management platform is assumed, and
 * hard to defend under India's DPDP Act, which is built around consent being
 * obtained before processing rather than around signalling it afterwards.
 * Nothing here loads before `grant()`.
 *
 * A consequence worth knowing: measurement only covers people who accepted, so
 * reported conversions will undercount real ones. That is the correct trade,
 * and it is better than the alternative of a page that asks and then ignores
 * the answer.
 */

const STORAGE_KEY = 'vpro-consent'

export type Consent = 'granted' | 'denied' | 'unset'

type Listener = (consent: Consent) => void

const listeners = new Set<Listener>()

export function readConsent(): Consent {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'granted' || stored === 'denied' ? stored : 'unset'
  } catch {
    // Safari in private mode throws on localStorage. Treat it as not yet asked
    // rather than as consent, and nothing loads.
    return 'unset'
  }
}

function set(consent: Exclude<Consent, 'unset'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, consent)
  } catch {
    // The decision still applies for this page view even if it cannot be
    // remembered, which is the more important half.
  }
  for (const listener of listeners) listener(consent)
}

export const grantConsent = () => set('granted')
export const denyConsent = () => set('denied')

export function onConsentChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
