import { useCourses } from '../../hooks/useCourses'
import EnquiryForm from '../../components/EnquiryForm'
import Reveal from '../../motion/Reveal'
import { useSchedule } from '../../utils/schedule'

export const NEUTRAL_BATCH_OPTION = 'Not sure yet — please advise'

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
}

// The form lives on the home page, where a visitor who has just read the shelf
// and the FAQ can send their details without being routed to a second page
// first. The batch list is derived here so both mounts cannot disagree.
export default function Enquiry() {
  const { rows } = useSchedule()
  const courses = useCourses()

  // Until the fetch lands we do not know what is scheduled - and saying "not yet
  // scheduled" about a running batch would be a false statement in a message the
  // visitor is about to send us.
  const scheduled = new Set((rows ?? []).map((row) => row.batch.course_name))

  const batchOptions = rows
    ? [
        ...rows.map(
          (row) =>
            `${row.batch.course_name} — ${row.batch.batch_number}, ${longDate(row.batch.start_date)}`,
        ),
        ...courses.filter((course) => !scheduled.has(course.name)).map(
          (course) => `${course.name} — not yet scheduled`,
        ),
        NEUTRAL_BATCH_OPTION,
      ]
    : [NEUTRAL_BATCH_OPTION]

  return (
    <section id="enquiry" className="shell pt-[140px]">
      <div className="grid items-start gap-12 min-[901px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[901px]:gap-[clamp(32px,5vw,80px)]">
        <div className="min-w-0">
          <Reveal>
            <p className="eyebrow mb-[26px]">Enquiry form</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <h2 className="display mb-[26px] max-w-[16ch] text-[clamp(28px,3.6vw,50px)] leading-[1.04] tracking-[-0.035em]">
              Send us your details.
            </h2>
          </Reveal>
          <Reveal delayIndex={2}>
            <p className="max-w-[38ch] text-base leading-[1.6] text-[color:var(--on-ink-faint)]">
              Fill this in and it opens WhatsApp with your details written out, so you are not
              typing them twice. We reply during working hours, usually within the hour.
            </p>
          </Reveal>
        </div>

        <Reveal delayIndex={1} className="min-w-0">
          <EnquiryForm batchOptions={batchOptions} neutralBatchOption={NEUTRAL_BATCH_OPTION} />
        </Reveal>
      </div>
    </section>
  )
}
