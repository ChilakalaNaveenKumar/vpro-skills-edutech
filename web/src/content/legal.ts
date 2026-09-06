/**
 * Every company-specific fact the legal pages need, in one file.
 *
 * The Privacy, Terms and Data Deletion pages import from here and hardcode
 * nothing themselves, so filling these in is the whole job - there is no need
 * to read three pages of JSX looking for the next blank.
 *
 * Unfilled values are written as [[TOKEN]]. That shape appears nowhere else in
 * the codebase, so `rg "\[\[" web/src` lists everything outstanding, and
 * `npm run check:legal` does the same with the explanation for each one.
 * Anything still unfilled renders conspicuously on the page rather than
 * blending into the paragraph: a page that visibly says [[GSTIN]] is a
 * fixable embarrassment, one that reads as finished while naming the wrong
 * legal entity is not.
 *
 * See docs/LEGAL_HANDOVER.md.
 */

/** A value nobody has filled in yet. */
export const UNFILLED = /^\[\[[A-Z0-9_]+\]\]$/

export function isUnfilled(value: string): boolean {
  return UNFILLED.test(value.trim())
}

export const LEGAL = {
  /**
   * The registered name of the business, exactly as it appears on the
   * incorporation or registration certificate - not the trading name.
   * Example shape: "VPro Skills EduTech Private Limited".
   */
  entityName: '[[REGISTERED_ENTITY_NAME]]',

  /**
   * How the business is registered. One of: Private Limited Company,
   * Limited Liability Partnership, Partnership Firm, Sole Proprietorship.
   * This decides how the entity is described in the Terms.
   */
  entityType: '[[ENTITY_TYPE]]',

  /**
   * The registered office address as filed, if it differs from the teaching
   * address already in contact.ts. If they are the same, put that address
   * here too rather than leaving it blank - the Terms name a registered
   * office specifically, which is not necessarily where classes happen.
   */
  registeredAddress: '[[REGISTERED_ADDRESS]]',

  /**
   * GST Identification Number, from the GST registration certificate.
   * If the business is not GST registered, set this to the string 'none'
   * and the pages will omit the line entirely.
   */
  gstin: '[[GSTIN]]',

  /**
   * Where disputes are heard. Almost certainly the city of the registered
   * office. Example shape: "Hyderabad, Telangana".
   */
  jurisdiction: '[[JURISDICTION_CITY]]',

  /**
   * The published contact for data protection questions and deletion
   * requests. India's DPDP Act requires a reachable contact to be published;
   * it does not require a person's name, so a role address is deliberate -
   * it survives staff changes and puts no individual's name on a public page.
   *
   * This mailbox must actually exist and be monitored before the pages go
   * live. The site currently offers only WhatsApp and a phone number.
   */
  privacyEmail: '[[PRIVACY_EMAIL]]',

  /**
   * When the documents were last substantively changed. Update this whenever
   * you edit the wording, not when you edit this file's other fields.
   */
  lastUpdated: '6 September 2026',
} as const

export type LegalField = keyof typeof LEGAL

/** What each field is, for `npm run check:legal` and the handover doc. */
export const LEGAL_FIELD_NOTES: Record<LegalField, string> = {
  entityName: 'Registered name from the incorporation/registration certificate',
  entityType: 'Private Limited Company, LLP, Partnership Firm or Sole Proprietorship',
  registeredAddress: 'Registered office address as filed',
  gstin: "GSTIN from the GST certificate, or the string 'none' if not registered",
  jurisdiction: 'City and state whose courts hear disputes, e.g. Hyderabad, Telangana',
  privacyEmail: 'Monitored mailbox for privacy and deletion requests',
  lastUpdated: 'Date these documents were last reworded',
}

/**
 * The markets the documents are written for. Deliberately not the whole world.
 *
 * The EU and UK are excluded because both require an Article 27 representative
 * established in the region before you may advertise to people there, and both
 * mandate a full consent-management platform. Quebec is excluded because Law 25
 * reaches anyone who monitors the behaviour of Quebec residents - ad tracking
 * does exactly that - and would require a publicly named privacy officer plus a
 * written privacy impact assessment for sending data outside the province.
 *
 * IMPORTANT: this is an assumption about how the ad campaigns are targeted, and
 * nothing in this repository can enforce it. If anyone adds the EU, the UK or
 * Quebec to the Google Ads or Meta targeting, these documents become wrong.
 * See docs/LEGAL_HANDOVER.md.
 */
export const MARKETS = {
  included: 'India, the Gulf states, the United States, and Canada excluding Quebec',
  excluded: ['European Union', 'United Kingdom', 'Quebec'],
} as const
