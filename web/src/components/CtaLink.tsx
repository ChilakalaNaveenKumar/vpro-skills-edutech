import type { ReactNode } from 'react'
import { whatsappUrl, type CtaKey } from '../content/contact'
import { captureLead } from '../services/leadsService'
import { trackLead } from '../analytics/tags'

interface Props {
  cta: CtaKey
  chapter: string
  segment?: string
  course?: string
  /** Batch number, hour and dates, when the CTA is about a specific batch. */
  batch?: string
  children: ReactNode
  className?: string
}

// WhatsApp stays the destination and the single tap is unchanged. The lead is
// logged on the way out, never in front of it.
//
// This is also where a Google Ads and Meta conversion is reported, and it is
// the right and only place: every path to contacting this business ends at a
// wa.me link rendered by this component. Counting anything earlier - a page
// view, a scroll - would optimise the ad spend towards people who looked
// rather than people who got in touch.
export default function CtaLink({
  cta,
  chapter,
  segment,
  course,
  batch,
  children,
  className = '',
}: Props) {
  return (
    <a
      href={whatsappUrl(cta, segment, course, batch)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        captureLead({ cta, chapter, segment, course })
        trackLead({ cta, chapter, course })
      }}
    >
      {children}
    </a>
  )
}
