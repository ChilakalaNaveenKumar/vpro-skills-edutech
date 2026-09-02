import { MODULES } from '../content/curriculum'
import { PROJECTS } from '../content/projects'
import SplitWords from '../motion/SplitWords'
import Chapter, { ChapterLabel } from './Chapter'

// Chapter 2. The curriculum a prospect currently cannot see anywhere: six
// modules as the six lanterns standing along the route in the world behind.
export default function Path({ activeChapter }: { activeChapter: number }) {
  return (
    <Chapter index={2} activeChapter={activeChapter} className="items-start">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10">
        <ChapterLabel index={2} title="The path" />

        <h2
          aria-label="Complete AI Engineer roadmap"
          className="font-editorial mt-7 max-w-2xl text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.015em] text-bone"
        >
          <SplitWords text="Complete AI Engineer roadmap" />
        </h2>

        <p className="beat mt-5 max-w-lg text-bone/65" style={{ ['--d' as string]: 300 }}>
          Six modules, in order, from first principles to enterprise AI.
        </p>

        <ol className="mt-14 space-y-px">
          {MODULES.map((module, index) => (
            <li
              key={module.order}
              className="beat group border-t border-bone/12 py-7 transition-colors duration-500 last:border-b hover:border-ember/40"
              style={{ ['--d' as string]: 380 + index * 70 }}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-baseline md:gap-10">
                <div className="flex shrink-0 items-baseline gap-4 md:w-64">
                  <span className="font-editorial text-xs font-medium tracking-[0.28em] text-ember">
                    {String(module.order).padStart(2, '0')}
                  </span>
                  <h3 className="font-editorial text-lg font-semibold text-bone">{module.name}</h3>
                </div>
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {module.topics.map((topic) => (
                    <li key={topic} className="text-[0.84rem] text-bone/55">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <h3
          id="projects"
          className="beat font-editorial mt-24 text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-bone"
          style={{ ['--d' as string]: 0 }}
        >
          Eight projects recruiters actually ask about
        </h3>

        <ul className="beat mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4" style={{ ['--d' as string]: 200 }}>
          {PROJECTS.map((project) => (
            <li key={project.name} className="border-t border-bone/15 pt-4">
              <h4 className="text-[0.92rem] font-medium text-bone">{project.name}</h4>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-bone/55">{project.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  )
}
