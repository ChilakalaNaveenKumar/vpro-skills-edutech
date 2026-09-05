import type { ReactNode } from 'react'
import { whatsappUrl, type CtaKey } from '../content/contact'
import { captureLead } from '../services/leadsService'
import Magnetic from '../motion/Magnetic'

interface Props {
  cta: CtaKey
  chapter: string
  segment?: string
  course?: string
  children: ReactNode
  className?: string
  magnetic?: boolean
}

// WhatsApp stays the destination and the single tap is unchanged. The lead is
// logged on the way out, never in front of it.
export default function CtaLink({ cta, chapter, segment, course, children, className = '', magnetic = false }: Props) {
  const anchor = (
    <a
      href={whatsappUrl(cta, segment, course)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => captureLead({ cta, chapter, segment, course })}
    >
      {children}
    </a>
  )

  return magnetic ? <Magnetic>{anchor}</Magnetic> : anchor
}
