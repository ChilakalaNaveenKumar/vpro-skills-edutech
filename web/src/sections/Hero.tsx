import { PLATFORM, HERO_ENDINGS } from '../content/platform'
import SplitWords from '../motion/SplitWords'
import LiveType from '../motion/LiveType'
import CtaLink from '../components/CtaLink'
import WeekTimetable from '../components/WeekTimetable'
import Section from './Section'

// The hero answers "what is this place", not "buy this course".
//
// The headline's last line rotates through the four things that make a live class
// different from a video, so the hero is alive with no pointer and no scroll -
// and the four are the same four the rest of the page then proves.
//
// The panel on the right illustrates a teaching week; it is not wired to the
// schedule API. A hero has to be the same strong thing for every visitor at
// every hour, and most arrivals here come from ads at unpredictable times.
//
// The Ameerpet address is deliberately absent. It is real, and it is in the
// footer and the page metadata where somebody looking for it will look.
export default function Hero() {
  return (
    <Section id="hero">
      <LiveType>
        <div className="shell grid items-center gap-12 pb-16 pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 lg:pb-24 lg:pt-32">
          <div>
            <p className="eyebrow rise">{PLATFORM.eyebrow}</p>

            <h1
              aria-label={`${PLATFORM.headline} ${HERO_ENDINGS[0]}`}
              className="display mt-7 text-[clamp(2.4rem,5.9vw,4.2rem)] text-[color:var(--on-ink)]"
            >
              <SplitWords text={PLATFORM.headline} />
              <span className="cycle mt-1" aria-label={HERO_ENDINGS.join(' or ')}>
                {/* Lays out the longest phrase for real, then hides it, so the
                    box reserves the exact height the rotating lines need. */}
                <span className="cycle-sizer" aria-hidden="true">
                  {[...HERO_ENDINGS].sort((a, b) => b.length - a.length)[0]}
                </span>
                {HERO_ENDINGS.map((ending, index) => (
                  <span
                    key={ending}
                    aria-hidden="true"
                    style={{ ['--d' as string]: `${(index * 21) / HERO_ENDINGS.length}s` }}
                  >
                    {ending}
                    <i className="caret" aria-hidden="true" />
                  </span>
                ))}
              </span>
            </h1>

            <p className="lede rise mt-8 max-w-xl">{PLATFORM.sub}</p>

            <ul className="rise-stagger mt-10 flex flex-wrap gap-x-7 gap-y-3">
              {PLATFORM.proof.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-px w-4 bg-[color:var(--signal)]" aria-hidden="true" />
                  <span className="text-[0.66rem] font-medium uppercase tracking-[0.16em] text-[color:var(--on-ink-faint)]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="rise mt-12 flex flex-wrap items-center gap-4">
              <CtaLink
                cta="live_class_times"
                chapter="hero"
                magnetic
                className="magnetic inline-flex items-center justify-center rounded-full bg-[color:var(--paper)] px-7 py-3.5 text-sm font-semibold text-[color:var(--ink)] ring-1 ring-[color:var(--paper)] hover:bg-white"
              >
                Ask about the next batch
              </CtaLink>
              <a
                href="#why"
                className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--rule)] px-7 py-3.5 text-sm font-medium text-[color:var(--on-ink-mute)] transition-colors duration-300 hover:border-[color:var(--on-ink-faint)] hover:text-[color:var(--on-ink)]"
              >
                Why it works this way
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                >
                  ↓
                </span>
              </a>
            </div>
          </div>

          <div className="rise">
            <WeekTimetable />
          </div>
        </div>
      </LiveType>
    </Section>
  )
}
