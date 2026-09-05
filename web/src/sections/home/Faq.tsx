import { useState } from 'react'
import { FAQS } from '../../content/homeSections'
import Accordion from '../../components/Accordion'
import Reveal from '../../motion/Reveal'
import CtaLink from '../../components/CtaLink'

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="shell pt-[140px]">
      <div className="grid items-start gap-10 min-[901px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[901px]:gap-[clamp(32px,5vw,80px)]">
        <Reveal className="min-w-0">
          <p className="eyebrow mb-[26px]">Frequently asked questions</p>
          <h2 className="display mb-[26px] text-[clamp(28px,3.6vw,50px)] leading-[1.04] tracking-[-0.035em]">
            The questions we answer on every call.
          </h2>
          <p className="mb-[22px] max-w-[34ch] text-base leading-[1.6] text-[rgb(237_231_222/0.62)]">
            If yours is not here, send it. A person replies, usually within the hour during working
            hours.
          </p>
          <CtaLink
            cta="talk_to_trainer"
            chapter="faq"
            className="btn-secondary gap-[11px] [transition:background_200ms_var(--ease-state)] motion-reduce:transition-none"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 1 1 6.98 3.86Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.01-.38.11-.5.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
            </svg>
            Ask your question
          </CtaLink>
        </Reveal>

        <Reveal delayIndex={1} className="min-w-0">
          <Accordion
            openIndex={open}
            onToggle={(index) => setOpen(index === open ? -1 : index)}
            openDurationMs={480}
            opacityDurationMs={360}
            items={FAQS.map((faq, index) => ({
              id: `faq-${index}`,
              heading: (
                <span className="display text-[clamp(20px,1.8vw,24px)] leading-[1.2] tracking-[-0.02em]">
                  {faq.q}
                </span>
              ),
              body: (
                <p className="max-w-[56ch] text-base leading-[1.62] text-[rgb(237_231_222/0.72)]">
                  {faq.a}
                </p>
              ),
            }))}
          />
        </Reveal>
      </div>
    </section>
  )
}
