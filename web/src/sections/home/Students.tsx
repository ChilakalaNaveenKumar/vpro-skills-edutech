import { TESTIMONIALS } from '../../content/testimonials'
import { useContentList } from '../../hooks/useContent'
import type { TestimonialItem } from '../../services/contentService'

// The static list is the fallback the section renders with until the database
// answers, so this never flashes empty.
const FALLBACK: TestimonialItem[] = TESTIMONIALS.map((item, index) => ({
  id: -(index + 1),
  quote: item.quote,
  name: item.name,
  role: item.role,
}))
import Reveal from '../../motion/Reveal'

export default function Students() {
  const testimonials = useContentList<TestimonialItem>('testimonials', FALLBACK)

  return (
    <section id="students" className="shell pt-[140px]">
      <div className="mb-14 min-w-0">
        <Reveal>
          <p className="eyebrow mb-[22px]">From students</p>
        </Reveal>
        <Reveal delayIndex={1}>
          <h2 className="display max-w-[16ch] text-[clamp(34px,5.2vw,76px)] font-normal leading-[0.98] tracking-[-0.04em] [text-wrap:wrap]">
            What they said after.
          </h2>
        </Reveal>
      </div>

      <div className="grid grid-cols-3 gap-px bg-[rgba(237,231,222,0.14)] max-[900px]:grid-cols-1">
        {testimonials.map((testimonial, index) => (
          <Reveal key={testimonial.id} delayIndex={index} className="h-full">
            <div className="h-full bg-[#14161C] px-[30px] pb-[30px] pt-8 transition-[background] duration-300 ease-[var(--ease-state)] hover:bg-[#1C1F27] motion-reduce:transition-none">
              <blockquote className="display mb-5 text-[clamp(19px,1.55vw,23px)] leading-[1.4] tracking-[-0.015em] [text-wrap:wrap]">
                “{testimonial.quote}”
              </blockquote>
              <p className="mono mb-1 tracking-[0.12em] text-[#C3A47B]">
                {testimonial.name}
              </p>
              <p className="text-[13.5px] text-[rgba(237,231,222,0.62)]">
                {testimonial.role}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
