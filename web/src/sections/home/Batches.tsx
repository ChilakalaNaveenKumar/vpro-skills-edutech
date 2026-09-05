import Reveal from '../../motion/Reveal'
import CourseShelf from '../../components/CourseShelf'
import { COURSES } from '../../content/courses'
import { courseStateFor } from '../../utils/courseState'
import { useSchedule } from '../../utils/schedule'

export default function Batches() {
  const { rows } = useSchedule()
  const runningCourse = rows
    ? COURSES.find((course) => courseStateFor(course.name, rows) === 'In session')
    : null

  return (
    <section id="batches" className="shell pt-[140px]">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-12">
        <Reveal>
          <h2 className="display max-w-[18ch] text-[clamp(34px,5.2vw,76px)] font-normal leading-[0.98] tracking-[-0.04em]">
            Every batch we run.
          </h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <p className="max-w-[34ch] text-base leading-[1.6] text-[color:var(--on-ink-mute)]">
            {runningCourse
              ? `${runningCourse.name} is the batch running now. The rest open when there are enough people to move together — register and you hear the moment an hour is fixed.`
              : 'A course opens as a live batch when there are enough people to move together — register and you hear the moment an hour is fixed.'}
          </p>
        </Reveal>
      </div>

      <Reveal delayIndex={2} className="block">
        <p className="mono mb-5 text-[10.5px] text-[color:var(--on-ink-faint)]">
          Click a spine to open it
        </p>
        <CourseShelf />
      </Reveal>
    </section>
  )
}
