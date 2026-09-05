import type { CSSProperties, ReactNode } from 'react'

export interface AccordionItem {
  id: string
  heading: ReactNode
  body: ReactNode
}

interface Props {
  items: AccordionItem[]
  /** -1 means every item is closed. */
  openIndex: number
  onToggle: (index: number) => void
  className?: string
  openDurationMs?: number
  opacityDurationMs?: number
}

type AccordionStyle = CSSProperties & {
  '--accordion-open-duration': string
  '--accordion-opacity-duration': string
}

export default function Accordion({
  items,
  openIndex,
  onToggle,
  className = '',
  openDurationMs = 480,
  opacityDurationMs = 360,
}: Props) {
  const transitionStyle: AccordionStyle = {
    '--accordion-open-duration': `${openDurationMs}ms`,
    '--accordion-opacity-duration': `${opacityDurationMs}ms`,
  }

  return (
    <div className={className} style={transitionStyle}>
      {items.map((item, index) => {
        const open = index === openIndex
        const panelId = `accordion-panel-${item.id.replace(/[^A-Za-z0-9_-]/g, '-')}`
        return (
          <div
            key={item.id}
            className="py-6 shadow-[inset_0_-1px_0_0_var(--rule)]"
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => onToggle(index)}
              className="flex w-full items-baseline justify-between gap-6 text-left"
            >
              {item.heading}
              <span
                aria-hidden="true"
                className="mono shrink-0 text-lg text-[color:var(--signal)]"
              >
                {open ? '–' : '+'}
              </span>
            </button>
            <div
              id={panelId}
              aria-hidden={!open}
              inert={!open}
              className="grid overflow-hidden [transition:grid-template-rows_var(--accordion-open-duration)_var(--ease-open)] motion-reduce:transition-none"
              style={{
                gridTemplateRows: open ? 'minmax(0, 1fr)' : 'minmax(0, 0fr)',
              }}
            >
              <div
                className="min-h-0 overflow-hidden [transition:opacity_var(--accordion-opacity-duration)_var(--ease-state),padding-top_var(--accordion-open-duration)_var(--ease-open)] motion-reduce:transition-none"
                style={{
                  opacity: open ? 1 : 0,
                  paddingTop: open ? '14px' : '0px',
                }}
              >
                {item.body}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
