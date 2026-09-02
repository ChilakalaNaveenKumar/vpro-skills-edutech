import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { DemoSession } from '../services/demoSessionsService'
import { FAQ } from '../content/faq'
import { AUDIENCE_OPTIONS } from '../content/program'
import { formatDate } from '../utils/ist'
import SplitWords from '../motion/SplitWords'
import CtaLink from '../components/CtaLink'
import Section, { SectionLabel } from './Section'

interface Props {
  demo: DemoSession | null
}

// Section 05. The split ending the live site never had: prospects go to
// WhatsApp, people who already paid go to the portal. Both are one tap.
export default function Join({ demo }: Props) {
  const [segment, setSegment] = useState<string>(AUDIENCE_OPTIONS[0])
  const seatsLeft = demo ? Math.max(0, demo.seats_total - demo.seats_taken) : null

  return (
    <Section id="join" className="border-t border-[color:var(--rule)]">
      <div className="shell py-24 lg:py-28">
        <SectionLabel id="join" title="Start here" />

        <h2
          aria-label="Sit in on one live class before you decide"
          className="display mt-7 max-w-[20ch] text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.0] tracking-[-0.03em] text-[color:var(--on-ink)]"
        >
          <SplitWords text="Sit in on one live class before you decide" />
        </h2>

        <div
          className="rise bracketed mt-14 border border-[color:var(--rule)] bg-[color:var(--ink-2)] p-7 sm:p-9"
        >
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--signal)]">
            Free live demo
          </p>

          {demo ? (
            <>
              <p className="tnum display mt-4 text-[clamp(1.4rem,3.2vw,2.2rem)] font-extrabold tracking-[-0.03em] text-[color:var(--on-ink)]">
                {formatDate(demo.session_date)} · {demo.session_time} IST
              </p>
              <p className="mt-2 text-[0.86rem] text-[color:var(--on-ink-mute)]">
                Live class
                {seatsLeft !== null ? ` · ${seatsLeft} of ${demo.seats_total} seats left` : ''}
              </p>
            </>
          ) : (
            <p className="display mt-4 text-[clamp(1.2rem,2.6vw,1.7rem)] font-bold tracking-[-0.02em] text-[color:var(--on-ink)]">
              Message us for the next session date
            </p>
          )}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--on-ink-faint)]">
              I am a
              <select
                value={segment}
                onChange={(event) => setSegment(event.target.value)}
                className="rounded-full border border-[color:var(--rule)] bg-[color:var(--ink-2)] px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-[color:var(--on-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]"
              >
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <CtaLink
              cta="reserve_seat"
              chapter="join"
              segment={segment}
              magnetic
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--paper)] px-7 py-3.5 text-sm font-semibold text-[color:var(--ink)] ring-1 ring-[color:var(--paper)] transition-transform duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]"
            >
              Reserve my free seat
            </CtaLink>
          </div>
        </div>

        <div className="rise mt-20">
          <h3 className="display text-[clamp(1.4rem,3vw,2.2rem)] font-bold tracking-[-0.02em] text-[color:var(--on-ink)]">
            Before you join
          </h3>
          <div className="mt-8 border-t border-[color:var(--rule)]">
            {FAQ.map((entry) => (
              <details key={entry.question} className="group border-b border-[color:var(--rule)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4.5 text-[0.95rem] text-[color:var(--on-ink)] marker:content-none">
                  {entry.question}
                  <span
                    className="text-[color:var(--signal)] transition-transform duration-300 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 pr-10 text-[0.88rem] leading-relaxed text-[color:var(--on-ink-mute)]">{entry.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div
          className="rise mt-20 flex flex-col gap-4 border-t border-[color:var(--rule)] pt-12 sm:flex-row sm:items-center sm:justify-between"
        >
          <CtaLink
            cta="demo_register"
            chapter="join_footer"
            segment={segment}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--paper)] px-7 py-3.5 text-sm font-semibold text-[color:var(--ink)] ring-1 ring-[color:var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]"
          >
            Book your free demo
          </CtaLink>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--rule)] px-7 py-3.5 text-sm font-medium text-[color:var(--on-ink-mute)] transition-colors hover:border-ink-faint hover:text-[color:var(--on-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]"
          >
            Already enrolled? Student portal
          </Link>
        </div>
      </div>
    </Section>
  )
}
