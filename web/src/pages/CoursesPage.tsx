import ScrollProgress from '../motion/ScrollProgress'
import Reveal from '../motion/Reveal'
import CourseShelf from '../components/CourseShelf'
import FloatingContact from '../components/FloatingContact'
import Enquiry from '../sections/home/Enquiry'

// The comp has no separate courses index - "Courses" in its header is the shelf
// on the home page. This route stays reachable (course pages link back to it,
// and it is where a stale bookmark lands), but it is now the same shelf in the
// same language rather than a card grid in the pre-redesign style.
export default function CoursesPage() {
  return (
    <>
      <ScrollProgress />

      <section className="shell pt-[140px]">
        <Reveal>
          <p className="eyebrow mb-[22px]">Courses</p>
        </Reveal>
        <Reveal delayIndex={1}>
          <h1 className="display mb-[26px] max-w-[18ch] text-[clamp(34px,5.2vw,76px)] font-normal leading-[0.98] tracking-[-0.04em]">
            Every course, taught live.
          </h1>
        </Reveal>
        <Reveal delayIndex={2}>
          <p className="mb-14 max-w-[46ch] text-base leading-[1.6] text-[color:var(--on-ink-faint)]">
            Each one runs as a live batch with a named trainer at a fixed hour, topics in order, and
            an assessment after each. Open a course for its full curriculum.
          </p>
        </Reveal>

        <Reveal delayIndex={3} className="block">
          <CourseShelf />
        </Reveal>
      </section>

      <Enquiry />

      <div className="pb-[150px]" />

      <FloatingContact />
    </>
  )
}
