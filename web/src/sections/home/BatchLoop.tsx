import { useState } from 'react'
import { BATCH_LOOP } from '../../content/homeSections'
import Reveal from '../../motion/Reveal'

export default function BatchLoop() {
  const [open, setOpen] = useState(0)

  return (
    <section id="loop" className="shell pt-[140px]">
      <div className="mb-14 grid gap-5 min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,auto)] min-[901px]:items-end min-[901px]:gap-12">
        <Reveal className="min-w-0">
          <p className="eyebrow">How a batch runs</p>
          <h2 className="display mt-[22px] max-w-[16ch] text-[clamp(34px,5.2vw,76px)] leading-[0.98] tracking-[-0.04em]">
            Four steps, repeated per topic.
          </h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <p className="min-w-0 max-w-[32ch] text-base leading-[1.6] text-[rgb(237_231_222/0.62)]">
            A filling progress bar feels exactly like learning right up until somebody asks you a
            question. So we ask. Open a step to see it.
          </p>
        </Reveal>
      </div>

      <div className="grid gap-0">
        {BATCH_LOOP.map((step, index) => {
          const isOpen = index === open
          const panelId = `batch-loop-panel-${step.n}`

          return (
            <Reveal key={step.n} className="w-full">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(index)}
                className="grid w-full cursor-pointer grid-cols-[56px_minmax(0,1fr)] items-start gap-[clamp(20px,3vw,52px)] border-0 bg-transparent py-[26px] text-left shadow-[inset_0_-1px_0_0_var(--rule)] [transition:opacity_300ms_var(--ease-state)] min-[901px]:grid-cols-[minmax(0,88px)_minmax(0,1fr)_minmax(0,1.25fr)] motion-reduce:transition-none"
              >
                <span
                  className="display text-[clamp(38px,4.4vw,64px)] font-light leading-[0.82] tracking-[-0.05em] [transition:color_400ms_var(--ease-state)] motion-reduce:transition-none"
                  style={{ color: isOpen ? '#c87046' : 'rgb(237 231 222 / 0.55)' }}
                >
                {step.n}
              </span>
                <span
                  className="display text-[clamp(23px,2.1vw,32px)] leading-[1.1] tracking-[-0.025em] [transition:color_400ms_var(--ease-state)] motion-reduce:transition-none"
                  style={{ color: isOpen ? '#ede7de' : 'rgb(237 231 222 / 0.62)' }}
                >
                  {step.title}
                </span>
                <span
                  id={panelId}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                  className="col-start-2 grid min-w-0 overflow-hidden [transition:grid-template-rows_520ms_var(--ease-open)] min-[901px]:col-start-auto motion-reduce:transition-none"
                  style={{
                    gridTemplateRows: isOpen ? 'minmax(0, 1fr)' : 'minmax(0, 0fr)',
                  }}
                >
                  <span
                    className="min-h-0 text-base leading-[1.62] text-[rgb(237_231_222/0.72)] [transition:opacity_380ms_var(--ease-state)] motion-reduce:transition-none"
                    style={{ opacity: isOpen ? 1 : 0 }}
                  >
                    {step.body}
                  </span>
                </span>
              </button>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
