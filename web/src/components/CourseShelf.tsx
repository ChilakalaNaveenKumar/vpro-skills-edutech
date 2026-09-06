import { useState } from 'react'
import { useOpenCourseInPlace } from '../contexts/CourseDetailContext'
import { Link } from 'react-router-dom'
import { useCourses } from '../hooks/useCourses'
import { courseBatches, courseStateFor } from '../utils/courseState'
import { useSchedule } from '../utils/schedule'
import CtaLink from './CtaLink'

// One lightness family across all six, so the shelf reads as one object rather
// than six unrelated colours. Hue comes from each course's own `hue` field.
//
// The open panel used to be a much lighter, more saturated fill (0.44 / 0.086)
// under a long gradient down to near-black. The two together read as a smear
// rather than a surface, and the copper primary button - which is itself a warm
// mid-tone - sat almost invisibly on the warmer courses. It is now one flat
// tone, dark enough that both button fills and all the text keep their contrast
// whatever the hue, with the colour doing its identifying quietly.
// The open panel carries every word on this shelf, so it is a plain neutral
// surface - the same one for all six courses - sitting a clear step above the
// page ground. Colour behind text was the whole complaint, and lowering it in
// stages only ever made it a dimmer version of the same problem: on a dark
// ground simultaneous contrast amplifies chroma, so any tint large enough to
// identify a course is also large enough to fight the text on top of it.
//
// The course's colour goes where nothing is printed over it - the closed
// spines, which hold only a name, and a bar along the open card's top edge.
const OPEN_BG = '#1e222b'
const closedBg = (hue: number) => `oklch(0.243 0.05 ${hue})`
const hoverBg = (hue: number) => `oklch(0.285 0.058 ${hue})`
const accentBar = (hue: number) => `oklch(0.63 0.125 ${hue})`

const LABEL = 'mono text-[9.5px] text-[color:rgb(237_231_222_/_0.72)]'
const FACT_LABEL = `${LABEL} mb-1`
const FACT_VALUE = 'text-[15px] text-[color:var(--on-ink)]'

