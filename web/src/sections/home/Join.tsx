import Reveal from '../../motion/Reveal'
import CtaLink from '../../components/CtaLink'

export default function Join() {
  return (
    <section id="join" className="shell py-32 lg:py-40">
      <Reveal>
        <p className="eyebrow">Free demo class · no fee to attend</p>
      </Reveal>
      <Reveal delayIndex={1}>
        <h2 className="display mt-7 max-w-[18ch] text-[clamp(2.6rem,6vw,4.4rem)]">
          Attend a free demo class before you enrol.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <Reveal delayIndex={2}>
          <p className="lede max-w-[44ch]">
            You attend a real session, not a sales presentation. Ask questions, watch something
            break and get fixed, and decide afterwards. Nothing is charged before that.
          </p>
        </Reveal>
        <Reveal delayIndex={0} className="flex flex-wrap gap-4 lg:justify-end">
          <CtaLink cta="hero_demo" chapter="join" className="btn-primary">
            Book a free demo
          </CtaLink>
          <CtaLink cta="footer_whatsapp" chapter="join" className="btn-secondary">
            WhatsApp us
          </CtaLink>
        </Reveal>
      </div>
    </section>
  )
}
