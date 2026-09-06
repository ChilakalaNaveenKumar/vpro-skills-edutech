import { Link } from 'react-router-dom'
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

      {/* The shelf shows one course at a time, so the visitor comparing hours
          across courses has nowhere to go from here. The header link is easy to
          miss and reads as navigation rather than an answer. */}
      <Reveal delayIndex={2} className="block">
        <Link
          to="/batches"
          className="group mt-10 inline-flex items-center gap-3 text-[15px] text-[color:var(--on-ink)] transition-colors duration-[240ms] ease-[var(--ease-state)] hover:text-[color:var(--signal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          See the dates and timings of every batch
          <span
            aria-hidden="true"
            className="transition-transform duration-[240ms] ease-[var(--ease-state)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          >
            →
          </span>
        </Link>
      </Reveal>
    </section>
  )
}
