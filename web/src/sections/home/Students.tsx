import { TESTIMONIALS } from '../../content/testimonials'
import Reveal from '../../motion/Reveal'

export default function Students() {
  return (
    <section id="students" className="shell py-28 lg:py-36">
      <Reveal>
        <p className="eyebrow">From students</p>
      </Reveal>
      <Reveal delayIndex={1}>
        <h2 className="display mt-6 text-[clamp(2.2rem,4.4vw,3.4rem)]">What they said after.</h2>
      </Reveal>

      <div className="mt-14 grid gap-px bg-[color:var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <Reveal key={testimonial.name} delayIndex={index} className="bg-[color:var(--ink)] p-9">
            <blockquote className="display text-[1.15rem] leading-snug">
              “{testimonial.quote}”
            </blockquote>
            <p className="mono mt-7 text-[color:var(--on-ink)]">{testimonial.name}</p>
            <p className="mono mt-1 text-[color:var(--on-ink-faint)]">{testimonial.role}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
