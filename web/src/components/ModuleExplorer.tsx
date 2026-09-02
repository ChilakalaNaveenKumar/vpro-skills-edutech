import { useState } from 'react'
import type { CourseModule } from '../content/courses'
import ModuleVisual from './ModuleVisual'

// The syllabus, shown rather than listed.
//
// Six modules, six purpose-built explainers. Picking a module swaps the stage;
// only the selected visual is mounted, so exactly one canvas ever animates.
// The list underneath Course.tsx stays as the plain-text syllabus for anyone
// who would rather read it, and it is what search engines index.
export default function ModuleExplorer({ modules, className = '' }: { modules: CourseModule[]; className?: string }) {
  const [selected, setSelected] = useState(0)
  const active = modules[selected]

  return (
    <div className={`shell mt-20 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="eyebrow">The six modules</p>
        <p className="text-[0.72rem] text-[color:var(--on-ink-faint)]">
          Pick a module to see what it means
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10">
        {/* Module picker. A real tablist: arrow keys and focus work. */}
        <div
          role="tablist"
          aria-label="Course modules"
          aria-orientation="vertical"
          className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {modules.map((module, index) => {
            const isActive = index === selected
            return (
              <button
                key={module.order}
                role="tab"
                type="button"
                id={`module-tab-${module.order}`}
                aria-selected={isActive}
                aria-controls={`module-panel-${module.order}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setSelected(index)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                    event.preventDefault()
                    setSelected((index + 1) % modules.length)
                  }
                  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                    event.preventDefault()
                    setSelected((index - 1 + modules.length) % modules.length)
                  }
                }}
                className={`group flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-200 lg:shrink ${
                  isActive
                    ? 'border-[color:var(--signal)] bg-[color:var(--ink-2)]'
                    : 'border-[color:var(--rule)] hover:border-[color:var(--on-ink-faint)]'
                }`}
              >
                <span
                  className={`tnum text-[0.62rem] font-semibold ${
                    isActive ? 'text-[color:var(--signal)]' : 'text-[color:var(--on-ink-faint)]'
                  }`}
                >
                  {String(module.order).padStart(2, '0')}
                </span>
                <span
                  className={`whitespace-nowrap text-[0.9rem] font-medium lg:whitespace-normal ${
                    isActive ? 'text-[color:var(--on-ink)]' : 'text-[color:var(--on-ink-mute)]'
                  }`}
                >
                  {module.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Stage. Only the selected module's canvas exists. */}
        <div
          role="tabpanel"
          id={`module-panel-${active.order}`}
          aria-labelledby={`module-tab-${active.order}`}
          className="overflow-hidden rounded-2xl border border-[color:var(--rule)] bg-[color:var(--ink-2)]"
        >
          {active.visual ? (
            <div className="h-[19rem] w-full sm:h-[22rem] lg:h-[26rem]">
              <ModuleVisual
                key={active.visual}
                visual={active.visual}
                label={`${active.name}: ${active.summary}`}
              />
            </div>
          ) : (
            <div className="flex h-[13rem] w-full items-center justify-center px-8 sm:h-[15rem]">
              <ol className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                {active.topics.map((topic, i) => (
                  <li key={topic} className="flex items-center gap-3">
                    {i > 0 && <span className="h-px w-5 bg-[color:var(--rule)]" aria-hidden="true" />}
                    <span className="text-[0.82rem] text-[color:var(--on-ink-mute)]">{topic}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="border-t border-[color:var(--rule)] p-6 sm:p-7">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 className="display text-[1.35rem] text-[color:var(--on-ink)]">{active.name}</h3>
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--signal-text)]">
                Module {String(active.order).padStart(2, '0')} of {modules.length}
              </p>
            </div>

            <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              {active.summary}
            </p>

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <ul className="flex flex-wrap gap-x-2 gap-y-2">
                {active.topics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-full border border-[color:var(--rule)] px-3 py-1 text-[0.72rem] text-[color:var(--on-ink-mute)]"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
              <p className="shrink-0 text-[0.78rem] text-[color:var(--on-ink-faint)]">
                You leave with{' '}
                <span className="text-[color:var(--on-ink)]">{active.builds}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
