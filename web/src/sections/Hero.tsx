import { PLATFORM, HERO_ENDINGS } from '../content/platform'
import SplitWords from '../motion/SplitWords'
import LiveType from '../motion/LiveType'
import CtaLink from '../components/CtaLink'
import ScrollSequence, { type SequenceConfig } from '../components/ScrollSequence'
import { useSchedule } from '../utils/schedule'
import { Link } from 'react-router-dom'
import Section from './Section'

// A 96-frame live-broadcast microphone, scrubbed by scroll.
//
// The subject is the thing that makes a class live: a real voice, on air, at a
// fixed time. The frames are rendered on pure black and the stage is pure black,
// so the mic floats in the page with no visible image edge, and the generated
// composition leaves the left half empty for the copy.
//
// Scroll position alone decides the frame, so the same offset always produces
// the same state in both directions, and nothing autoplays.
const LIVE_SEQUENCE: SequenceConfig = {
  frameCount: 96,
  frameUrl: (index) => `/seq/live/f_${String(index).padStart(3, '0')}.webp`,
  scrollVh: 260,
  posterFrame: 1,
  reducedMotionFrame: 96,
  fit: 'contain',
  mobileStride: 2,
  // Biased right, so the subject never enters the copy's column.
  region: { x: 0.22, y: 0.05, w: 0.76, h: 0.88 },
  // On a phone the mic takes the top third and the copy sits under it.
  mobileRegion: { x: 0.1, y: 0.02, w: 0.8, h: 0.34 },
}

export default function Hero() {
  const { liveNow, nextUp } = useSchedule()

  return (
    <Section id="hero" className="relative bg-black">
      <ScrollSequence config={LIVE_SEQUENCE}>
        <div className="pointer-events-none absolute inset-0 flex items-end pb-16 lg:items-center lg:pb-0">
          <div className="shell w-full">
            <LiveType>
              <div className="hero-copy pointer-events-auto max-w-lg lg:max-w-[42%]">
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
                        {liveNow.batch.course_name}
                      </span>
                    </span>
                  )}
                  {!liveNow && nextUp && (
                    <span className="text-[0.72rem] text-[color:var(--on-ink-faint)]">
                      Next live class {nextUp.batch.start_time.slice(0, 5)} IST
                    </span>
                  )}
                </div>

                <h1
                  aria-label={`${PLATFORM.headline} ${HERO_ENDINGS[0]}`}
                  className="display mt-7 text-[clamp(2.4rem,5.4vw,4rem)] text-[color:var(--on-ink)]"
                >
                  <SplitWords text={PLATFORM.headline} />
                  <span className="cycle mt-1" aria-label={HERO_ENDINGS.join(' or ')}>
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

                <p className="lede rise mt-7 max-w-lg">{PLATFORM.sub}</p>

                <ul className="rise-stagger mt-9 grid max-w-md grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  {PLATFORM.proof.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="h-px w-4 bg-[color:var(--signal)]" aria-hidden="true" />
                      <span className="text-[0.64rem] font-medium uppercase tracking-[0.16em] text-[color:var(--on-ink-faint)]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="rise mt-11 flex flex-wrap items-center gap-4">
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
            </LiveType>
          </div>
        </div>

        {/* Captions timed to the deconstruction. Text only - the single set of
            CTAs above stays in the DOM once, so focus order never changes. */}
        <p className="seq-stop seq-stop-2 absolute bottom-10 right-[6%] max-w-[38%] text-right text-[0.78rem] uppercase tracking-[0.22em] text-[color:var(--on-ink-faint)]">
          A real voice, at a fixed time
        </p>
        <p className="seq-stop seq-stop-3 absolute bottom-10 right-[6%] max-w-[38%] text-right text-[0.78rem] uppercase tracking-[0.22em] text-[color:var(--signal-text)]">
          Ask while the class is happening
        </p>
      </ScrollSequence>
    </Section>
  )
}
