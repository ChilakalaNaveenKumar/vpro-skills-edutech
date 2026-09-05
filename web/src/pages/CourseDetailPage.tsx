import { useParams, Navigate, Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import { courseStateFor, courseStateNote } from '../utils/courseState'
import { useSchedule } from '../utils/schedule'
import ScrollProgress from '../motion/ScrollProgress'
import Reveal from '../motion/Reveal'
import CtaLink from '../components/CtaLink'

const COUNT_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

function moduleHeading(count: number): string {
  const word = COUNT_WORDS[count] ?? String(count)
  return `${word} modules, in order.`
}

export default function CourseDetailPage() {
  const { slug } = useParams()
  const { rows } = useSchedule()
  const course = COURSES.find((entry) => entry.slug === slug)

  if (!course) return <Navigate to="/courses" replace />

  // A missing schedule is unknown, not evidence that the course is gathering interest.
  const state = rows ? courseStateFor(course.name, rows) : null
  const note = courseStateNote(course.name, rows)
  const inSession = state === 'In session'

  // The batch data carries the real trainer. A hardcoded name here would keep
  // claiming a trainer after the person teaching a course changed.
  const trainer = rows?.find((row) => row.batch.course_name === course.name)?.batch.trainer_name

  const facts = [
    { k: 'Level', v: course.level },
    { k: 'Prerequisites', v: course.prerequisites },
    ...(state
      ? [{ k: 'Format', v: inSession ? 'Live, at a fixed hour' : 'Live, hour fixed when the batch opens' }]
      : []),
    ...(trainer ? [{ k: 'Trainer', v: trainer }] : []),
  ].filter((fact) => fact.v.trim().length > 0)

  return (
    <>
      <ScrollProgress />

      <section className="shell py-24 lg:py-32">
        {state && (
          <Reveal>
            <p className="eyebrow">{state}</p>
          </Reveal>
        )}
        <Reveal delayIndex={1}>
          <h1 className="display mt-6 text-[clamp(2.6rem,6vw,4.4rem)]">{course.name}</h1>
        </Reveal>
        <Reveal delayIndex={2}>
          <p className="lede mt-6 max-w-[52ch]">{course.summary}</p>
        </Reveal>
        {note && (
          <Reveal delayIndex={0}>
            <p className="mono mt-6 text-[color:var(--on-ink-faint)]">{note}</p>
          </Reveal>
        )}

        <Reveal delayIndex={1}>
          <dl className="mt-12 grid gap-x-10 gap-y-8 border-t border-[color:var(--rule)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.k}>
                <dt className="mono text-[color:var(--on-ink-faint)]">{fact.k}</dt>
                <dd className="mt-2 text-[0.98rem] text-[color:var(--on-ink)]">{fact.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delayIndex={2}>
          <div className="mt-10 flex flex-wrap gap-4">
            <CtaLink
              cta={inSession ? 'reserve_seat' : 'course_waitlist'}
              chapter="course_hero"
              course={course.name}
              className="btn-primary"
            >
              {inSession ? 'Reserve my seat' : 'Register interest'}
            </CtaLink>
            <Link to="/batches" className="btn-secondary">
              See the schedule
            </Link>
          </div>
        </Reveal>
      </section>

      <section id="curriculum" className="shell py-24 lg:py-28">
        <Reveal>
          <p className="eyebrow">Curriculum</p>
          <h2 className="display mt-6 text-[clamp(2.1rem,4vw,3.1rem)]">
            {moduleHeading(course.modules.length)}
          </h2>
        </Reveal>

        <div className="mt-14">
          {course.modules.map((module, index) => (
            <Reveal key={module.order} delayIndex={index} className="block">
              <article className="grid gap-6 border-t border-[color:var(--rule)] py-9 lg:grid-cols-[auto_1fr_1fr] lg:gap-12">
                <span className="display text-[1.7rem] text-[color:var(--signal)]">
                  {String(module.order).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="display text-[1.25rem]">{module.name}</h3>
                  <p className="mt-3 max-w-[46ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                    {module.summary}
                  </p>
                </div>
                <div>
                  {/* `builds` is optional on CourseModule - a few modules have
                      no single artefact, and an empty "You build" reads worse
                      than no heading at all. */}
                  {module.builds && (
                    <>
                      <p className="mono text-[color:var(--on-ink-faint)]">You build</p>
                      <p className="mt-2 text-[0.95rem] text-[color:var(--on-ink)]">
                        {module.builds}
                      </p>
                    </>
                  )}
                  <p className={`mono text-[color:var(--on-ink-faint)] ${module.builds ? 'mt-5' : ''}`}>
                    {module.topics.join(' · ')}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {course.projects.length > 0 && (
        <section id="projects" className="shell py-24 lg:py-28">
          <Reveal>
            <p className="eyebrow">What you leave with</p>
            <h2 className="display mt-6 text-[clamp(2.1rem,4vw,3.1rem)]">
              Things that exist afterwards.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-px bg-[color:var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
            {course.projects.map((project, index) => (
              <Reveal key={project.name} delayIndex={index} className="bg-[color:var(--ink)] p-8">
                <h3 className="display text-[1.15rem]">{project.name}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                  {project.description}
                </p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section id="enrol" className="shell py-32">
        {state && (
          <Reveal>
            <h2 className="display max-w-[18ch] text-[clamp(2.2rem,4.6vw,3.6rem)]">
              {inSession ? 'This batch is running now.' : 'Tell us you want this one.'}
            </h2>
          </Reveal>
        )}
        <Reveal delayIndex={1}>
          <div className="mt-10 flex flex-wrap gap-4">
            <CtaLink
              cta={inSession ? 'reserve_seat' : 'course_waitlist'}
              chapter="course_enrol"
              course={course.name}
              className="btn-primary"
            >
              {inSession ? 'Reserve my seat' : 'Register interest'}
            </CtaLink>
            <CtaLink
              cta="hero_demo"
              chapter="course_enrol"
              course={course.name}
              className="btn-secondary"
            >
              Book a free demo
            </CtaLink>
          </div>
        </Reveal>
      </section>
    </>
  )
}
