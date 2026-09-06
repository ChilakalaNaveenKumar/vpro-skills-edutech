import { Link } from 'react-router-dom'
import LegalPage, { Bullets, Fact, P, Section } from '../components/LegalPage'
import { CONTACT } from '../content/contact'
import { LEGAL } from '../content/legal'

/**
 * Written from an audit of what this codebase actually does, not from a
 * template. Three claims in particular are load-bearing and were verified
 * against the source rather than assumed:
 *
 *  - the enquiry form posts nothing to our servers (EnquiryForm.tsx opens
 *    WhatsApp via window.open);
 *  - the leads table holds no name, phone or message (leads/schemas.py);
 *  - nothing sets a cookie today (no document.cookie anywhere in web/src).
 *
 * If any of those change, this page becomes a false statement. Whoever makes
 * the change owns updating it.
 */
export default function PrivacyPage() {
  const email = <Fact value={LEGAL.privacyEmail} />

  return (
    <LegalPage
      eyebrow="Privacy"
      title="What we collect, and what we don't"
      intro="Most of this page is about how little we hold. Your enquiry goes straight to WhatsApp without touching our servers, and we set no cookies at all until you tell us otherwise."
      path="/privacy"
      metaTitle="Privacy Policy"
      metaDescription="What personal data VPro Skills EduTech collects, who receives it, how long we keep it, and how to have it deleted."
    >
      <Section n={1} title="Who we are">
        <P>
          <Fact value={LEGAL.entityName} /> (<Fact value={LEGAL.entityType} />), trading as VPro
          Skills EduTech, runs live instructor-led technology training online. Our registered
          office is <Fact value={LEGAL.registeredAddress} />.
        </P>
        <P>
          We are the data fiduciary for the information described below. For any question about
          how we handle your personal data, or to make a request about it, write to {email}. That
          address reaches a person who can answer, which is what India's Digital Personal Data
          Protection Act requires us to publish.
        </P>
      </Section>

      <Section n={2} title="What we collect depends on how you contact us">
        <P>
          There are three genuinely different paths, and it is worth separating them because
          they behave very differently.
        </P>
        <P>
          <strong className="text-[color:var(--on-ink)]">If you use the enquiry form.</strong> You
          type your name, phone number, the batch you are interested in, and optionally a note
          about your background. Submitting does not send that to us. It opens WhatsApp with the
          message pre-written, and nothing is transmitted until you press send inside WhatsApp
          itself. From that point the conversation is a WhatsApp chat, subject to WhatsApp's own
          privacy terms as well as ours. We keep the chat in order to answer you.
        </P>
        <P>
          <strong className="text-[color:var(--on-ink)]">
            If you click a WhatsApp or enquiry button.
          </strong>{' '}
          We record that a button of a particular type was clicked, on which section of which
          page, for which course, along with any campaign tags in the link that brought you here.
          No name, phone number or message is attached, and there is no account or profile for it
          to be attached to. We use it to work out which parts of the site lead to conversations.
        </P>
        <P>
          <strong className="text-[color:var(--on-ink)]">If you enrol as a student.</strong> An
          administrator creates your account. We then hold your full name, your email address, a
          cryptographic hash of your password rather than the password itself, which batches you
          are enrolled in, and your assessment history including each attempt's score and which
          option you chose for each question.
        </P>
      </Section>

      <Section n={3} title="What our servers record automatically">
        <P>
          Like any web server, ours writes an access log: the IP address the request came from,
          the browser's user-agent string, the page requested, and the page you came from. We do
          not link these to any account and nothing in the application reads them. They exist for
          diagnosing faults and spotting abuse.
        </P>
      </Section>

      <Section n={4} title="Who else receives your data">
        <P>We do not sell personal data. These are the only third parties involved:</P>
        <Bullets
          items={[
            <>
              <strong className="text-[color:var(--on-ink)]">Meta</strong>, through WhatsApp.
              Every enquiry conversation happens on their platform, so they process the message
              content and your phone number.
            </>,
            <>
              <strong className="text-[color:var(--on-ink)]">Google</strong>, which serves the
              fonts this site uses and therefore sees your IP address when the page loads. If you
              accept advertising cookies, Google also receives measurement data.
            </>,
            <>
              <strong className="text-[color:var(--on-ink)]">Amazon Web Services</strong>, which
              hosts the site and the database. Data is stored on servers outside your country.
            </>,
            <>
              <strong className="text-[color:var(--on-ink)]">DIGI SETU</strong>, our partner. Their
              systems can read our course descriptions, batch schedules, trainer names and
              published testimonials. They receive no student accounts, no assessment results and
              no enquiry details.
            </>,
          ]}
        />
      </Section>

      <Section n={5} title="Why we hold it">
        <Bullets
          items={[
            'To teach the course you enrolled in, mark your assessments and show you your results.',
            'To answer the enquiry you started.',
            'To understand which pages and adverts lead to enquiries, so we spend less on advertising that does not work.',
            'To keep the service secure and to meet our tax and accounting obligations.',
          ]}
        />
      </Section>

      <Section n={6} title="How long we keep it">
        <P>
          Student records are kept for as long as the account exists, because your assessment
          history is what your certificate rests on. Anonymous click records are kept
          indefinitely; they contain nothing that identifies you. Encrypted database backups are
          taken daily and roll off after seven days.
        </P>
        <P>
          If you ask us to delete your data we act on it rather than waiting for a retention
          period to expire. See the <Link to="/data-deletion" className="text-[color:var(--signal)] underline underline-offset-4">data deletion page</Link>.
        </P>
      </Section>

      <Section n={7} title="Your rights">
        <P>Under India's Digital Personal Data Protection Act you may:</P>
        <Bullets
          items={[
            'Ask what personal data we hold about you and get a copy of it.',
            'Ask us to correct anything inaccurate, or complete anything missing.',
            'Ask us to erase it, which we do properly rather than by hiding the record.',
            'Nominate someone to exercise these rights on your behalf if you die or become incapacitated.',
            'Raise a grievance with us, and escalate to the Data Protection Board of India if our answer does not satisfy you.',
          ]}
        />
        <P>
          Write to {email}. We will respond within thirty days. We may ask you to confirm your
          identity first, so that nobody else can make a request about your data.
        </P>
      </Section>

      <Section n={8} title="How we protect it">
        <P>
          Passwords are stored as bcrypt hashes, so nobody at VPro Skills can read yours. Login
          sessions expire after an hour. The database is encrypted at rest and is not reachable
          from the public internet. Repeated login attempts from one address are rate-limited.
          Application secrets are held in a managed secret store rather than in configuration
          files.
        </P>
        <P>
          No system is perfectly secure, and we would rather say that than imply otherwise. If a
          breach affects you, we will tell you and the Data Protection Board.
        </P>
      </Section>

      <Section n={9} title="Cookies and browser storage">
        <P>
          As things stand this site sets no cookies whatsoever. If you log in as a student, your
          session token is kept in your browser's local storage so you are not asked to sign in on
          every page; clearing your browser data removes it.
        </P>
        <P>
          Where we run advertising measurement, the notice at the bottom of the screen asks first.
          Declining is not decorative: the advertising scripts are never loaded at all, rather
          than loaded and told to behave. You can change your mind at any time by clearing this
          site's data in your browser.
        </P>
      </Section>

      <Section n={10} title="If you are in Canada">
        <P>
          The Personal Information Protection and Electronic Documents Act applies to you. In
          addition to everything above: a named individual within our business is accountable for
          personal information and is reachable at {email}; your personal information is stored
          and processed outside Canada, on Amazon Web Services infrastructure, and is therefore
          subject to the laws of the country it is held in; and if our response does not satisfy
          you, you may complain to the Office of the Privacy Commissioner of Canada.
        </P>
        <P>
          We do not direct our services or advertising at residents of Quebec, and our courses are
          taught and administered in English.
        </P>
      </Section>

      <Section n={11} title="Children">
        <P>
          Our courses are intended for adults, and we do not knowingly create accounts for anyone
          under eighteen without a parent or guardian arranging it with us directly. We do not
          direct advertising at children. If you believe a child's data has reached us, tell us at{' '}
          {email} and we will remove it.
        </P>
      </Section>

      <Section n={12} title="Changes">
        <P>
          If we change what we collect or who receives it, we update this page and move the date
          at the top. Material changes affecting current students will also be sent to them
          directly.
        </P>
      </Section>

      <Section n={13} title="Contact">
        <P>
          Email {email}. You can also reach us on WhatsApp or by phone at{' '}
          {CONTACT.phoneDisplay}, though for anything involving your personal data please write,
          so there is a record of the request and of our answer.
        </P>
      </Section>
    </LegalPage>
  )
}
