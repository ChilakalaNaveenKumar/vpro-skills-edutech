import { Link } from 'react-router-dom'
import LegalPage, { Bullets, Fact, P, Section } from '../components/LegalPage'
import { CONTACT } from '../content/contact'
import { LEGAL } from '../content/legal'
import { whatsappRawUrl } from '../content/contact'

/**
 * Meta requires a reachable data-deletion URL before it will approve an ad
 * account, which is why this page exists as its own route rather than as a
 * section of the privacy policy.
 *
 * Everything it promises is backed by DELETE /api/users/{id}, which performs a
 * genuine hard delete and cascades to enrolments, attempts and answers. Before
 * that endpoint existed the only "deletion" was is_active=false, which keeps
 * the row, the email and the password hash - so this page would have been a
 * promise the system could not keep. If that endpoint is ever removed or
 * softened, this page has to change with it.
 */
export default function DataDeletionPage() {
  const email = <Fact value={LEGAL.privacyEmail} />
  const whatsapp = whatsappRawUrl(
    'Hi VPro Skills, I would like my personal data deleted. My registered email address is:',
  )

  return (
    <LegalPage
      eyebrow="Data deletion"
      title="Deleting your data"
      intro="Ask, and we erase it properly - the record is removed, not hidden or deactivated. Here is exactly what goes, what stays, and how long it takes."
      path="/data-deletion"
      metaTitle="Data Deletion"
      metaDescription="How to have your personal data deleted by VPro Skills EduTech, what is removed, what has to be retained, and how long it takes."
    >
      <Section n={1} title="How to ask">
        <P>
          Email {email} from the address your account uses, with the subject line "Delete my
          data". If you never had an account and only ever messaged us, use the same address, or
          message us on WhatsApp from the number you contacted us on.
        </P>
        <div className="mt-6">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-compact inline-flex"
          >
            Request deletion on WhatsApp
          </a>
        </div>
        <P>
          We ask you to write from the address or number we already hold so we can be confident
          the request is yours. If you cannot, we will ask you something else only you would know
          rather than refuse outright.
        </P>
      </Section>

      <Section n={2} title="What happens, and when">
        <P>
          We confirm we have received your request within seventy-two hours, and complete the
          deletion within thirty days. In practice it is usually the same week. When it is done we
          write back to confirm what was removed.
        </P>
      </Section>

      <Section n={3} title="What gets deleted">
        <P>If you have a student account, all of the following are permanently removed:</P>
        <Bullets
          items={[
            'Your account: name, email address and password hash.',
            'Your enrolment records, including which batches you were in.',
            'Every assessment attempt, with its scores and timings.',
            'Every individual answer you gave, question by question.',
          ]}
        />
        <P>
          This is a real deletion at the database level, not an account marked inactive. Once it
          runs, the rows are gone and we cannot restore them, including for you.
        </P>
        <P>
          If you only ever enquired, there is far less to remove: we delete the WhatsApp
          conversation on our side. As explained on the{' '}
          <Link to="/privacy" className="text-[color:var(--signal)] underline underline-offset-4">
            privacy page
          </Link>
          , the enquiry form never sent your name or number to our servers in the first place, so
          there is no database record of it to erase.
        </P>
      </Section>

      <Section n={4} title="What does not get deleted, and why">
        <Bullets
          items={[
            <>
              <strong className="text-[color:var(--on-ink)]">Encrypted backups.</strong> Backups
              are whole-database snapshots and cannot be edited without corrupting them. They roll
              off automatically after seven days, so your data leaves them within a week. They are
              only ever restored after a serious failure, never browsed.
            </>,
            <>
              <strong className="text-[color:var(--on-ink)]">Financial records.</strong> If you
              paid us, tax law requires us to keep the invoice. We keep the invoice and nothing
              more.
            </>,
            <>
              <strong className="text-[color:var(--on-ink)]">
                Anonymous website statistics.
              </strong>{' '}
              Records that a button was clicked on a page carry no name, number or account, and
              cannot be traced back to you, so there is nothing personal in them to delete.
            </>,
            <>
              <strong className="text-[color:var(--on-ink)]">
                Your copy of the conversation.
              </strong>{' '}
              We can delete a WhatsApp chat from our side. Deleting it from your own phone is
              something only you can do.
            </>,
          ]}
        />
      </Section>

      <Section n={5} title="One thing worth thinking about first">
        <P>
          Deleting your account also deletes your assessment history, which is the record behind
          any certificate we have issued you. We cannot reissue or verify a certificate once the
          underlying results are gone. If you might need it for an employer, download or verify it
          before you ask us to delete.
        </P>
      </Section>

      <Section n={6} title="If you would rather not go that far">
        <P>
          You can ask us to deactivate your account instead. That stops the login working and
          takes you off our lists while keeping your assessment history, so your certificate
          remains verifiable. It is reversible, and it is not deletion - your record still exists.
          Say which one you want and we will do that one.
        </P>
      </Section>

      <Section n={7} title="If we get it wrong">
        <P>
          If we do not act within thirty days, or you are not satisfied with what we did, write
          again to {email} and say you are raising a grievance. If our answer still does not
          satisfy you, you can escalate to the Data Protection Board of India, or, if you are in
          Canada, to the Office of the Privacy Commissioner of Canada.
        </P>
        <P>
          You can also reach us on {CONTACT.phoneDisplay}, though please put deletion requests in
          writing so there is a record of both the request and our response.
        </P>
      </Section>
    </LegalPage>
  )
}
