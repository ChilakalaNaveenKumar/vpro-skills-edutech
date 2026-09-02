import { NAV_SECTIONS } from '../content/sections'

// Position rail, desktop only. Labels stay hidden until hover or focus so the
// rail reads as a tick strip rather than a second navigation bar.
export default function SectionRail({ active }: { active: string }) {
  return (
    <nav
      aria-label="Sections"
      className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-4 xl:flex"
    >
      {NAV_SECTIONS.map((section) => {
        const isActive = active === section.id
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="pointer-events-auto group flex items-center justify-end gap-3 focus-visible:outline-none"
            aria-current={isActive ? 'true' : undefined}
          >
            <span
              className={`text-[0.62rem] font-medium uppercase tracking-[0.18em] transition-opacity duration-300 ${
                isActive
                  ? 'text-[color:var(--on-ink)] opacity-100'
                  : 'text-[color:var(--on-ink-faint)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
              }`}
            >
              {section.label}
            </span>
            <span
              className={`h-px transition-all duration-500 ${
                isActive ? 'w-8 bg-[color:var(--signal)]' : 'w-4 bg-[color:var(--rule)] group-hover:bg-[color:var(--on-ink-faint)]'
              }`}
              aria-hidden="true"
            />
          </a>
        )
      })}
    </nav>
  )
}
