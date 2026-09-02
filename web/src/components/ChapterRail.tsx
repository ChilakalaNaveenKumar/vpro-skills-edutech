import { CHAPTERS } from '../world/chapters'

const TITLES = ['Arrival', 'Why now', 'The path', 'Mentor', 'Start here']

// Reads the exact chapter index, never the damped camera value, so the label
// can never lag the section the reader is actually in.
export default function ChapterRail({ active }: { active: number }) {
  return (
    <nav
      aria-label="Chapters"
      className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 lg:flex"
    >
      {CHAPTERS.map((chapter, index) => (
        <a
          key={chapter.id}
          href={`#${chapter.id}`}
          className="pointer-events-auto group flex items-center justify-end gap-3 focus-visible:outline-none"
          aria-current={active === index ? 'true' : undefined}
        >
          <span
            className={`text-[0.62rem] uppercase tracking-[0.2em] transition-opacity duration-300 ${
              active === index ? 'text-bone/80 opacity-100' : 'text-bone/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            }`}
          >
            {TITLES[index]}
          </span>
          <span
            className={`h-px transition-all duration-500 ${
              active === index ? 'w-8 bg-ember' : 'w-4 bg-bone/30 group-hover:bg-bone/60'
            }`}
            aria-hidden="true"
          />
        </a>
      ))}
    </nav>
  )
}
