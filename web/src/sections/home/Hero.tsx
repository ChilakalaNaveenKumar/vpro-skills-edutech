import { PLATFORM, HERO_FACTS } from '../../content/platform'
import HeroScope from '../../motion/HeroScope'
import Reveal from '../../motion/Reveal'
import NextBatchesCard from '../../components/NextBatchesCard'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <HeroScope />
      <div className="shell relative grid items-center gap-14 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
        <div>
          <Reveal>
            <p className="eyebrow">{PLATFORM.eyebrow}</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <h1 className="display mt-7 text-[clamp(2.6rem,6vw,4.6rem)]">
              {PLATFORM.headlineLead}
              <br />
              <em>{PLATFORM.headlineEmphasis}</em>
            </h1>
          </Reveal>
          <Reveal delayIndex={2}>
            <p className="lede mt-8 max-w-[42ch]">{PLATFORM.sub}</p>
          </Reveal>
          <Reveal delayIndex={3}>
            <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-10 gap-y-8 border-t border-[color:var(--rule)] pt-8">
              {HERO_FACTS.map((fact) => (
                <div key={fact.k}>
                  <dt className="mono text-[color:var(--on-ink-faint)]">{fact.k}</dt>
                  <dd className="display mt-2 text-[1.05rem]">{fact.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delayIndex={1}>
          <NextBatchesCard />
        </Reveal>
      </div>
    </section>
  )
}
