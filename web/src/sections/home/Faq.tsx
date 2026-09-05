import { useState } from 'react'
import { FAQS } from '../../content/homeSections'
import Accordion from '../../components/Accordion'
import Reveal from '../../motion/Reveal'
import CtaLink from '../../components/CtaLink'

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="shell py-28 lg:py-36">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <p className="eyebrow">Frequently asked questions</p>
          <h2 className="display mt-6 text-[clamp(2.2rem,4.4vw,3.4rem)]">
            The questions we answer on every call.
          </h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <div className="max-w-[34ch]">
            <p className="text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              If yours is not here, send it. A person replies, usually within the hour during
              working hours.
            </p>
            <CtaLink cta="talk_to_trainer" chapter="faq" className="btn-secondary mt-6">
              Ask your question
            </CtaLink>
          </div>
        </Reveal>
      </div>

      <Accordion
        className="mt-14"
        openIndex={open}
        onToggle={(index) => setOpen(index === open ? -1 : index)}
        items={FAQS.map((faq, index) => ({
          id: `faq-${index}`,
          heading: <span className="display text-[1.15rem]">{faq.q}</span>,
          body: (
            <p className="max-w-[68ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              {faq.a}
            </p>
          ),
        }))}
      />
    </section>
  )
}
