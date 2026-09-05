import { useState } from 'react'
import { BATCH_LOOP } from '../../content/homeSections'
import Accordion from '../../components/Accordion'
import Reveal from '../../motion/Reveal'

export default function BatchLoop() {
  const [open, setOpen] = useState(0)

  return (
    <section id="loop" className="shell py-28 lg:py-36">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <p className="eyebrow">How a batch runs</p>
          <h2 className="display mt-6 max-w-[14ch] text-[clamp(2.2rem,4.4vw,3.4rem)]">
            Four steps, repeated per topic.
          </h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <p className="max-w-[36ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
            A filling progress bar feels exactly like learning right up until somebody asks you a
            question. So we ask. Open a step to see it.
          </p>
        </Reveal>
      </div>

      <Accordion
        className="mt-14"
        openIndex={open}
        onToggle={setOpen}
        items={BATCH_LOOP.map((step, index) => ({
          id: step.n,
          heading: (
            <span className="flex items-baseline gap-8">
              <span
                className="display text-[1.9rem]"
                style={{
                  color: index === open ? 'var(--signal)' : 'var(--on-ink-faint)',
                }}
              >
                {step.n}
              </span>
              <span
                className="display text-[1.25rem]"
                style={{
                  color: index === open ? 'var(--on-ink)' : 'var(--on-ink-faint)',
                }}
              >
                {step.title}
              </span>
            </span>
          ),
          body: (
            <p className="max-w-[62ch] pl-[4.4rem] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              {step.body}
            </p>
          ),
        }))}
      />
    </section>
  )
}
