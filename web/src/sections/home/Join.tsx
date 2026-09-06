import Reveal from '../../motion/Reveal'
import CtaLink from '../../components/CtaLink'
import WhatsAppMark from '../../components/WhatsAppMark'

export default function Join() {
  return (
    <section id="join" className="shell py-[120px]">
      <Reveal>
        <p className="eyebrow mb-11">Free demo class · no fee to attend</p>
      </Reveal>
      <Reveal delayIndex={1}>
        <h2 className="display mb-11 max-w-[20ch] text-[clamp(38px,7.4vw,116px)] leading-[0.94] tracking-[-0.045em]">
          Attend a free demo class before you enrol.
        </h2>
      </Reveal>

      <div className="grid items-end gap-[72px] lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal delayIndex={2}>
          <p className="max-w-[38ch] font-[Newsreader,Georgia,serif] text-[clamp(19px,2vw,26px)] leading-[1.44] text-[color:var(--on-ink-mute)]">
            You attend a real session, not a sales presentation. Ask questions, watch something
            break and get fixed, and decide afterwards. Nothing is charged before that. Every
            class is live and online.
          </p>
        </Reveal>
        <Reveal delayIndex={0} className="flex flex-wrap gap-[14px]">
          <CtaLink cta="hero_demo" chapter="join" className="btn-primary btn-lg">
            Book a free demo
          </CtaLink>
          <CtaLink cta="footer_whatsapp" chapter="join" className="btn-secondary btn-lg">
            <WhatsAppMark />
            WhatsApp us
          </CtaLink>
        </Reveal>
      </div>
    </section>
  )
}
