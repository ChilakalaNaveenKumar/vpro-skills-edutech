import { useRef, useState } from 'react'
import CtaLink from './CtaLink'
import { useScrollDriver } from '../motion/useScrollDriver'
import { prefersReducedMotion } from '../motion/prefersReducedMotion'

export default function MobileActionBar() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [reduced] = useState(prefersReducedMotion)

  useScrollDriver((scrollY) => {
    const node = ref.current
    if (!node) return
    const hero = document.getElementById('top')
    const threshold = (hero?.offsetHeight ?? window.innerHeight) - 120
    node.style.transform = scrollY > threshold ? 'translateY(0)' : 'translateY(100%)'
  })

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-2 lg:hidden"
      style={{
        transform: 'translateY(100%)',
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
