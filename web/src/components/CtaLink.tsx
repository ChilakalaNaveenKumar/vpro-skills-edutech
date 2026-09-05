import type { ReactNode } from 'react'
import { whatsappUrl, type CtaKey } from '../content/contact'
import { captureLead } from '../services/leadsService'

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
      onClick={() => captureLead({ cta, chapter, segment, course })}
    >
      {children}
    </a>
  )
}
