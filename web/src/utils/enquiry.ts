import { MESSAGES } from '../content/contact'

export interface EnquiryFields {
  name: string
  phone: string
  batch: string
  background?: string
}

// The enquiry form is a WhatsApp composer, not a form submission - there is no
// leads endpoint yet. Kept as a pure function so the exact message shape is
// testable without a DOM. The opening line comes from the same MESSAGES map
// every other CTA uses, so there is one place to edit the greeting.
export function composeEnquiry(fields: EnquiryFields): string {
  const value = (input: string | undefined) => input?.trim() || '—'

  const lines = [
    MESSAGES.batch_enquiry,
    `Name: ${value(fields.name)}`,
    `Phone: ${value(fields.phone)}`,
    `Batch: ${value(fields.batch)}`,
  ]

  const background = fields.background?.trim()
  if (background) lines.push(`About me: ${background}`)

  return lines.join('\n')
}
