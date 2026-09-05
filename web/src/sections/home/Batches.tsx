import Reveal from '../../motion/Reveal'
import CourseShelf from '../../components/CourseShelf'

export default function Batches() {
  return (
    <section id="batches" className="shell py-28 lg:py-36">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <h2 className="display text-[clamp(2.2rem,4.4vw,3.4rem)]">Every batch we run.</h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <p className="max-w-[38ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
            Agentic AI is the batch running now. The rest open when there are enough people to
            move together — register and you hear the moment an hour is fixed.
          </p>
        </Reveal>
      </div>

      <Reveal delayIndex={2} className="mt-14 block">
        <p className="mono mb-4 text-[color:var(--on-ink-faint)]">Click a spine to open it</p>
        <CourseShelf />
      </Reveal>
    </section>
  )
}
