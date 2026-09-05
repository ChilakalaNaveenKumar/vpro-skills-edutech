import ScrollProgress from '../motion/ScrollProgress'
import MobileActionBar from '../components/MobileActionBar'
import Ticker from '../components/Ticker'
import Hero from '../sections/home/Hero'
import Batches from '../sections/home/Batches'
import Trainer from '../sections/home/Trainer'
import Tenets from '../sections/home/Tenets'
import BatchLoop from '../sections/home/BatchLoop'
import Students from '../sections/home/Students'
import Faq from '../sections/home/Faq'
import Join from '../sections/home/Join'
import { COURSES } from '../content/courses'

// Section order follows the order a student's questions actually arrive in:
// is anything running, who teaches me, how is this different from a recording,
// what does a batch feel like, has it worked for anyone, what am I still
// unsure about, how do I start.
export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <Ticker items={COURSES.map((course) => course.name)} />
      <Batches />
      <Trainer />
      <Tenets />
      <BatchLoop />
      <Students />
      <Faq />
      <Join />
      <MobileActionBar />
    </>
  )
}
