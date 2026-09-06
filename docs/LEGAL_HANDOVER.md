# Legal pages: what still needs filling in

The site has three legal pages at `/privacy`, `/terms` and `/data-deletion`.
Their wording is written and reviewed. What is missing is six company facts
that nobody on the build side had.

This is the document to hand over with the branch.

## The one command

From `web/`:

```
npm run check:legal
```

It lists every value still outstanding, says what each one is, and exits
non-zero until they are all filled. When it comes back clean, you are done.

## Where to edit

One file: `web/src/content/legal.ts`. The three pages import from it and
contain no company facts of their own, so there is no need to read through the
pages hunting for blanks.

Each value is written as `[[LIKE_THIS]]`. That pattern appears nowhere else in
the codebase, so `rg "\[\[" web/src` also finds them all.

Until a value is filled in, the page renders it highlighted in copper rather
than as ordinary text. That is deliberate. A page that visibly says
`[[GSTIN]]` is an obvious, fixable mistake; a page that reads as finished while
naming the wrong legal entity is a much worse one.

## The six values

| Field | What it is | Where to find it |
| --- | --- | --- |
| `entityName` | Registered name of the business, not the trading name | Incorporation or registration certificate |
| `entityType` | Private Limited Company, LLP, Partnership Firm, or Sole Proprietorship | Same certificate |
| `registeredAddress` | Registered office address as filed | Same certificate |
| `gstin` | GST Identification Number. If not GST registered, put the literal string `none` and the line disappears from the Terms | GST registration certificate |
| `jurisdiction` | City and state whose courts hear disputes, e.g. `Hyderabad, Telangana` | Almost always the registered office city |
| `privacyEmail` | Monitored mailbox for privacy and deletion requests | See below - this one may not exist yet |

### About `privacyEmail`

This is the only item that might need creating rather than looking up. The site
currently offers WhatsApp and a phone number and no email address at all, so
there may be no mailbox on the domain.

It has to be a real, monitored address before the pages go live, because all
three of them tell people to write to it. A role address such as
`privacy@vproskills.com` is what the pages assume: India's DPDP Act requires a
published contact who can answer questions about personal data, but it does not
require a person's name, so a role address keeps anyone's name off a public page
and survives staff changes.

## Two things that are not in this repository

Neither can be enforced by any code here, and both would be easy to lose.

### 1. Quebec must stay excluded from ad targeting

The privacy policy is written on the basis that Quebec's Law 25 does not apply.

Law 25 reaches any business that monitors the behaviour of Quebec residents,
and advertising pixels do exactly that. If it applied, it would require a
publicly named privacy officer, published on the site, and a written privacy
impact assessment before sending any personal data outside the province, which
AWS hosting does by definition.

**Whoever sets up the Google Ads and Meta campaigns must exclude Quebec at the
targeting level.** The rest of Canada is fine. If anyone later switches Quebec
on to widen reach, the published privacy policy silently becomes wrong.

The same reasoning applies to the EU and the UK, which are excluded for a
related reason: both require a formally appointed representative established in
the region before you may advertise to people there.

Included markets: India, the Gulf, the United States, and Canada except Quebec.

### 2. CASL applies to WhatsApp follow-ups in Canada

Canada's anti-spam legislation covers commercial electronic messages, and
messaging apps count.

Someone who messages you first gives implied consent lasting six months, so
replying to an enquiry is fine. Sending a proactive follow-up within that window
means the message must identify the business and offer a way to opt out.

Practically: add a line to whatever WhatsApp follow-up template is used. CASL
penalties are large and this is the requirement businesses most often miss.

## Before publishing

1. Fill in the six values and confirm `npm run check:legal` exits clean.
2. Read the three pages. They are written to be accurate about this specific
   system, not from a template, but nobody has ever regretted reading their own
   terms before publishing them.
3. Have a lawyer look at the Terms if the business has one. The refund clause in
   particular rests on a factual claim - that the first three classes are free
   and payment is only requested afterwards - so if that ever stops being true,
   the clause has to change with it.
4. Confirm the privacy mailbox receives mail.

## For developers

The `/data-deletion` page promises a real erasure, and it is backed by
`DELETE /api/users/{id}` in `backend/app/users/router.py`. That performs a hard
delete and cascades to enrolments, assessment attempts and answers, with tests
in `backend/tests/test_user_erasure.py`.

Deactivation (`is_active=false`) is a different thing and does not satisfy a
deletion request: it keeps the row, the email and the password hash. If that
endpoint is ever removed or weakened, the data deletion page has to change with
it, or it becomes a promise the system cannot keep.
