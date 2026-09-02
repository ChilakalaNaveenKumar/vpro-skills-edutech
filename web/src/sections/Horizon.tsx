import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBatches } from '../services/batchesService'
import { getNextDemoSession, type DemoSession } from '../services/demoSessionsService'
import type { Batch } from '../types'
import { FAQ } from '../content/faq'
import { AUDIENCE_OPTIONS } from '../content/program'
import SplitWords from '../motion/SplitWords'
import CtaLink from '../components/CtaLink'
import Chapter, { ChapterLabel } from './Chapter'

function formatSessionDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Chapter 4. Full dawn: the real schedule, the real next demo, the FAQ, then the
// split ending - prospects to WhatsApp, enrolled students to the portal.
export default function Horizon({ activeChapter }: { activeChapter: number }) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [demo, setDemo] = useState<DemoSession | null>(null)
  const [segment, setSegment] = useState<string>(AUDIENCE_OPTIONS[0])

  useEffect(() => {
    let mounted = true
    listBatches()
      .then((data) => { if (mounted) setBatches(data) })
      .catch(() => { if (mounted) setBatches([]) })
    getNextDemoSession().then((data) => { if (mounted) setDemo(data) })
    return () => { mounted = false }
  }, [])

  const upcoming = batches.filter((batch) => batch.progress_status === 'IN_PROGRESS' || batch.status === 'ACTIVE')
  const seatsLeft = demo ? Math.max(0, demo.seats_total - demo.seats_taken) : null

  return (
    <Chapter index={4} activeChapter={activeChapter} className="items-start">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10">
        <ChapterLabel index={4} title="Start here" />

        <h2
          aria-label="Your next 90 days start with one live session"
          className="font-editorial mt-7 max-w-2xl text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.015em] text-bone"
        >
          <SplitWords text="Your next 90 days start with one live session" />
        </h2>

        <div className="beat mt-12 rounded-2xl border border-ember/30 bg-night-900/50 p-8 backdrop-blur-sm" style={{ ['--d' as string]: 280 }}>
          <p className="text-[0.7rem] uppercase tracking-[0.28em] text-ember">Free live demo</p>
          {demo ? (
            <>
              <p className="font-editorial mt-4 text-[clamp(1.4rem,3vw,2rem)] font-semibold text-bone">
                {formatSessionDate(demo.session_date)} · {demo.session_time} IST
              </p>
              <p className="mt-2 text-[0.86rem] text-bone/60">
                Online via Zoom{seatsLeft !== null ? ` · ${seatsLeft} of ${demo.seats_total} seats left` : ''}
              </p>
            </>
          ) : (
            <p className="font-editorial mt-4 text-[clamp(1.2rem,2.4vw,1.6rem)] font-semibold text-bone">
              Message us for the next session date
            </p>
          )}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="flex flex-col gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-bone/50">
              I am a
              <select
                value={segment}
                onChange={(event) => setSegment(event.target.value)}
                className="rounded-full border border-bone/20 bg-night-900/80 px-4 py-2.5 text-sm normal-case tracking-normal text-bone"
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
              chapter="horizon"
              segment={segment}
              magnetic
              className="inline-flex items-center justify-center rounded-full bg-ember px-7 py-3.5 text-sm font-semibold text-night-900 transition-transform duration-300 hover:scale-[1.02] sm:mt-6"
            >
              Reserve my free seat
            </CtaLink>
          </div>
        </div>

        {upcoming.length > 0 && (
          <div className="beat mt-20" style={{ ['--d' as string]: 120 }}>
            <h3 className="font-editorial text-[clamp(1.4rem,2.8vw,2rem)] font-semibold text-bone">
              Live batches
            </h3>
            <ul className="mt-8 space-y-px">
              {upcoming.map((batch) => (
                <li className="border-t border-bone/12 py-5 last:border-b" key={batch.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <p className="font-medium text-bone">{batch.course_name}</p>
                      <p className="mt-1 text-[0.8rem] text-bone/50">
                        Batch {batch.batch_number} · Trainer {batch.trainer_name}
                      </p>
                    </div>
                    <p className="text-[0.84rem] text-bone/65">
                      {batch.start_date} – {batch.end_date} · {batch.start_time}–{batch.end_time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="beat mt-20" style={{ ['--d' as string]: 120 }}>
          <h3 className="font-editorial text-[clamp(1.4rem,2.8vw,2rem)] font-semibold text-bone">
            Before you join
          </h3>
          <div className="mt-8 space-y-px">
            {FAQ.map((entry) => (
              <details key={entry.question} className="group border-t border-bone/12 last:border-b">
                <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-[0.95rem] text-bone/85 marker:content-none">
                  {entry.question}
                  <span className="text-ember transition-transform duration-300 group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="pb-5 text-[0.88rem] leading-relaxed text-bone/60">{entry.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="beat mt-24 flex flex-col gap-4 border-t border-bone/15 pt-12 sm:flex-row sm:items-center sm:justify-between" style={{ ['--d' as string]: 120 }}>
          <CtaLink
            cta="demo_register"
            chapter="horizon_footer"
            segment={segment}
            className="inline-flex items-center justify-center rounded-full bg-ember px-7 py-3.5 text-sm font-semibold text-night-900"
          >
            Book your free demo
          </CtaLink>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-bone/25 px-7 py-3.5 text-sm font-medium text-bone/85 transition-colors hover:border-bone/50 hover:text-bone"
          >
            Already enrolled? Student portal
          </Link>
        </div>
      </div>
    </Chapter>
  )
}
