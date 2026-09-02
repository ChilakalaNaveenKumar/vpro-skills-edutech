import type { CtaKey } from '../content/contact'

export interface LeadCapture {
  cta: CtaKey
  chapter: string
  segment?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000') as string

function utmParams(): Pick<LeadCapture, 'utm_source' | 'utm_medium' | 'utm_campaign'> {
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
  }
}

// Best-effort by design: fired on the way out to WhatsApp and never awaited, so
// a failed or blocked request can never cost a conversion.
export function captureLead(capture: LeadCapture): void {
  const body = JSON.stringify({ ...capture, ...utmParams() })
  const url = `${BASE}/api/leads`
  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {})
  } catch {
    // Never surface a tracking failure to the visitor.
  }
}
