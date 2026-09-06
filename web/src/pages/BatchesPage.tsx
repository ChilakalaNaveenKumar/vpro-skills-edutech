import { hourRange } from '../utils/hours'
import { istTodayIso, isUpcoming, useSchedule } from '../utils/schedule'
import type { ScheduleRow } from '../utils/schedule'
import SeatsNote from '../components/SeatsNote'
import ScrollProgress from '../motion/ScrollProgress'
import Reveal from '../motion/Reveal'
import CtaLink from '../components/CtaLink'
import Enquiry from '../sections/home/Enquiry'
import FloatingContact from '../components/FloatingContact'
import { BATCH_LOOP } from '../content/homeSections'
import { useContentList } from '../hooks/useContent'
import type { BlockItem } from '../services/contentService'
import Seo from '../seo/Seo'
import { BreadcrumbJsonLd } from '../seo/structuredData'

const LOOP_FALLBACK: BlockItem[] = BATCH_LOOP.map((step, index) => ({
  id: -(index + 1),
  number: step.n,
  title: step.title,
  body: step.body,
}))

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const COL_LABEL = 'mono mb-1.5 text-[9.5px] text-[color:rgb(237_231_222_/_0.6)]'

// Every row used to carry the same three unlabelled lines of text and the same
// button, with nothing saying whether a batch was teaching already or had not
// opened yet - the one fact someone reads this page to find out. The rows are
// grouped under that answer instead, and each column is named, so the stacked
// phone layout is not four anonymous lines.
function ScheduleGroup({
  title,
  note,
  rows,
  today,
  startIndex,
}: {
  title: string
  note: string
  rows: ScheduleRow[]
  today: string
  startIndex: number
}) {
  return (
    <div className="mt-14 first:mt-12">
      <Reveal>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="eyebrow">{title}</h3>
          <p className="text-[0.9rem] text-[color:var(--on-ink-faint)]">{note}</p>
        </div>
      </Reveal>

      <div className="mt-6">
        {rows.map((row, index) => (
          <Reveal key={row.batch.id} delayIndex={startIndex + index} className="block">
            <article className="grid gap-5 border-t border-[color:var(--rule)] py-8 lg:grid-cols-[1.5fr_1fr_1.1fr_auto] lg:items-center lg:gap-10">
              <div>
                <h4 className="display text-[1.3rem]">{row.batch.course_name}</h4>
                <p className="mono mt-2 text-[color:var(--on-ink-faint)]">
                  {row.batch.batch_number}
                </p>
                {isUpcoming(row, today) && (
                  <SeatsNote row={row} className="mt-2 block text-[0.95rem]" />
                )}
              </div>

              <div>
                <p className={COL_LABEL}>Dates</p>
                <p className="text-[0.95rem] leading-[1.5] text-[color:var(--on-ink-mute)]">
                  {longDate(row.batch.start_date)} – {longDate(row.batch.end_date)}
                </p>
              </div>

              <div>
                <p className={COL_LABEL}>Hours</p>
                <p className="text-[0.95rem] leading-[1.5] text-[color:var(--on-ink-mute)]">
                  {hourRange(row.batch.start_time, row.batch.end_time)}
                  <span className="block text-[color:var(--on-ink-faint)]">
                    {row.batch.trainer_name}
                  </span>
                </p>
              </div>

              <CtaLink
                cta="reserve_seat"
                chapter="schedule"
                course={row.batch.course_name}
                batch={row.batch.batch_number}
                className="btn-primary btn-compact justify-self-start lg:justify-self-end"
              >
                Reserve my seat
              </CtaLink>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export default function BatchesPage() {
  const { rows, failed } = useSchedule()
  const today = istTodayIso()
  const loopSteps = useContentList<BlockItem>('batch-loop', LOOP_FALLBACK)
  const opening = (rows ?? []).filter((row) => isUpcoming(row, today))
  const running = (rows ?? []).filter((row) => !isUpcoming(row, today))

  return (
    <>
      <Seo
        path="/batches"
        title="Batch Dates & Timings"
        description="Every batch we are running or opening, with its start date, weekday hour and trainer. Live online classes at a fixed hour."
      />
      <BreadcrumbJsonLd trail={[{ name: 'Dates & timings', path: '/batches' }]} />
      <ScrollProgress />

      <section id="top" className="shell py-24 lg:py-32">
        <Reveal>
          <p className="eyebrow">Batch schedule</p>
        </Reveal>
        <Reveal delayIndex={1}>
          <h1 className="display mt-6 text-[clamp(2.6rem,6vw,4.4rem)]">Reserve your seat.</h1>
        </Reveal>
        <Reveal delayIndex={2}>
          <p className="lede mt-6 max-w-[48ch]">
            Every batch we are running or opening, live and online, with its hour.
            Pick one and message us, or send your details and we will come back to you.
          </p>
        </Reveal>
      </section>

      <section id="schedule" className="shell py-16 lg:py-20">
        <Reveal>
          <h2 className="display text-[clamp(2rem,3.8vw,2.9rem)]">Every batch, with its hour.</h2>
        </Reveal>

        {failed && (
          <p className="mt-10 text-[0.95rem] text-[color:var(--on-ink-mute)]">
            The schedule is not loading right now. Message us on WhatsApp and we will tell you what
            is running.
          </p>
        )}

        {rows && rows.length === 0 && (
          <p className="mt-10 text-[0.95rem] text-[color:var(--on-ink-mute)]">
            No batch is scheduled at the moment. Send your details below and you will hear the
            moment an hour is fixed.
          </p>
        )}

        {/* Opening first: a batch you can still start from day one is the thing
            most people are here to find. What is already teaching is the
            fallback, not the offer. */}
        {opening.length > 0 && (
          <ScheduleGroup
            title="Opening soon"
            note="Not started yet, so you begin with the first topic."
            rows={opening}
            today={today}
            startIndex={0}
          />
        )}

        {running.length > 0 && (
          <ScheduleGroup
            title="Running now"
            note="Teaching already. You can still take a seat and catch up on the recordings."
            rows={running}
            today={today}
            startIndex={opening.length}
          />
        )}
      </section>

      <section id="how" className="shell py-24 lg:py-28">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="display mt-6 text-[clamp(2rem,3.8vw,2.9rem)]">Four steps to a seat.</h2>
        </Reveal>

        <ol className="mt-12 grid gap-px bg-[color:var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
          {loopSteps.map((step, index) => (
            <Reveal key={step.id} delayIndex={index} className="bg-[color:var(--ink)] p-8">
              <span className="display text-[1.7rem] text-[color:var(--signal)]">{step.number}</span>
              <h3 className="display mt-4 text-[1.15rem]">{step.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </section>

      <Enquiry />

      <FloatingContact />
    </>
  )
}
