import Reveal from '../../motion/Reveal'
import CourseShelf from '../../components/CourseShelf'

export default function Batches() {
  return (
    <section id="batches" className="shell pt-[140px]">
      <Reveal className="mb-14 block">
        <h2 className="display max-w-[18ch] text-[clamp(34px,5.2vw,76px)] font-normal leading-[0.98] tracking-[-0.04em]">
          Every batch we run.
        </h2>
      </Reveal>

      <Reveal delayIndex={1} className="block">
        <CourseShelf />
      </Reveal>
    </section>
  )
}
