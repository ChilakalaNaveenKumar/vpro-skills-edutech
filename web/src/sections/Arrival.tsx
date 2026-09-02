import { PROGRAM } from '../content/program'
import { CONTACT, isOpenNow } from '../content/contact'
import SplitWords from '../motion/SplitWords'
import CtaLink from '../components/CtaLink'
import Chapter from './Chapter'

// Chapter 0. The strongest authored moment: oversized left-aligned headline over
// the fog-bound valley, with one ember of lantern light in the world behind it.
export default function Arrival({ activeChapter }: { activeChapter: number }) {
  const open = isOpenNow()

  return (
    <Chapter index={0} activeChapter={activeChapter}>
      <div className="mx-auto w-full max-w-6xl px-6 py-28 sm:px-10">
        <div className="max-w-3xl">
          <div className="beat flex flex-wrap items-center gap-x-4 gap-y-2" style={{ ['--d' as string]: 0 }}>
            <span className="text-[0.7rem] uppercase tracking-[0.28em] text-bone/55">
              {CONTACT.location}
            </span>
            <span className="h-px w-8 bg-bone/25" aria-hidden="true" />
            <span className="text-[0.7rem] uppercase tracking-[0.28em] text-bone/55">Live on Zoom</span>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${
                open ? 'border-ember/40 text-ember' : 'border-bone/20 text-bone/45'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-ember' : 'bg-bone/40'}`}
                aria-hidden="true"
              />
              {open ? 'Replying now' : `Replies ${CONTACT.hours.openHour}:00-${CONTACT.hours.closeHour}:00 IST`}
            </span>
          </div>

          <h1
            aria-label={PROGRAM.headline}
            className="font-editorial mt-8 text-[clamp(2.6rem,7.4vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-bone"
          >
            <SplitWords text={PROGRAM.headline} />
          </h1>

          <p
            className="beat mt-7 max-w-xl text-[1.02rem] leading-relaxed text-bone/70"
            style={{ ['--d' as string]: 320 }}
          >
            {PROGRAM.sub}
          </p>

          <ul
            className="beat mt-9 flex flex-wrap gap-x-6 gap-y-3"
            style={{ ['--d' as string]: 430 }}
          >
            {PROGRAM.proof.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="h-px w-5 bg-ember/70" aria-hidden="true" />
                <span className="text-[0.78rem] uppercase tracking-[0.16em] text-bone/65">{item}</span>
              </li>
            ))}
          </ul>

          <div
            className="beat mt-11 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ ['--d' as string]: 540 }}
          >
            <CtaLink
              cta="hero_demo"
              chapter="arrival"
              magnetic
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ember px-7 py-3.5 text-sm font-semibold text-night-900 transition-transform duration-300 hover:scale-[1.02]"
            >
              Book your free demo
            </CtaLink>
            <a
              href="#path"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-bone/25 px-7 py-3.5 text-sm font-medium text-bone/85 transition-colors duration-300 hover:border-bone/50 hover:text-bone"
            >
              View the curriculum
            </a>
          </div>
        </div>
      </div>

      <div
        className="beat pointer-events-none absolute bottom-8 left-6 flex items-center gap-3 sm:left-10"
        style={{ ['--d' as string]: 900 }}
      >
        <span className="h-8 w-px bg-gradient-to-b from-transparent to-bone/40" aria-hidden="true" />
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-bone/45">Scroll to climb</span>
      </div>
    </Chapter>
  )
}
