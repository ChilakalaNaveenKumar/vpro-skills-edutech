import { useState, type FormEvent } from 'react'
import { whatsappRawUrl } from '../content/contact'
import { composeEnquiry } from '../utils/enquiry'
import { captureLead } from '../services/leadsService'
import { trackLead } from '../analytics/tags'

const FIELD =
  'w-full min-h-[48px] bg-[color:var(--ink)] px-4 py-3.5 text-base text-[color:var(--on-ink)] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.24)]'
const LABEL = 'mono text-[color:var(--on-ink-faint)]'

// The field took a bare number with no dialling code, so a number typed by
// anyone outside India arrived unreachable and an Indian number arrived in a
// form WhatsApp cannot open directly. India leads because that is where the
// classroom is; the rest are where students message us from.
const DIAL_CODES = [
  { dial: '+91', country: 'India' },
  { dial: '+1', country: 'USA / Canada' },
  { dial: '+44', country: 'UK' },
  { dial: '+971', country: 'UAE' },
  { dial: '+61', country: 'Australia' },
  { dial: '+65', country: 'Singapore' },
  { dial: '+49', country: 'Germany' },
  { dial: '+353', country: 'Ireland' },
  { dial: '+64', country: 'New Zealand' },
  { dial: '+966', country: 'Saudi Arabia' },
  { dial: '+974', country: 'Qatar' },
  { dial: '+60', country: 'Malaysia' },
]

export default function EnquiryForm({
  batchOptions,
  neutralBatchOption,
}: {
  batchOptions: string[]
  neutralBatchOption: string
}) {
  const [name, setName] = useState('')
  const [dialCode, setDialCode] = useState(DIAL_CODES[0].dial)
  const [phone, setPhone] = useState('')
  const [batch, setBatch] = useState(neutralBatchOption)
  const [background, setBackground] = useState('')
  const selectedBatch = batchOptions.includes(batch) ? batch : neutralBatchOption

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const local = phone.trim()
    const url = whatsappRawUrl(
      composeEnquiry({
        name,
        phone: local ? `${dialCode} ${local}` : '',
        batch: selectedBatch,
        background,
      }),
    )

    // This form reported nothing at all until now, while every button on the
    // site reported through CtaLink. It is the most deliberate action a visitor
    // takes here - they filled in four fields - so leaving it uncounted meant
    // the ad platforms were optimising towards the casual taps and ignoring
    // the considered ones. Neither call is awaited or allowed to throw: a
    // measurement failure must never cost the enquiry.
    const chosenBatch = selectedBatch === neutralBatchOption ? undefined : selectedBatch
    captureLead({ cta: 'batch_enquiry', chapter: 'enquiry_form', course: chosenBatch })
    trackLead({ cta: 'batch_enquiry', chapter: 'enquiry_form', course: chosenBatch })

    window.open(url, '_blank', 'noopener')
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-describedby="enquiry-note"
      className="grid gap-5 bg-[color:var(--ink-2)] p-8 shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)] lg:p-10"
    >
      <label className="grid gap-2">
        <span className={LABEL}>Your name</span>
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Full name"
          className={FIELD}
        />
      </label>

      <div className="grid gap-2">
        <span className={LABEL} id="enquiry-phone-label">
          Phone
        </span>
        <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-2 max-[420px]:grid-cols-1">
          <select
            aria-label="Country dialling code"
            value={dialCode}
            onChange={(event) => setDialCode(event.target.value)}
            className={FIELD}
          >
            {DIAL_CODES.map((entry) => (
              <option key={entry.dial} value={entry.dial}>
                {entry.dial} {entry.country}
              </option>
            ))}
          </select>
          <input
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel-national"
            aria-labelledby="enquiry-phone-label"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Mobile number"
            className={FIELD}
          />
        </div>
      </div>

      <label className="grid gap-2">
        <span className={LABEL}>Which batch</span>
        <select
          value={selectedBatch}
          onChange={(event) => setBatch(event.target.value)}
          className={FIELD}
        >
          {batchOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Where you are starting from</span>
        <textarea
          rows={3}
          value={background}
          onChange={(event) => setBackground(event.target.value)}
          placeholder="Student, working, switching from another field — and any question you have"
          className={FIELD}
        />
      </label>

      <button type="submit" className="btn-primary mt-1">
        Send my enquiry
      </button>

      <p id="enquiry-note" className="text-sm text-[color:var(--on-ink-faint)]">
        No fee is taken at this stage. Sending this opens WhatsApp with your details filled in.
      </p>
    </form>
  )
}
