import type { ReactNode } from 'react'

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
}

export default function Accordion({ items, openIndex, onToggle, className = '' }: Props) {
  return (
    <div className={className}>
      {items.map((item, index) => {
        const open = index === openIndex
        return (
          <div key={item.id} className="border-t border-[color:var(--rule)]">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`accordion-panel-${item.id}`}
              onClick={() => onToggle(index)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
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
              id={`accordion-panel-${item.id}`}
              aria-hidden={!open}
              inert={!open}
              className="grid transition-[grid-template-rows,opacity,padding] duration-500 ease-[var(--ease-reveal)] motion-reduce:transition-none"
              style={{
                gridTemplateRows: open ? '1fr' : '0fr',
                opacity: open ? 1 : 0,
                paddingBottom: open ? '14px' : '0px',
              }}
            >
              <div className="overflow-hidden">{item.body}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
