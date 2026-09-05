import ScrollProgress from '../motion/ScrollProgress'
import Ticker from '../components/Ticker'
import Hero from '../sections/home/Hero'
import Batches from '../sections/home/Batches'
import { COURSES } from '../content/courses'

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <Ticker items={COURSES.map((course) => course.name)} />
      <Batches />
    </>
  )
}
