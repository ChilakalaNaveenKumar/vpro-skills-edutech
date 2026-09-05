import { TENETS } from '../../content/homeSections'
import Reveal from '../../motion/Reveal'

export default function Tenets() {
  return (
    <section className="shell py-28 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
        <div>
          <Reveal>
            <p className="eyebrow">What live means here</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <h2 className="display mt-6 max-w-[16ch] text-[clamp(2.1rem,4vw,3.1rem)]">
              Three things we will not move
            </h2>
          </Reveal>
          <Reveal delayIndex={2}>
            <p className="mt-7 max-w-[38ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              Every course on the internet uses the word live. These are the three commitments
              that make it true here.
            </p>
          </Reveal>
        </div>

        <dl>
          {TENETS.map((tenet, index) => (
            <Reveal key={tenet.n} delayIndex={index} className="block">
              <div className="grid grid-cols-[auto_1fr] gap-x-7 border-t border-[color:var(--rule)] py-8">
                <span className="display text-[1.7rem] text-[color:var(--signal)]">{tenet.n}</span>
                <div>
                  <dt className="display text-[1.2rem]">{tenet.k}</dt>
                  <dd className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                    {tenet.v}
                  </dd>
                </div>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}
