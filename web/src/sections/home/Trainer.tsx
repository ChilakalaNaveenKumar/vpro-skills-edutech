import { useEffect, useRef } from 'react'
import { TRAINER } from '../../content/homeSections'
import Reveal from '../../motion/Reveal'
import { useScrollDriver } from '../../motion/useScrollDriver'
import { prefersReducedMotion } from '../../motion/prefersReducedMotion'

export default function Trainer() {
  const ref = useRef<HTMLImageElement | null>(null)
  const metricsRef = useRef({ top: 0, height: 0 })

  useEffect(() => {
    const measure = () => {
      const node = ref.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      metricsRef.current = {
        top: rect.top + window.scrollY,
        height: rect.height,
      }
    }

    measure()
    window.addEventListener('resize', measure)
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => measure())
    observer?.observe(document.body)

    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [])

  useScrollDriver((scrollY) => {
    const node = ref.current
    if (!node) return
    if (prefersReducedMotion()) {
      node.style.transform = ''
      return
    }
    const { top, height } = metricsRef.current
    const viewportTop = top - scrollY
    if (viewportTop + height <= 0 || viewportTop >= window.innerHeight) return
    const centre = (viewportTop + height / 2 - window.innerHeight / 2) / window.innerHeight
    node.style.transform = `translateY(${(centre * -26).toFixed(2)}px) scale(1.06)`
  })

  return (
    <section id="trainer" className="shell py-24 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20">
        <Reveal className="overflow-hidden">
          <picture>
            <source srcSet={TRAINER.photo} type="image/webp" />
            <img
              ref={ref}
              src={TRAINER.photoFallback}
              alt="Sambasiva Rao, the trainer"
              width={760}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover will-change-transform"
            />
          </picture>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow">{TRAINER.eyebrow}</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <blockquote className="display mt-6 text-[clamp(1.5rem,2.6vw,2.1rem)]">
              {TRAINER.quote}
            </blockquote>
          </Reveal>
          {TRAINER.body.map((paragraph, index) => (
            <Reveal key={paragraph} delayIndex={index + 2}>
              <p className="mt-6 max-w-[56ch] text-[0.98rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                {paragraph}
              </p>
            </Reveal>
          ))}
          <Reveal delayIndex={2}>
            <p className="mono mt-8 text-[color:var(--on-ink-faint)]">{TRAINER.attribution}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
