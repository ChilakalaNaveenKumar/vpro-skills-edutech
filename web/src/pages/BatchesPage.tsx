import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import { useSchedule } from '../utils/schedule'
import ScrollProgress from '../motion/ScrollProgress'
import Reveal from '../motion/Reveal'
import CtaLink from '../components/CtaLink'
import EnquiryForm from '../components/EnquiryForm'
import MobileActionBar from '../components/MobileActionBar'
import { BATCH_LOOP } from '../content/homeSections'

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BatchesPage() {
  const { rows, failed } = useSchedule()

  // Which courses have no batch at all - not which are currently running.
  // `courseStateFor` answers the latter, so a course with a batch that has yet
  // to start was listed both with its batch and as "not yet scheduled".
  const scheduled = new Set((rows ?? []).map((row) => row.batch.course_name))

  const batchOptions = [
    ...(rows ?? []).map(
      (row) => `${row.batch.course_name} — ${row.batch.batch_number}, ${longDate(row.batch.start_date)}`,
    ),
    ...COURSES.filter((course) => !scheduled.has(course.name)).map(
      (course) => `${course.name} — not yet scheduled`,
    ),
    'Not sure yet — please advise',
  ]

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
                  </div>
                  <p className="text-[0.95rem] text-[color:var(--on-ink-mute)]">
                    {longDate(row.batch.start_date)} – {longDate(row.batch.end_date)}
                  </p>
                  <p className="text-[0.95rem] text-[color:var(--on-ink-mute)]">
                    {row.batch.start_time.slice(0, 5)} – {row.batch.end_time.slice(0, 5)} IST ·{' '}
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
          {BATCH_LOOP.map((step, index) => (
            <Reveal key={step.n} delayIndex={index} className="bg-[color:var(--ink)] p-8">
              <span className="display text-[1.7rem] text-[color:var(--signal)]">{step.n}</span>
              <h3 className="display mt-4 text-[1.15rem]">{step.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="enquiry" className="shell py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <p className="eyebrow">Enquiry form</p>
            </Reveal>
            <Reveal delayIndex={1}>
              <h2 className="display mt-6 max-w-[16ch] text-[clamp(2rem,3.8vw,2.9rem)]">
                Send us your details.
              </h2>
            </Reveal>
            <Reveal delayIndex={2}>
              <p className="mt-6 max-w-[40ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                Fill this in and it opens WhatsApp with your details written out, so you are not
                typing them twice. We reply during working hours, usually within the hour.
              </p>
            </Reveal>
            <Reveal delayIndex={0}>
              <Link to="/courses" className="btn-secondary mt-8">
                Browse the courses
              </Link>
            </Reveal>
          </div>

          <Reveal delayIndex={1}>
            <EnquiryForm batchOptions={batchOptions} />
          </Reveal>
        </div>
      </section>

      <MobileActionBar />
    </>
  )
}
