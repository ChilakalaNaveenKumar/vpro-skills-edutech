import { useState } from 'react'
import { useOpenCourseInPlace } from '../contexts/CourseDetailContext'
import { Link } from 'react-router-dom'
import { useCourses } from '../hooks/useCourses'
import { courseBatches, courseStateFor } from '../utils/courseState'
import { useSchedule } from '../utils/schedule'
import CtaLink from './CtaLink'

// One lightness family across all six, so the shelf reads as one object rather
// than six unrelated colours. Hue comes from each course's own `hue` field.
const openBg = (hue: number) => `oklch(0.44 0.086 ${hue})`
const closedBg = (hue: number) => `oklch(0.288 0.045 ${hue})`
const hoverBg = (hue: number) => `oklch(0.335 0.052 ${hue})`

const FACT_LABEL = 'mono mb-1 text-[9.5px] text-[color:rgb(237_231_222_/_0.7)]'
const FACT_VALUE = 'text-[15px] text-[color:var(--on-ink)]'

// The phone layout is this same shelf turned on its side - spines stack, labels
// come off their side, the open panel takes flow height instead of the frame.
//
// The panel's lower half carries a scrim down to the page ground. Without it the
// two button fills sat on a mid-lightness chroma field they were never designed
// for and neither one was readable; on the scrim they are back on ink.
const SHELF_CSS = `
.course-shelf { display: flex; align-items: stretch; gap: 6px; height: clamp(460px, 58vh, 560px); }
.course-shelf-spine { position: relative; min-width: 0; overflow: hidden; cursor: pointer; }
.course-shelf-hit { position: absolute; inset: 0; z-index: 10; border: 0; background: transparent; padding: 0; }
.course-shelf-face { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: center; padding: 28px 0; }
.course-shelf-label { writing-mode: vertical-rl; text-orientation: mixed; rotate: 180deg; white-space: nowrap; }

.course-shelf-panel { position: absolute; inset: 0; flex-direction: column; justify-content: flex-end; padding: clamp(26px, 2.6vw, 40px) clamp(24px, 2.8vw, 42px); }
.course-shelf-scrim { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(20,22,28,0) 18%, rgba(20,22,28,0.72) 52%, rgba(20,22,28,0.94) 100%); }
.course-shelf-body { position: relative; display: flex; flex-direction: column; gap: clamp(14px, 1.4vw, 20px); }
.course-shelf-state { position: absolute; left: clamp(24px, 2.8vw, 42px); top: clamp(26px, 2.6vw, 40px); }

/* Module names, ruled apart rather than punctuated. */
.course-shelf-modules { display: flex; flex-wrap: wrap; gap: 8px 0; }
.course-shelf-modules > span { padding: 0 14px; box-shadow: inset 1px 0 0 0 rgb(237 231 222 / 0.28); }
.course-shelf-modules > span:first-child { padding-left: 0; box-shadow: none; }

.course-shelf-facts { display: flex; flex-wrap: wrap; gap: 10px clamp(28px, 3vw, 46px); }

@media (max-width: 900px) {
  .course-shelf { flex-direction: column; height: auto; }
  .course-shelf-spine { flex: none !important; min-height: 88px; }
  .course-shelf-face { align-items: center; justify-content: flex-start; padding: 0 24px; }
  .course-shelf-label { writing-mode: horizontal-tb; rotate: none; }
  .course-shelf-panel { position: relative; padding: 26px 24px 28px; }
  /* Back into the flow, above the heading rather than over it. */
  .course-shelf-state { position: relative; left: auto; top: auto; margin-bottom: 16px; }
  .course-shelf-scrim { background: linear-gradient(180deg, rgba(20,22,28,0.34) 0%, rgba(20,22,28,0.9) 100%); }
}

@media (prefers-reduced-motion: reduce) {
  .course-shelf-spine, .course-shelf-face { transition: none !important; }
  .course-shelf-panel { animation: none !important; }
}
`

