import { describe, expect, it } from 'vitest'
import { composeEnquiry } from './enquiry'
import { MESSAGES } from '../content/contact'

describe('composeEnquiry', () => {
  it('opens with the shared batch_enquiry line, then one field per line', () => {
    expect(
      composeEnquiry({ name: 'Asha', phone: '9876543210', batch: 'Agentic AI — Batch A-04' }),
    ).toBe(
      `${MESSAGES.batch_enquiry}\n` +
        'Name: Asha\n' +
        'Phone: 9876543210\n' +
        'Batch: Agentic AI — Batch A-04',
    )
  })

  it('appends the background line only when one was given', () => {
    const message = composeEnquiry({
      name: 'Asha',
      phone: '9876543210',
      batch: 'Agentic AI',
      background: 'Working, switching from testing',
    })
    expect(message.endsWith('\nAbout me: Working, switching from testing')).toBe(true)
  })

  it('omits the background line when it is blank or whitespace', () => {
    expect(composeEnquiry({ name: 'A', phone: '1', batch: 'B', background: '   ' })).not.toContain(
      'About me',
    )
  })

  it('trims each field so stray spaces never reach WhatsApp', () => {
    expect(composeEnquiry({ name: '  Asha  ', phone: ' 98 ', batch: ' B ' })).toContain(
      'Name: Asha\nPhone: 98\nBatch: B',
    )
  })

  it('substitutes an em dash for a field left empty', () => {
    expect(composeEnquiry({ name: '', phone: '9876543210', batch: 'B' })).toContain('Name: —')
  })
})
