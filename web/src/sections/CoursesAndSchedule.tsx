import CourseTriptych from '../components/CourseTriptych'
import LiveClassesPanel from '../components/LiveClassesPanel'
import WeekBoard from '../components/WeekBoard'
import { useSchedule } from '../utils/schedule'
import Section from './Section'

// Straight into the cards. No heading, label or standfirst: the cards say what
// they are, and a paragraph explaining that courses run live only repeated what
// the hero says one screen earlier.
//
// Nothing here consumes vertical scroll: the triptych is a fixed three-panel
// display, so the section is exactly as tall as its contents.
export default function CoursesAndSchedule() {
  const { rows, failed } = useSchedule()
  const scheduled = new Set(
    (rows ?? []).map((row) => row.batch.course_name.trim().toLowerCase()),
  )

  return (
    <Section id="courses" className="border-y border-[color:var(--rule)]">
      <div className="py-16 lg:py-20">
        <CourseTriptych scheduled={scheduled} />

        <div className="shell mt-16 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10">
          <WeekBoard rows={rows} failed={failed} />
          <LiveClassesPanel />
        </div>
      </div>
    </Section>
  )
}
