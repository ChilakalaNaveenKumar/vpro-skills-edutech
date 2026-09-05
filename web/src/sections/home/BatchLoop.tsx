import { useState } from 'react'
import { BATCH_LOOP } from '../../content/homeSections'
import { useContentList } from '../../hooks/useContent'
import type { BlockItem } from '../../services/contentService'

const FALLBACK: BlockItem[] = BATCH_LOOP.map((step, index) => ({
  id: -(index + 1),
  number: step.n,
  title: step.title,
  body: step.body,
}))
import Reveal from '../../motion/Reveal'

export default function BatchLoop() {
  const [open, setOpen] = useState(0)
  const steps = useContentList<BlockItem>('batch-loop', FALLBACK)

  return (
    <section id="loop" className="shell pt-[140px]">
      <Reveal className="mb-14 block min-w-0">
        <p className="eyebrow">How a batch runs</p>
        <h2 className="display mt-[22px] max-w-[16ch] text-[clamp(34px,5.2vw,76px)] leading-[0.98] tracking-[-0.04em]">
          Four steps, repeated per topic.
        </h2>
      </Reveal>

      <div className="grid gap-0">
        {steps.map((step, index) => {
          const isOpen = index === open
          const panelId = `batch-loop-panel-${step.id}`

          return (
            <Reveal key={step.id} className="w-full">
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
                {step.number}
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
