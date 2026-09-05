import type { CSSProperties } from 'react'
import { PLATFORM, HERO_FACTS } from '../../content/platform'
import { useSiteContent } from '../../hooks/useContent'

interface HeroContent {
  eyebrow: string
  headlineLead: string
  headlineEmphasis: string
  sub: string
  facts: { k: string; v: string }[]
}

const FALLBACK: HeroContent = {
  eyebrow: PLATFORM.eyebrow,
  headlineLead: PLATFORM.headlineLead,
  headlineEmphasis: PLATFORM.headlineEmphasis,
  sub: PLATFORM.sub,
  facts: HERO_FACTS.map((fact) => ({ k: fact.k, v: fact.v })),
}

// The comp sets the last word of the second line in copper italic ("is a
// *recording.*"). Splitting on the final space keeps that working whatever the
// line is edited to, rather than hardcoding which word is emphasised.
function splitEmphasis(line: string): [string, string] {
  const at = line.lastIndexOf(' ')
  return at === -1 ? ['', line] : [line.slice(0, at + 1), line.slice(at + 1)]
}
import HeroScope from '../../motion/HeroScope'
import NextBatchesCard from '../../components/NextBatchesCard'
import Ticker from '../../components/Ticker'
import { useCourses } from '../../hooks/useCourses'

// Custom properties are not in CSSProperties, and the alternative - a prop per
// timing - would put the comp's numbers behind an abstraction for no gain.
const at = (property: '--rise-delay' | '--fade-delay', seconds: string): CSSProperties =>
  ({ [property]: seconds }) as CSSProperties

export default function Hero() {
  const hero = useSiteContent<HeroContent>('hero', FALLBACK)
  const courses = useCourses()
  const [leadIn, emphasis] = splitEmphasis(hero.headlineEmphasis)

  return (
    <section
      id="top"
      className="relative flex min-h-[680px] flex-col overflow-hidden [height:100svh] max-[1100px]:h-auto max-[1100px]:min-h-0"
    >
      <HeroScope className="opacity-85" />

      {/* The scope has to die into the page rather than stop at an edge, so the
          hero's floor is the page ground at full opacity. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgb(20 22 28 / 0.62) 0%, rgb(20 22 28 / 0.2) 42%, #14161C 100%)',
        }}
      />

      <div className="relative mx-auto flex w-full min-h-0 max-w-[1560px] flex-1 flex-col justify-center px-[44px] pt-[92px] pb-[26px] max-[1100px]:pt-[116px] max-[1100px]:pb-11 max-[900px]:px-6 max-[900px]:pt-[104px] max-[900px]:pb-12">
        <div className="grid items-start gap-[clamp(28px,4vw,64px)] max-[900px]:gap-10 min-[901px]:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <div className="flex min-w-0 flex-col justify-start">
            <p className="eyebrow fade-in mb-6" style={at('--fade-delay', '0.15s')}>
              {hero.eyebrow}
            </p>

            <h1 className="display mb-7 max-w-[14ch] text-[clamp(40px,5.6vw,96px)] leading-[0.94] tracking-[-0.045em] max-[900px]:max-w-none max-[900px]:text-[clamp(38px,12.4vw,68px)]">
              <span className="block overflow-hidden">
                <span className="rise-in block" style={at('--rise-delay', '0.1s')}>
                  {hero.headlineLead}
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="rise-in block" style={at('--rise-delay', '0.22s')}>
                  {leadIn}
                  <em>{emphasis}</em>
                </span>
              </span>
            </h1>

            <p
              className="lede fade-in mb-[34px] max-w-[36ch] [--fade-duration:1.2s] max-[900px]:max-w-none"
              style={at('--fade-delay', '0.5s')}
            >
              {hero.sub}
            </p>

            {/* One-pixel gaps over a bone ground: the rules between the facts are
                the grid's own background showing through, not four borders. */}
            <dl
              className="fade-in grid grid-cols-2 gap-px bg-[rgb(237_231_222_/_0.16)] [--fade-duration:1.2s]"
              style={at('--fade-delay', '0.62s')}
            >
              {hero.facts.map((fact) => (
                <div key={fact.k} className="bg-[color:var(--ink)] px-[18px] pt-4 pb-[15px]">
                  <dt className="mono mb-[7px] text-[10px] text-[color:var(--on-ink-faint)]">
                    {fact.k}
                  </dt>
                  <dd className="display-sm text-[clamp(17px,1.35vw,20px)] text-[color:var(--on-ink)]">
                    {fact.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="fade-in min-w-0 [--fade-duration:1.2s]" style={at('--fade-delay', '0.7s')}>
            <NextBatchesCard />
          </div>
        </div>
      </div>

      <Ticker items={courses.map((course) => course.name)} />
    </section>
  )
}
