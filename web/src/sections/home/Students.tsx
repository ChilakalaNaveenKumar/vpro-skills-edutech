import { TESTIMONIALS } from '../../content/testimonials'
import Reveal from '../../motion/Reveal'

export default function Students() {
  return (
    <section id="students" className="shell px-[44px] pt-[140px] max-[900px]:px-6">
      <div className="mb-14 grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] items-end gap-12 max-[900px]:grid-cols-1 max-[900px]:items-start max-[900px]:gap-5">
        <div className="min-w-0">
          <Reveal>
            <p className="eyebrow mb-[22px]">From students</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <h2 className="display max-w-[16ch] text-[clamp(34px,5.2vw,76px)] font-normal leading-[0.98] tracking-[-0.04em] [text-wrap:wrap]">
              What they said after.
            </h2>
          </Reveal>
        </div>
        <Reveal delayIndex={2}>
          <p className="min-w-0 max-w-[30ch] text-base leading-[1.6] text-[rgba(237,231,222,0.62)]">
            Students from earlier batches, on what changed for them.
          </p>
        </Reveal>
      </div>

      <div className="grid grid-cols-3 gap-px bg-[rgba(237,231,222,0.14)] max-[900px]:grid-cols-1">
        {TESTIMONIALS.map((testimonial, index) => (
          <Reveal key={testimonial.name} delayIndex={index} className="h-full">
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