export default function CourseShelf() {
  // A single index, so exactly one spine is open at any time.
  const [open, setOpen] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const courses = useCourses()
  const { rows } = useSchedule()
  const openInPlace = useOpenCourseInPlace()

  return (
    <>
      <style>{SHELF_CSS}</style>
      <div className="course-shelf">
        {courses.map((course, index) => {
          const isOpen = index === open
          // Null while loading and when the fetch fails. Claiming "Gathering
          // interest" on absent data would state as fact something we do not know.
          const state = rows ? courseStateFor(course.name, rows) : null
          const batches = courseBatches(course.name, rows)
          const inSession = state === 'In session'

          const background = isOpen
            ? openBg(course.hue)
            : hovered === index
              ? hoverBg(course.hue)
              : closedBg(course.hue)

          return (
            <div
              key={course.slug}
              className="course-shelf-spine"
              style={{
                flexGrow: isOpen ? 7.2 : 1,
                flexBasis: 0,
                background,
                boxShadow: `inset 0 0 0 1px rgb(237 231 222 / ${isOpen ? 0.28 : 0.12})`,
                transition:
                  'flex-grow 780ms var(--ease-open), background 500ms var(--ease-state), box-shadow 400ms',
              }}
              // Hover lifts a closed spine but never opens it - opening on hover
              // flashed every panel as a pointer crossed the shelf.
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
              onFocusCapture={() => setOpen(index)}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`shelf-panel-${course.slug}`}
                aria-label={state ? `${course.name}, ${state}` : course.name}
                onClick={() => setOpen(index)}
                className={`course-shelf-hit ${isOpen ? 'pointer-events-none' : 'cursor-pointer'}`}
              >
                <span
                  className="course-shelf-face"
                  style={{ opacity: isOpen ? 0 : 1, transition: 'opacity 340ms var(--ease-state)' }}
                >
                  <span className="course-shelf-label display-sm text-[25px] tracking-[-0.015em] text-[color:var(--on-ink)]">
                    {course.name}
                  </span>
                </span>
              </button>

              <div
                id={`shelf-panel-${course.slug}`}
                aria-hidden={!isOpen}
                className="course-shelf-panel"
                style={{
                  display: isOpen ? 'flex' : 'none',
                  animation: isOpen ? 'fadeIn 520ms var(--ease-state) 200ms both' : 'none',
                }}
              >
                <span className="course-shelf-scrim" aria-hidden="true" />

                {state && (
                  <p className="course-shelf-state mono z-[1] whitespace-nowrap text-[10.5px] text-[color:var(--on-ink)]">
                    {state}
                  </p>
                )}

                <div className="course-shelf-body">
                  <h3 className="display max-w-[20ch] text-[clamp(28px,3.2vw,50px)] leading-[1.02] tracking-[-0.035em]">
                    {course.name}
                  </h3>
                  <p className="max-w-[46ch] text-[clamp(15px,1.15vw,17px)] leading-[1.5] text-[color:var(--on-ink)]">
                    {course.tagline}
                  </p>

                  <div className="course-shelf-modules mono text-[10.5px] normal-case tracking-[0.08em] text-[color:rgb(237_231_222_/_0.82)]">
                    {course.modules.map((module) => (
                      <span key={module.id}>{module.name}</span>
                    ))}
                  </div>

                  {/* Labelled pairs rather than a run-on line - the hour is the
                      fact a visitor opened the panel for. */}
                  {rows && (
                    <dl className="course-shelf-facts">
                      {batches.length === 0 && (
                        <div>
                          <dt className={FACT_LABEL}>Hours</dt>
                          <dd className={FACT_VALUE}>Not scheduled</dd>
                        </div>
                      )}

                      {batches.length === 1 && (
                        <>
                          <div>
                            <dt className={FACT_LABEL}>Hours</dt>
                            <dd className={`tnum ${FACT_VALUE}`}>{batches[0].hour}</dd>
                          </div>
                          <div>
                            <dt className={FACT_LABEL}>Batch</dt>
                            <dd className={FACT_VALUE}>{batches[0].note}</dd>
                          </div>
                        </>
                      )}

                      {/* Two cohorts of one course is normal - a morning batch and
                          an evening one. Each gets its own line rather than the
                          first one standing in for all of them. */}
                      {batches.length > 1 && (
                        <div>
                          <dt className={FACT_LABEL}>{`${batches.length} batches running`}</dt>
                          {batches.map((batch) => (
                            <dd key={batch.line} className={`tnum ${FACT_VALUE} mt-0.5`}>
                              {batch.line}
                            </dd>
                          ))}
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="mt-1 flex flex-wrap gap-[10px]">
                    <Link
                      to={`/courses/${course.slug}`}
                      className="btn-secondary"
                      onClick={(event) => {
                        // Modifier and middle clicks must still open a real
                        // tab, so only a plain left click is intercepted.
                        if (
                          !openInPlace ||
                          event.metaKey ||
                          event.ctrlKey ||
                          event.shiftKey ||
                          event.altKey ||
                          event.button !== 0
                        )
                          return
                        event.preventDefault()
                        openInPlace(course.slug)
                      }}
                    >
                      View curriculum
                    </Link>
                    <CtaLink
                      cta={inSession ? 'reserve_seat' : 'course_waitlist'}
                      chapter="shelf"
                      course={course.name}
                      batch={batches.map((entry) => entry.line).join('; ') || undefined}
                      className="btn-primary"
                    >
                      {inSession ? 'Reserve my seat' : 'Register interest'}
                    </CtaLink>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
