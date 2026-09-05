import { TENETS } from '../../content/homeSections'
import { useContentList } from '../../hooks/useContent'
import type { BlockItem } from '../../services/contentService'

const FALLBACK: BlockItem[] = TENETS.map((tenet, index) => ({
  id: -(index + 1),
  number: tenet.n,
  title: tenet.k,
  body: tenet.v,
}))
import Reveal from '../../motion/Reveal'

export default function Tenets() {
  const tenets = useContentList<BlockItem>('tenets', FALLBACK)

  return (
    <section className="shell pt-[140px]">
      <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-start gap-[clamp(32px,5vw,88px)] max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <div className="min-w-0">
          <Reveal>
            <p className="eyebrow mb-[26px]">What live means here</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <h2 className="display mb-6 text-[clamp(32px,4.4vw,62px)] font-normal leading-[1.02] tracking-[-0.04em] [text-wrap:wrap]">
              Three things we will not move
            </h2>
          </Reveal>
          <Reveal delayIndex={2}>
            <p className="max-w-[34ch] text-base leading-[1.6] text-[rgba(237,231,222,0.62)]">
              Every course on the internet uses the word live. These are the three commitments
              that make it true here.
            </p>
          </Reveal>
        </div>

        <dl>
          {tenets.map((tenet, index) => (
            <Reveal key={tenet.id} delayIndex={index} className="block">
              <div className="grid grid-cols-[minmax(0,44px)_minmax(0,1fr)] items-start gap-[clamp(18px,2.4vw,34px)] py-7 shadow-[inset_0_-1px_0_0_rgba(237,231,222,0.14)] transition-[background] duration-300 ease-[var(--ease-state)] hover:bg-[#1C1F27] motion-reduce:transition-none">
                <span className="display text-[30px] font-light leading-none tracking-[-0.04em] text-[#C87046] [text-wrap:wrap]">
                  {tenet.number}
                </span>
                <div className="min-w-0">
                  <dt className="display mb-[10px] text-[clamp(22px,2vw,27px)] leading-[1.14] tracking-[-0.02em] [text-wrap:wrap]">
                    {tenet.title}
                  </dt>
                  <dd className="max-w-[50ch] text-[16.5px] leading-[1.62] text-[rgba(237,231,222,0.72)]">
                    {tenet.body}
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
