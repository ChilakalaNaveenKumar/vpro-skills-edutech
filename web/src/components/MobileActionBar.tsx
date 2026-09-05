import { useEffect, useState } from 'react'
import CtaLink from './CtaLink'
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
      className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-2 lg:hidden"
      style={{
        transform: shown ? 'translateY(0)' : 'translateY(100%)',
        // The bar still appears and hides under reduced motion - it is a
        // control, not decoration. Only the slide is dropped.
        transition: reduced ? undefined : 'transform 420ms cubic-bezier(0.22,1,0.28,1)',
      }}
    >
      <CtaLink cta="hero_demo" chapter="mobile_bar" className="btn-primary">
        Free demo
      </CtaLink>
      <CtaLink cta="footer_whatsapp" chapter="mobile_bar" className="btn-secondary">
        WhatsApp
      </CtaLink>
    </div>
  )
}
