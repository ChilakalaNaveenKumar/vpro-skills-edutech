import { useEffect, useState } from 'react'
import { getNextDemoSession, type DemoSession } from '../services/demoSessionsService'
import { SECTIONS } from '../content/sections'
import { useActiveSection } from '../hooks/useActiveSection'
import StringTuneRuntime from '../motion/StringTuneRuntime'
import SectionRail from '../components/SectionRail'
import FloatingContact from '../components/FloatingContact'
import Hero from '../sections/Hero'
import CoursesAndSchedule from '../sections/CoursesAndSchedule'
import HowItWorks from '../sections/HowItWorks'
import Trainer from '../sections/Trainer'
import ForWhom from '../sections/ForWhom'
import Join from '../sections/Join'

const SECTION_IDS = SECTIONS.map((section) => section.id)

// VPro Skills as a platform first, the course it currently runs second.
//
// The page makes exactly one request, for the next demo session. It deliberately
// does not read the batch schedule: a home page that leads with a live feed shows
// a different, weaker thing to every visitor depending on the hour they arrive,
// and most arrivals here come from ads at unpredictable times. The schedule
// belongs where somebody is actually choosing a seat.
export default function HomePage() {
  const [demo, setDemo] = useState<DemoSession | null>(null)
  const active = useActiveSection(SECTION_IDS)

  useEffect(() => {
    let mounted = true
    getNextDemoSession().then((data) => {
      if (mounted) setDemo(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      <StringTuneRuntime />
      <SectionRail active={active} />

      <Hero />
      <CoursesAndSchedule />
      <HowItWorks />
      <Trainer />
      <ForWhom />
      <Join demo={demo} />

      <FloatingContact />
    </>
  )
}
