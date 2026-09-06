import { Link } from 'react-router-dom'
import LegalPage, { Bullets, Fact, P, Section } from '../components/LegalPage'
import { CONTACT } from '../content/contact'
import { LEGAL } from '../content/legal'

/**
 * Two things here are deliberate and should not be quietly "improved" later.
 *
 * The refund clause is written as a consequence of the free classes rather
 * than as a bare exclusion, because that is both what actually happens and
 * what makes it defensible: you decide after seeing the teaching, not before.
 *
 * The placement clause says plainly that there is no guarantee. The FAQ on the
 * home page already says "Anyone guaranteeing a job is selling you something
 * else", and a Terms page that hedged against that would contradict the
 * marketing rather than back it.
 */
export default function TermsPage() {
  const gstRegistered = LEGAL.gstin.trim().toLowerCase() !== 'none'

  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms and conditions"
      intro="The short version: attend three classes before you pay anything, decide then, and we do not guarantee anyone a job."
      path="/terms"
      metaTitle="Terms & Conditions"
      metaDescription="The terms covering VPro Skills EduTech courses: fees and when they are payable, refunds, what we do and do not promise, and who owns the course material."
    >
      <Section n={1} title="Who you are contracting with">
        <P>
          These terms govern your use of this website and any course you take with{' '}
          <Fact value={LEGAL.entityName} /> (<Fact value={LEGAL.entityType} />), trading as VPro
          Skills EduTech, of <Fact value={LEGAL.registeredAddress} />.
          {gstRegistered && (
            <>
              {' '}
              GSTIN <Fact value={LEGAL.gstin} />.
            </>
          )}
        </P>
        <P>Using the site means you accept these terms. If you do not, please do not use it.</P>
      </Section>

      <Section n={2} title="What we provide">
        <P>
          Live instructor-led classes at a scheduled hour, taught in English, which you can attend
          in person at {CONTACT.location} or online. Alongside the classes you get the course
          curriculum, project work, an assessment after each topic with your results, and a
          certificate of completion at the end.
        </P>
        <P>
          Course content evolves as the technology does. We may update the curriculum, and we may
          change a trainer, so long as we do not reduce the substance of what you signed up for.
        </P>
      </Section>

      <Section n={3} title="Fees and when you pay">
        <P>
          Fees are set per batch rather than published as one figure, because they vary by course
          and intake. You will be told the exact amount for your batch before you are asked for
          anything.
        </P>
        <P>
          <strong className="text-[color:var(--on-ink)]">
            Your first three classes are free and carry no obligation.
          </strong>{' '}
          We ask for payment after the third class, once you have seen the trainer teach, met the
          group and know whether the pace suits you. Until then you owe us nothing and may simply
          stop attending.
        </P>
        <P>
          Fees cover tuition, course material and assessments. They do not cover any third-party
          examination or certification fee, hardware, or paid cloud services a project might need.
        </P>
      </Section>

      <Section n={4} title="Refunds">
        <P>
          Fees are not refundable once paid. That is a direct consequence of how the payment is
          arranged rather than a separate penalty: you evaluate the teaching across three full
          classes at no cost, and you pay only if you decide to continue. The decision point comes
          before the money, not after it.
        </P>
        <P>
          If we cancel a batch outright and cannot offer you a place on a comparable one, we
          refund what you paid for the part not delivered. If you have to step away for a serious
          personal reason, talk to us: we will usually move you to a later batch, which is worth
          more to you than a refund would be.
        </P>
      </Section>

      <Section n={5} title="What we do not promise">
        <P>
          We do not guarantee a job, an interview, or any particular salary. We provide placement
          support, which means interview preparation, review of your project work and help
          presenting it. Whether you are hired depends on your work, the market and the employer.
          Anyone in this industry promising you a job is selling you something else.
        </P>
        <P>
          The certificate we issue is our own record that you completed the course. It is not a
          university qualification or a government-recognised credential, and we do not present it
          as one.
        </P>
      </Section>

      <Section n={6} title="What we ask of you">
        <Bullets
          items={[
            'Attend the sessions you have enrolled in, and tell us if you cannot.',
            'Do your own assessment work. Results that are not yours are worth nothing to you and unfair to everyone else.',
            'Treat trainers and other students civilly.',
            'Keep your account credentials to yourself. Sharing a login is how one paid seat becomes several.',
            'Do not record, redistribute or resell class sessions or course material.',
          ]}
        />
        <P>
          We may suspend or end access for serious or repeated breaches, and in that case fees are
          not refunded.
        </P>
      </Section>

      <Section n={7} title="Who owns the material">
        <P>
          The curriculum, slides, exercises, question banks and recordings remain ours. You get a
          personal, non-transferable licence to use them for your own learning, for as long as
          your enrolment lasts.
        </P>
        <P>
          What you build is yours. The projects you write during the course are your own work and
          you are free to publish them, put them on GitHub and show them to employers. That is the
          point of building them.
        </P>
      </Section>

      <Section n={8} title="Schedules can move">
        <P>
          Batch dates, timings and trainers are as published at the time and may change. If a
          class is cancelled we reschedule it. If a whole batch cannot run, we offer you the next
          comparable one or refund the undelivered portion.
        </P>
      </Section>

      <Section n={9} title="The website itself">
        <P>
          We work to keep the site accurate and available but do not promise it will be
          uninterrupted or error-free. Course descriptions and schedules are provided for
          information; the details confirmed to you for your specific batch are what govern.
        </P>
      </Section>

      <Section n={10} title="Liability">
        <P>
          Nothing here limits liability for death or personal injury caused by our negligence, for
          fraud, or for anything else that cannot lawfully be excluded. Beyond that, our total
          liability to you is limited to the fees you have actually paid us, and we are not liable
          for indirect losses such as lost earnings or lost opportunity.
        </P>
      </Section>

      <Section n={11} title="Your personal data">
        <P>
          Covered separately on the{' '}
          <Link to="/privacy" className="text-[color:var(--signal)] underline underline-offset-4">
            privacy page
          </Link>
          , with deletion covered on the{' '}
          <Link
            to="/data-deletion"
            className="text-[color:var(--signal)] underline underline-offset-4"
          >
            data deletion page
          </Link>
          .
        </P>
      </Section>

      <Section n={12} title="Changes to these terms">
        <P>
          We may update these terms; the date at the top shows when we last did. The version in
          force for you is the one published when you enrolled, unless a change is needed by law.
        </P>
      </Section>

      <Section n={13} title="Governing law">
        <P>
          These terms are governed by the laws of India, and the courts of{' '}
          <Fact value={LEGAL.jurisdiction} /> have exclusive jurisdiction over any dispute.
        </P>
        <P>
          Before it gets that far, talk to us. Most things are settled in a phone call. Reach us on{' '}
          {CONTACT.phoneDisplay} or at <Fact value={LEGAL.privacyEmail} />.
        </P>
      </Section>
    </LegalPage>
  )
}