// The phone layout is this same shelf turned on its side - spines stack, labels
// come off their side, the open panel takes flow height instead of the frame.
const SHELF_CSS = `
.course-shelf { display: flex; align-items: stretch; gap: 6px; height: clamp(460px, 58vh, 560px); }
.course-shelf-spine { position: relative; min-width: 0; overflow: hidden; cursor: pointer; }
.course-shelf-hit { position: absolute; inset: 0; z-index: 10; border: 0; background: transparent; padding: 0; }
.course-shelf-face { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: center; padding: 28px 0; }
.course-shelf-label { writing-mode: vertical-rl; text-orientation: mixed; rotate: 180deg; white-space: nowrap; }

.course-shelf-panel { position: absolute; inset: 0; flex-direction: column; justify-content: flex-end; padding: clamp(26px, 2.6vw, 40px) clamp(24px, 2.8vw, 42px); }

/* The course's colour, at full strength, on the one strip of the open card with
   no text over it. */
.course-shelf-accent { position: absolute; inset: 0 0 auto 0; height: 3px; }

.course-shelf-body { position: relative; display: flex; flex-direction: column; gap: clamp(16px, 1.6vw, 22px); }
/* In the flow directly above the name. Pinned to the panel's top corner it left
   a tall empty band between itself and the first line of content, which read as
   a hole rather than as breathing room. */
.course-shelf-state { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; margin-bottom: clamp(14px, 1.4vw, 18px); padding: 7px 13px; background: rgb(20 22 28 / 0.5); box-shadow: inset 0 0 0 1px rgb(237 231 222 / 0.26); }
.course-shelf-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* Identity above, facts below - the rule is what stops the name, the hours and
   the module list reading as one undifferentiated block. */
.course-shelf-rule { height: 1px; background: rgb(237 231 222 / 0.22); }

.course-shelf-modules { display: flex; flex-wrap: wrap; gap: 6px 10px; }

.course-shelf-facts { display: flex; flex-wrap: wrap; gap: 14px clamp(28px, 3vw, 46px); }

/* Both fills are printed on a coloured card, so neither can separate on its own
   colour: measured against the warm hues the navy secondary lands at 1.01:1 and
   the copper at 1.77:1, and the cool hues are worse for the navy. A translucent
   ink underlay makes the separation come from darkening the card itself, which
   holds at every hue instead of at the one the button was picked against. */
.course-shelf-panel .btn-secondary { background: rgb(16 18 24 / 0.74); box-shadow: inset 0 0 0 1px rgb(237 231 222 / 0.34); }
.course-shelf-panel .btn-secondary:hover { background: rgb(16 18 24 / 0.88); }
.course-shelf-panel .btn-primary { box-shadow: inset 0 0 0 1px rgb(255 236 224 / 0.22); }

@media (max-width: 900px) {
  .course-shelf { flex-direction: column; height: auto; }
  .course-shelf-spine { flex: none !important; min-height: 88px; }
  .course-shelf-face { align-items: center; justify-content: flex-start; padding: 0 24px; }
  .course-shelf-label { writing-mode: horizontal-tb; rotate: none; }
  .course-shelf-panel { position: relative; padding: 26px 24px 28px; }
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
          // A seat exists as soon as a batch is on the schedule, running or not.
          // Asking a visitor to "register interest" in a course whose next batch
          // has a printed start date reads as though nothing is planned.
          const hasSeat = batches.length > 0

          const background = isOpen
            ? OPEN_BG
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
                <span
                  aria-hidden="true"
                  className="course-shelf-accent"
                  style={{ background: accentBar(course.hue) }}
                />

                {state && (
                  <p className="course-shelf-state mono z-[1] whitespace-nowrap text-[10.5px] text-[color:var(--on-ink)]">
                    <span
                      aria-hidden="true"
                      className="course-shelf-dot"
                      style={{ color: state === 'In session' ? 'var(--signal)' : undefined }}
                    />
                    {state}
                  </p>
                )}

                <div className="course-shelf-body">
                  <div className="flex flex-col gap-[10px]">
                    <h3 className="display max-w-[20ch] text-[clamp(28px,3.2vw,50px)] leading-[1.02] tracking-[-0.035em]">
                      {course.name}
                    </h3>
                    <p className="max-w-[46ch] text-[clamp(15px,1.15vw,17px)] leading-[1.5] text-[color:var(--on-ink)]">
                      {course.tagline}
                    </p>
                  </div>

                  {course.modules.length > 0 && (
                    <div className="flex flex-col gap-[9px]">
                      <span className={LABEL}>{`${course.modules.length} modules, in order`}</span>
                      {/* Chips rather than hairline-separated text: the old rule
                          was drawn per item, so a wrapped second line opened with
                          a stray divider bar hanging off nothing. */}
                      <div className="course-shelf-modules">
                        {course.modules.map((module) => (
                          <span
                            key={module.id}
                            className="mono px-[9px] py-[4px] text-[10px] normal-case tracking-[0.06em] text-[color:var(--on-ink)] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)]"
                          >
                            {module.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="course-shelf-rule" />

                  {/* Labelled pairs rather than a run-on line - the hour is the
                      fact a visitor opened the panel for. */}
                  {rows && (
                    <dl className="course-shelf-facts">
                      {batches.length === 0 && (
                        <div>
                          <dt className={FACT_LABEL}>Next batch</dt>
                          <dd className={FACT_VALUE}>Dates not announced yet</dd>
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

                      {/* Two cohorts of one course is normal - a morning batch
                          and an evening one. The card only has room to name the
                          soonest one it can send us accurate details for; the
                          rest are one click away on the course page, where each
                          gets its own button. */}
                      {batches.length > 1 && (
                        <div className="w-full">
                          <dt className={FACT_LABEL}>{`${batches.length} batches to choose from`}</dt>
                          <dd className="flex flex-wrap items-baseline gap-x-[10px] gap-y-[2px]">
                            <span className="mono text-[10px] tracking-[0.1em] text-[color:var(--tan)]">
                              {batches[0].number}
                            </span>
                            <span className="tnum text-[14.5px] text-[color:var(--on-ink)]">
                              {batches[0].daysHour}
                            </span>
                            <span className="text-[13px] text-[color:var(--on-ink-faint)]">
                              {batches[0].when}
                            </span>
                          </dd>
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
                    {/* Named when there is a choice to disambiguate. Every
                        batch number concatenated into one message told us
                        nothing about which hour the person actually wanted. */}
                    <CtaLink
                      cta={hasSeat ? 'reserve_seat' : 'course_waitlist'}
                      chapter="shelf"
                      course={course.name}
                      batch={batches[0]?.line}
                      className="btn-primary"
                    >
                      {!hasSeat
                        ? 'Tell me when it opens'
                        : batches.length > 1
                          ? `Reserve ${batches[0].number}`
                          : 'Reserve my seat'}
                    </CtaLink>
                  </div>

                  {batches.length > 1 && (
                    <Link
                      to={`/courses/${course.slug}`}
                      className="group inline-flex items-center gap-2.5 self-start text-[13px] text-[color:var(--on-ink)] transition-colors duration-[240ms] ease-[var(--ease-state)] hover:text-[color:var(--signal)]"
                      onClick={(event) => {
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
                      {`View all ${batches.length} batches and book one`}
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-[240ms] ease-[var(--ease-state)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      >
                        →
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
