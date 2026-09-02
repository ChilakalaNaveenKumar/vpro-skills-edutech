import CourseRing from '../components/CourseRing'
import LiveClassesPanel from '../components/LiveClassesPanel'
import WeekCalendar3D from '../components/WeekCalendar3D'
import { useSchedule } from '../utils/schedule'
import Section from './Section'

// Straight into the cards. There is no heading, label or standfirst: the cards
// say what they are, and a paragraph explaining that courses run live only
// repeated what the hero has already said one screen earlier.
export default function CoursesAndSchedule() {
  const { rows, failed } = useSchedule()
  const scheduled = new Set(
    (rows ?? []).map((row) => row.batch.course_name.trim().toLowerCase()),
  )

  return (
    <Section id="courses" className="border-y border-[color:var(--rule)]">
      <div className="pb-20 lg:pb-24">
        <CourseRing scheduled={scheduled} />

        <div className="shell mt-20 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
          <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-[color:var(--rule)] bg-[color:var(--ink-2)] sm:aspect-[16/9]">
            <WeekCalendar3D rows={rows} failed={failed} />
            <p className="pointer-events-none absolute left-5 top-4 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--on-ink-faint)]">
              This week
            </p>
          </div>
          <LiveClassesPanel />
        </div>
      </div>
    </Section>
  )
}
