import { MARKET_CLAIMS, SEGMENTS } from '../content/program'
import SplitWords from '../motion/SplitWords'
import Chapter, { ChapterLabel } from './Chapter'

// Chapter 1. Why now, then the fork: the two audiences light separately.
export default function Stakes({ activeChapter }: { activeChapter: number }) {
  return (
    <Chapter index={1} activeChapter={activeChapter}>
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10">
        <ChapterLabel index={1} title="Why now" />

        <h2
          aria-label="AI is no longer the future"
          className="font-editorial mt-7 max-w-2xl text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.015em] text-bone"
        >
          <SplitWords text="AI is no longer the future" />
        </h2>

        <p className="beat mt-5 max-w-lg text-bone/65" style={{ ['--d' as string]: 300 }}>
          It is today&rsquo;s highest-paying skill.
        </p>

        <dl className="beat mt-14 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4" style={{ ['--d' as string]: 420 }}>
          {MARKET_CLAIMS.map((claim) => (
            <div key={claim.label} className="border-t border-bone/15 pt-4">
              <dt className="font-editorial text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-bone">
                {claim.value}
              </dt>
              <dd className="mt-2 text-[0.8rem] leading-relaxed text-bone/55">{claim.label}</dd>
            </div>
          ))}
        </dl>

        <div className="beat mt-16 grid gap-6 md:grid-cols-2" style={{ ['--d' as string]: 560 }}>
          {SEGMENTS.map((segment) => (
            <div
              key={segment.id}
              className="rounded-2xl border border-bone/12 bg-night-900/45 p-7 backdrop-blur-sm transition-colors duration-500 hover:border-ember/35"
            >
              <h3 className="font-editorial text-lg font-semibold text-bone">{segment.label}</h3>
              <ul className="mt-5 space-y-3">
                {segment.promises.map((promise) => (
                  <li key={promise} className="flex items-start gap-3 text-[0.9rem] text-bone/70">
                    <span className="mt-2 h-px w-4 shrink-0 bg-ember/70" aria-hidden="true" />
                    {promise}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Chapter>
  )
}
