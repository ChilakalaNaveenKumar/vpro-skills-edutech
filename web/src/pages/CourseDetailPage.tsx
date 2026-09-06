import { useParams, Navigate, Link } from 'react-router-dom'
import { findBySlug, useCourses } from '../hooks/useCourses'
import { courseBatches, courseStateFor } from '../utils/courseState'
import { hourRange } from '../utils/hours'
import { useSchedule } from '../utils/schedule'
import ScrollProgress from '../motion/ScrollProgress'
import Reveal from '../motion/Reveal'
import CtaLink from '../components/CtaLink'
import { isFileUrl, toEmbedUrl } from '../utils/videoEmbed'

// Every size, weight and gap below is the comp's own value from
// Course.dc.html rather than an approximation of it.
const SECTION = 'shell pt-[140px]'
const SECTION_HEAD =
  'mb-14 grid items-end gap-12 min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,auto)]'
const SECTION_H2 =
  'display max-w-[16ch] text-[clamp(34px,5.2vw,76px)] font-normal leading-[0.98] tracking-[-0.04em]'
const SECTION_NOTE = 'max-w-[30ch] text-[16px] leading-[1.6] text-[color:var(--on-ink-faint)]'

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

interface Props {
  /** Supplied when the course is opening inside another page. */
  slug?: string
  /** Present in that case too - renders the close control. */
  onClose?: () => void
}

