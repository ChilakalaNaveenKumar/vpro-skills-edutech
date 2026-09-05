import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CtaLink from './CtaLink'
import WhatsAppMark from './WhatsAppMark'
import { prefersReducedMotion } from '../motion/prefersReducedMotion'

export default function MobileActionBar() {
  const [reduced] = useState(prefersReducedMotion)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('top')
    if (!hero || typeof IntersectionObserver === 'undefined') return

    // Whether the hero is still on screen is a threshold question, so let the
    // browser answer it. The previous version queried the DOM and read
    // offsetHeight on every scroll frame to work out the same thing.
    const observer = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting),
      { rootMargin: '0px' },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      inert={!shown}
      aria-hidden={!shown}
      className="fixed inset-x-0 bottom-0 z-[80] flex gap-2.5 bg-[rgb(20_22_28_/_0.97)] px-4 py-3 shadow-[inset_0_1px_0_0_rgb(237_231_222_/_0.16)] backdrop-blur-[12px] lg:hidden"
      style={{
        transform: shown ? 'translateY(0)' : 'translateY(100%)',
        // The bar still appears and hides under reduced motion - it is a
        // control, not decoration. Only the slide is dropped.
        transition: reduced ? undefined : 'transform 420ms var(--ease-open)',
      }}
    >
      <Link to="/batches" className="btn-primary min-h-12 flex-1">
        Reserve my seat
      </Link>
      <CtaLink cta="footer_whatsapp" chapter="mobile_bar" className="btn-secondary min-h-12 flex-1">
        <WhatsAppMark />
        WhatsApp
      </CtaLink>
    </div>
  )
}
