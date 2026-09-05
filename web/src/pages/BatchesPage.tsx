import { hourRange } from '../utils/hours'
import { istTodayIso, isUpcoming, useSchedule } from '../utils/schedule'
import SeatsNote from '../components/SeatsNote'
import ScrollProgress from '../motion/ScrollProgress'
import Reveal from '../motion/Reveal'
import CtaLink from '../components/CtaLink'
import Enquiry from '../sections/home/Enquiry'
import MobileActionBar from '../components/MobileActionBar'
import FloatingContact from '../components/FloatingContact'
import { BATCH_LOOP } from '../content/homeSections'
import { useContentList } from '../hooks/useContent'
import type { BlockItem } from '../services/contentService'

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

export default function BatchesPage() {
  const { rows, failed } = useSchedule()
  const today = istTodayIso()
  const loopSteps = useContentList<BlockItem>('batch-loop', LOOP_FALLBACK)


  return (
    <>
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
            Every batch we are running or opening, with its hour. Pick one and message us, or send
            your details and we will come back to you.
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

        {rows && rows.length > 0 && (
          <div className="mt-12">
            {rows.map((row, index) => (
              <Reveal key={row.batch.id} delayIndex={index} className="block">
                <article className="grid gap-4 border-t border-[color:var(--rule)] py-8 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center lg:gap-10">
                  <div>
                    <h3 className="display text-[1.3rem]">{row.batch.course_name}</h3>
                    <p className="mono mt-2 text-[color:var(--on-ink-faint)]">
                      {row.batch.batch_number}
                    </p>
                    {isUpcoming(row, today) && (
                      <SeatsNote row={row} className="mt-2 block text-[0.95rem]" />
                    )}
                  </div>
                  <p className="text-[0.95rem] text-[color:var(--on-ink-mute)]">
                    {longDate(row.batch.start_date)} – {longDate(row.batch.end_date)}
                  </p>
                  <p className="text-[0.95rem] text-[color:var(--on-ink-mute)]">
                    {hourRange(row.batch.start_time, row.batch.end_time)},{' '}
                    {row.batch.trainer_name}
                  </p>
                  <CtaLink
                    cta="reserve_seat"
                    chapter="schedule"
                    course={row.batch.course_name}
                    className="btn-primary"
                  >
                    Reserve my seat
                  </CtaLink>
                </article>
              </Reveal>
            ))}
          </div>
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

      <MobileActionBar />
      <FloatingContact />
    </>
  )
}
