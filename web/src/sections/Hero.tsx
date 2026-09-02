import { Link } from 'react-router-dom'
import { PLATFORM, HERO_ENDINGS } from '../content/platform'
import SplitWords from '../motion/SplitWords'
import LiveType from '../motion/LiveType'
import CtaLink from '../components/CtaLink'
import HeroWeek3D from '../components/HeroWeek3D'
import { useSchedule } from '../utils/schedule'
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
  const { rows, failed, liveNow, nextUp } = useSchedule()

  return (
    <Section id="hero" className="relative isolate min-h-[94svh] items-center overflow-hidden">
      <HeroWeek3D rows={rows} failed={failed} />
      <div className="hero-scrim pointer-events-none absolute inset-0" aria-hidden="true" />
      <LiveType>
        <div className="shell relative z-10 pb-20 pt-28 lg:pb-28 lg:pt-36">
          <div className="max-w-2xl">
            <div className="rise flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="eyebrow">{PLATFORM.eyebrow}</p>
              {liveNow && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--signal)]/45 px-3 py-1">
                  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--signal)] opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--signal)]" />
                  </span>
                  <span className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--signal-text)]">
                    Teaching now
                  </span>
                  <span className="text-[0.72rem] text-[color:var(--on-ink-mute)]">
                    {liveNow.batch.course_name} &middot; {liveNow.batch.trainer_name}
                  </span>
                </span>
              )}
              {!liveNow && nextUp && (
                <span className="text-[0.72rem] text-[color:var(--on-ink-faint)]">
                  Next live class {nextUp.batch.start_time.slice(0, 5)} IST &middot;{' '}
                  {nextUp.batch.course_name}
                </span>
              )}
            </div>

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
              <Link
                to="/courses"
                className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--rule)] px-7 py-3.5 text-sm font-medium text-[color:var(--on-ink-mute)] transition-colors duration-300 hover:border-[color:var(--on-ink-faint)] hover:text-[color:var(--on-ink)]"
              >
                View all courses
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

        </div>
      </LiveType>
    </Section>
  )
}
