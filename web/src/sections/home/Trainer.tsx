import { useEffect, useRef } from 'react'
import { TRAINER } from '../../content/homeSections'
import { MENTOR } from '../../content/mentor'
import { useSiteContent } from '../../hooks/useContent'

export interface TrainerContent {
  eyebrow: string
  quote: string
  body: string[]
  photo: string
  photoFallback: string
  photoAlt: string
  name: string
  roles: string[]
  stats: { value: string; label: string }[]
}

const FALLBACK: TrainerContent = {
  eyebrow: TRAINER.eyebrow,
  quote: TRAINER.quote,
  body: [...TRAINER.body],
  photo: TRAINER.photo,
  photoFallback: TRAINER.photoFallback,
  photoAlt: MENTOR.photo.alt,
  name: MENTOR.name,
  roles: [...MENTOR.roles],
  stats: MENTOR.stats.map((stat) => ({ value: stat.value, label: stat.label })),
}
import Reveal from '../../motion/Reveal'
import { useScrollDriver } from '../../motion/useScrollDriver'
import { prefersReducedMotion } from '../../motion/prefersReducedMotion'

export default function Trainer() {
  const trainer = useSiteContent<TrainerContent>('trainer', FALLBACK)
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
    <section id="trainer" className="shell pt-[140px]">
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-20 max-[1080px]:grid-cols-1 max-[1080px]:gap-10">
        <Reveal className="overflow-hidden rounded-[2px]">
          <picture>
            <source srcSet={trainer.photo} type="image/webp" />
            <img
              ref={ref}
              src={trainer.photoFallback}
              alt={trainer.photoAlt}
              width={760}
              height={1000}
              loading="lazy"
              className="block aspect-[4/5] w-full object-cover object-[center_22%] shadow-[inset_0_0_0_1px_rgba(237,231,222,0.14)] will-change-transform"
            />
          </picture>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow mb-[34px]">{trainer.eyebrow}</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <blockquote className="display mb-[26px] max-w-[44ch] text-[clamp(24px,2.5vw,33px)] leading-[1.34] tracking-[-0.02em] [text-wrap:wrap]">
              {trainer.quote}
            </blockquote>
          </Reveal>
          {trainer.body.map((paragraph, index) => (
            <Reveal key={paragraph} delayIndex={index + 2}>
              <p
                className={`max-w-[54ch] text-[17px] leading-[1.66] text-[rgba(237,231,222,0.62)] ${
                  index === trainer.body.length - 1 ? 'mb-[34px]' : 'mb-5'
                }`}
              >
                {paragraph}
              </p>
            </Reveal>
          ))}
          {/* The credentials strip: one hairline grid, the rules are the
              container's own background showing through the 1px gaps. */}
          <Reveal delayIndex={2} className="block">
            <div className="mb-[30px] grid grid-cols-4 gap-px bg-[rgb(237_231_222_/_0.16)] max-[900px]:grid-cols-2">
              {trainer.stats.map((stat) => (
                <div key={stat.label} className="bg-[color:var(--ink)] px-4 pt-[18px] pb-4">
                  <p className="display mb-2 text-[clamp(26px,2.4vw,34px)] leading-none tracking-[-0.03em] text-[color:var(--signal)]">
                    {stat.value}
                  </p>
                  <p className="mono text-[10px] tracking-[0.14em] text-[color:var(--on-ink-faint)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delayIndex={3}>
            <p className="mono mb-1.5 tracking-[0.14em] text-[color:var(--on-ink-faint)]">
              {trainer.name}
            </p>
            <p className="text-[15px] text-[color:var(--on-ink-faint)]">
              {trainer.roles.join(', ')}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