export default function CourseDetailPage({ slug: slugProp, onClose }: Props = {}) {
  const params = useParams()
  const slug = slugProp ?? params.slug
  const { rows } = useSchedule()
  const courses = useCourses()
  const course = findBySlug(courses, slug ?? '')

  // The hook always has the shipped courses as its fallback, so a miss here is
  // a genuinely unknown slug rather than a request still in flight.
  // In place there is nowhere to redirect to - close and the page is still
  // underneath. As a route, an unknown slug goes back to the index.
  if (!course) {
    if (onClose) return null
    return <Navigate to="/courses" replace />
  }

  // A missing schedule is unknown, not evidence that the course is gathering interest.
  const state = rows ? courseStateFor(course.name, rows) : null
  const batches = courseBatches(course.name, rows)
  const inSession = state === 'In session'
  // A dated batch is a seat someone can take, whether or not it has begun.
  const hasSeat = batches.length > 0
  // The batch this page headlines. `courseBatches` puts the not-yet-started
  // cohorts first, so this is the soonest one someone can join from its first
  // topic - it is not necessarily the one teaching.
  const lead = batches[0]
  // With a choice of cohorts each one needs its own button, so what reaches
  // WhatsApp is the batch the person picked rather than a list of all of them.
  const multiBatch = batches.length > 1
  // Every dated cohort gets a card, in the same order the rest of the page
  // lists them. This used to keep only the batches that had yet to begin, so a
  // course teaching one batch and opening another showed a single card and the
  // page quietly offered fewer seats than the shelf did. Pairing each card with
  // its entry also gives the button the exact batch it is printed under.
  const batchCards = batches.flatMap((entry) => {
    const row = (rows ?? []).find(
      (candidate) =>
        candidate.batch.course_name === course.name &&
        candidate.batch.batch_number === entry.number,
    )
    return row ? [{ entry, row }] : []
  })

  // The batch data carries the real trainer. A hardcoded name here would keep
  // claiming a trainer after the person teaching a course changed.
  const trainer = rows?.find((row) => row.batch.course_name === course.name)?.batch.trainer_name

  // With two cohorts the eyebrow named only the first, so the page announced one
  // hour while the batch list underneath offered two.
  const eyebrow = [
    state,
    batches.length > 1 ? `${batches.length} batches` : lead?.number,
    batches.length > 1 ? undefined : lead?.daysHour,
  ]
    .filter(Boolean)
    .join(' · ')

  const facts = [
    { k: 'Level', v: course.level },
    { k: 'Prerequisites', v: course.prerequisites },
    // Only when there is no batch to print: the hours otherwise come from the
    // batch list, which can hold more than one of them.
    ...(state && !hasSeat ? [{ k: 'Format', v: 'Live, hour fixed when the batch opens' }] : []),
    ...(trainer ? [{ k: 'Trainer', v: trainer }] : []),
  ].filter((fact) => fact.v.trim().length > 0)

  // Three states, not two. A course whose next batch has a printed start date
  // used to share its wording with a course that has nothing scheduled, so the
  // page told a visitor to register interest in a batch already on the schedule.
  const primaryCta = !hasSeat
    ? 'Tell me when it opens'
    : multiBatch
      ? 'Help me pick a batch'
      : 'Reserve my seat'
  const enrolEyebrow = inSession
    ? 'Free demo class · no fee to attend'
    : hasSeat
      ? batches.length > 1
        ? `${batches.length} batches open · pick the hour that suits you`
        : `Next batch · ${lead.note} · ${lead.hour}`
      : 'No batch scheduled yet'
  const enrolHeading = inSession
    ? 'Attend a free demo class before you enrol.'
    : hasSeat
      ? 'Take a seat in the next batch.'
      : 'Tell us you want this and we open the batch.'
  const enrolBody = inSession
    ? 'You attend a real session, not a sales presentation. Ask questions, watch something break and get fixed, and decide afterwards. Nothing is charged before that.'
    : hasSeat
      ? 'Seats are held in the order people ask. Message us and we confirm yours, answer anything you want to know first, and send the joining details before the batch begins.'
      : 'This course runs as a live batch, so it opens once enough people can hold the same hour. Ask and you hear from us the moment a date and time are fixed — no fee, no commitment until then.'

  return (
    <>
      {!onClose && <ScrollProgress />}

      <section className={`shell ${onClose ? 'pt-[120px]' : 'pt-[150px]'}`}>
        {eyebrow && (
          <p className="eyebrow fade-in mb-8">{eyebrow}</p>
        )}

        <h1 className="display mb-8 max-w-[18ch] text-[clamp(42px,7.4vw,128px)] font-normal leading-[0.94] tracking-[-0.05em]">
          <span className="block overflow-hidden">
            <span className="rise-in block" style={{ ['--rise-delay' as string]: '0.08s' }}>
              {course.name}
            </span>
          </span>
        </h1>

        <div className="grid items-start gap-[clamp(32px,5vw,72px)] pb-20 min-[901px]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="min-w-0">
            {course.tagline && (
              <p className="display-sm mb-7 max-w-[40ch] text-[clamp(21px,2.2vw,30px)] leading-[1.4] text-[color:rgb(237_231_222_/_0.86)]">
                {course.tagline}
              </p>
            )}
            <p className="max-w-[58ch] text-[17px] leading-[1.66] text-[color:rgb(237_231_222_/_0.68)]">
              {course.summary}
            </p>
          </div>

          <div className="min-w-0">
            <dl>
              {/* Every cohort, not just the one the page headlines. A course
                  with a morning and an evening batch used to print one hour
                  here, so half the offer was invisible on its own page. */}
              {hasSeat && (
                <div className="py-[18px] shadow-[inset_0_-1px_0_0_var(--rule)]">
                  <dt className="mono mb-2 text-[10.5px] text-[color:var(--on-ink-faint)]">
                    {batches.length === 1 ? 'Batch' : `${batches.length} batches to choose from`}
                  </dt>
                  <div className="flex flex-col gap-[14px]">
                    {batches.map((batch) => (
                      <dd key={batch.number} className="flex flex-col gap-[7px]">
                        <span className="flex flex-wrap items-baseline gap-x-[10px] gap-y-[2px]">
                          <span className="mono text-[10px] tracking-[0.1em] text-[color:var(--tan)]">
                            {batch.number}
                          </span>
                          <span className="tnum text-[16px] leading-[1.5] text-[color:var(--on-ink)]">
                            {batch.daysHour}
                          </span>
                          <span className="text-[13.5px] text-[color:var(--on-ink-faint)]">
                            {batch.when}
                          </span>
                        </span>
                        {/* Booking lives in the enrol block, where each of these
                            batches has its own button. Repeating them up here,
                            above the curriculum, would ask before the page has
                            said what the course is. */}
                        {multiBatch && (
                          <a
                            href="#enrol"
                            className="btn-secondary btn-compact self-start"
                          >
                            {`Take ${batch.number}`}
                          </a>
                        )}
                      </dd>
                    ))}
                  </div>
                </div>
              )}

              {facts.map((fact) => (
                <div key={fact.k} className="py-[18px] shadow-[inset_0_-1px_0_0_var(--rule)]">
                  <dt className="mono mb-2 text-[10.5px] text-[color:var(--on-ink-faint)]">
                    {fact.k}
                  </dt>
                  <dd className="text-[16px] leading-[1.5] text-[color:var(--on-ink)]">{fact.v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-[10px] pt-6">
              {/* The comp sends the hero's primary button down to the enrol
                  block rather than straight out to WhatsApp - the ask is made
                  once, at the bottom, after the curriculum. */}
              <a href="#enrol" className="btn-primary">
                {primaryCta}
              </a>
              <Link to="/batches#enquiry" className="btn-secondary">
                Send us your details
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="shell">
        <Reveal>
          <p className="eyebrow mb-6">The course, explained</p>
        </Reveal>
        <Reveal delayIndex={1}>
          {course.videoUrl ? (
            <div className="aspect-video w-full overflow-hidden bg-[color:var(--ink-2)] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)]">
              {isFileUrl(course.videoUrl) ? (
                <video src={course.videoUrl} controls preload="metadata" className="h-full w-full" />
              ) : (
                <iframe
                  src={toEmbedUrl(course.videoUrl)}
                  title={`${course.name} course explainer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              )}
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-[18px] bg-[color:var(--ink-2)] p-10 text-center shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)]">
              <span
                aria-hidden="true"
                className="flex h-[76px] w-[76px] items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgb(200_112_70_/_0.7)]"
              >
                <span className="ml-[5px] block h-0 w-0 border-y-[11px] border-l-[16px] border-y-transparent border-l-[color:var(--signal)]" />
              </span>
              <p className="mono text-[10.5px] text-[color:var(--on-ink-faint)]">
                Course explainer video
              </p>
              <p className="max-w-[38ch] text-[15px] leading-[1.55] text-[color:var(--on-ink-faint)]">
                Send the file and it plays here — the trainer walking through what the course
                covers.
              </p>
            </div>
          )}
        </Reveal>
      </section>

      <section id="curriculum" className={SECTION}>
        <Reveal className={`${SECTION_HEAD} mb-[60px]`}>
          <h2 className={SECTION_H2}>
            {course.modules.length === 6 ? 'Six' : course.modules.length} modules, in order.
          </h2>
          <p className={SECTION_NOTE}>
            Nothing is optional and nothing is out of sequence. Each module ends in an assessment
            and something you built.
          </p>
        </Reveal>

        {course.modules.map((module, index) => (
          <Reveal key={module.id} delayIndex={index} className="block">
            <div className="grid gap-[clamp(24px,4vw,56px)] py-11 shadow-[inset_0_-1px_0_0_var(--rule)] min-[901px]:grid-cols-[minmax(0,0.34fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <p className="display mb-[14px] text-[clamp(48px,5.6vw,84px)] font-light leading-[0.86] tracking-[-0.05em] text-[color:var(--signal)]">
                  {String(module.order).padStart(2, '0')}
                </p>
                <h3 className="display-sm text-[clamp(24px,2.6vw,34px)] leading-[1.1] tracking-[-0.03em] text-[color:var(--on-ink)]">
                  {module.name}
                </h3>
              </div>

              <div className="min-w-0">
                <p className="mb-[26px] max-w-[60ch] text-[17px] leading-[1.66] text-[color:var(--on-ink-mute)]">
                  {module.summary}
                </p>

                {module.topics.length > 0 && (
                  <div className="mb-[26px] flex flex-wrap gap-2">
                    {module.topics.map((topic) => (
                      <span
                        key={topic}
                        className="mono px-[13px] py-[7px] text-[11px] normal-case tracking-[0.06em] text-[color:rgb(237_231_222_/_0.8)] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {module.builds && (
                  <>
                    <p className="mono mb-1.5 text-[10.5px] text-[color:var(--on-ink-faint)]">
                      You leave with
                    </p>
                    <p className="display-sm max-w-[44ch] text-[20px] leading-[1.35] text-[color:var(--tan)]">
                      {module.builds}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {course.projects.length > 0 && (
        <section id="projects" className={SECTION}>
          <Reveal className={SECTION_HEAD}>
            <h2 className={SECTION_H2}>{course.projects.length} things you build.</h2>
            <p className={SECTION_NOTE}>
              Yours, not walkthroughs. By the end you can open any one of them and explain it line
              by line.
            </p>
          </Reveal>

          <div className="grid gap-px bg-[color:var(--rule)] [grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))]">
            {course.projects.map((project, index) => (
              <Reveal
                key={project.name}
                delayIndex={index}
                className="bg-[color:var(--ink)] px-[30px] pb-[30px] pt-8 transition-[background] duration-300 ease-[var(--ease-state)] hover:bg-[#1C1F27] motion-reduce:transition-none"
              >
                <h3 className="display-sm mb-[10px] text-[24px] leading-[1.16] tracking-[-0.02em] text-[color:var(--on-ink)]">
                  {project.name}
                </h3>
                <p className="text-[15px] leading-[1.58] text-[color:rgb(237_231_222_/_0.68)]">
                  {project.description}
                </p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {(course.outcomes.length > 0 || course.forWhom.length > 0) && (
        <section className={SECTION}>
          <div className="grid items-start gap-[clamp(32px,5vw,88px)] min-[901px]:grid-cols-2">
            {course.outcomes.length > 0 && (
              <Reveal className="min-w-0">
                <h2 className="eyebrow mb-[26px]">What you leave with</h2>
                {course.outcomes.map((outcome) => (
                  <p
                    key={outcome}
                    className="display-sm py-5 text-[clamp(20px,1.9vw,26px)] leading-[1.3] text-[color:var(--on-ink)] shadow-[inset_0_-1px_0_0_var(--rule)]"
                  >
                    {outcome}
                  </p>
                ))}
              </Reveal>
            )}

            {course.forWhom.length > 0 && (
              <Reveal delayIndex={1} className="min-w-0">
                <h2 className="eyebrow mb-[26px]">Who it is for</h2>
                {course.forWhom.map((who) => (
                  <p
                    key={who}
                    className="py-5 text-[17px] leading-[1.6] text-[color:var(--on-ink-mute)] shadow-[inset_0_-1px_0_0_var(--rule)]"
                  >
                    {who}
                  </p>
                ))}
                <p className="mt-[26px] max-w-[44ch] text-[15px] leading-[1.6] text-[color:var(--on-ink-faint)]">
                  If you cannot hold a fixed hour live, tell us on WhatsApp and we will say so
                  plainly rather than sell you a batch you will not attend.
                </p>
              </Reveal>
            )}
          </div>
        </section>
      )}

      <section id="enrol" className="shell py-[120px]">
        <Reveal>
          <p className="eyebrow mb-10">{enrolEyebrow}</p>
        </Reveal>
        <Reveal delayIndex={1}>
          <h2 className="display mb-12 max-w-[20ch] text-[clamp(38px,6.6vw,104px)] font-normal leading-[0.94] tracking-[-0.045em]">
            {enrolHeading}
          </h2>
        </Reveal>

        {batchCards.length > 0 && (
          <div className="mb-12 grid gap-px bg-[color:var(--rule)] min-[901px]:grid-cols-2">
            {batchCards.map(({ entry, row }) => (
              <Reveal
                key={row.batch.id}
                className="bg-[color:var(--ink)] px-[30px] py-[34px]"
              >
                <p className="mono mb-[14px] flex flex-wrap gap-x-[10px] text-[10.5px] text-[color:var(--on-ink-faint)]">
                  <span>{row.batch.batch_number}</span>
                  {/* A date on its own does not say whether it is behind you. */}
                  <span className="text-[color:var(--tan)]">
                    {entry.started ? 'Teaching now' : 'Not started yet'}
                  </span>
                </p>
                <p className="display mb-3 text-[clamp(28px,3.2vw,42px)] font-normal leading-[1.04] tracking-[-0.035em]">
                  {longDate(row.batch.start_date)}
                </p>
                <p className="mb-1.5 text-[15px] leading-[1.55] text-[color:rgb(237_231_222_/_0.68)]">
                  {row.batch.days_of_week
                    ? `${row.batch.days_of_week}, ${hourRange(row.batch.start_time, row.batch.end_time)}`
                    : hourRange(row.batch.start_time, row.batch.end_time)}
                </p>
                {row.batch.seats_note && (
                  <p className="text-[15px] text-[color:var(--tan)]">{row.batch.seats_note}</p>
                )}
                {/* The card described a batch but had no way to take it, so the
                    only route out was the page-level button below, which could
                    not know which of these cards you had been reading. */}
                <CtaLink
                  cta="reserve_seat"
                  chapter="course_enrol"
                  course={course.name}
                  batch={entry.line}
                  className="btn-primary btn-compact mt-6 inline-flex"
                >
                  {`Reserve ${row.batch.batch_number}`}
                </CtaLink>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delayIndex={2}>
          <p className="mb-9 max-w-[52ch] text-[17px] leading-[1.6] text-[color:rgb(237_231_222_/_0.68)]">
            {enrolBody}
          </p>
        </Reveal>

        <Reveal delayIndex={3}>
          <div className="flex flex-wrap gap-[14px]">
            {/* Each batch above carries its own button now, so this one is the
                "none of those / help me pick" route and deliberately names no
                batch rather than sending all of them at once. */}
            <CtaLink
              cta={hasSeat ? 'reserve_seat' : 'course_waitlist'}
              chapter="course_enrol"
              course={course.name}
              batch={multiBatch ? undefined : lead?.line}
              className="btn-primary btn-lg"
            >
              {primaryCta}
            </CtaLink>
            <Link to="/batches#enquiry" className="btn-secondary btn-lg">
              Send us your details
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}
