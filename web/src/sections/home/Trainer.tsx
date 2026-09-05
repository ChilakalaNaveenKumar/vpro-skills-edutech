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
    <section id="trainer" className="shell px-[44px] pt-[60px] max-[900px]:px-6">
      <div className="grid grid-cols-[0.8fr_1.2fr] items-center gap-20 max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <Reveal className="overflow-hidden rounded-[2px]">
          <picture>
            <source srcSet={TRAINER.photo} type="image/webp" />
            <img
              ref={ref}
              src={TRAINER.photoFallback}
              alt="Sambasiva Rao, the trainer"
              width={760}
              height={1000}
              loading="lazy"
              className="block aspect-[4/5] w-full object-cover object-[center_22%] shadow-[inset_0_0_0_1px_rgba(237,231,222,0.14)] will-change-transform"
            />
          </picture>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow mb-[34px]">{TRAINER.eyebrow}</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <blockquote className="display mb-[26px] max-w-[44ch] text-[clamp(24px,2.5vw,33px)] leading-[1.34] tracking-[-0.02em] [text-wrap:wrap]">
              {TRAINER.quote}
            </blockquote>
          </Reveal>
          {TRAINER.body.map((paragraph, index) => (
            <Reveal key={paragraph} delayIndex={index + 2}>
              <p
                className={`max-w-[54ch] text-[17px] leading-[1.66] text-[rgba(237,231,222,0.62)] ${
                  index === TRAINER.body.length - 1 ? 'mb-[34px]' : 'mb-5'
                }`}
              >
                {paragraph}
              </p>
            </Reveal>
          ))}
          <Reveal delayIndex={2}>
            <p className="mono tracking-[0.14em] text-[rgba(237,231,222,0.5)]">
              {TRAINER.attribution}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
