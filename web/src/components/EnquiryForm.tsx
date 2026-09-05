import { useState, type FormEvent } from 'react'
import { whatsappRawUrl } from '../content/contact'
import { composeEnquiry } from '../utils/enquiry'

const FIELD =
  'w-full min-h-[48px] bg-[color:var(--ink)] px-4 py-3.5 text-base text-[color:var(--on-ink)] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.24)]'
const LABEL = 'mono text-[color:var(--on-ink-faint)]'

export default function EnquiryForm({
  batchOptions,
  neutralBatchOption,
}: {
  batchOptions: string[]
  neutralBatchOption: string
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [batch, setBatch] = useState(neutralBatchOption)
  const [background, setBackground] = useState('')
  const selectedBatch = batchOptions.includes(batch) ? batch : neutralBatchOption

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const url = whatsappRawUrl(
      composeEnquiry({ name, phone, batch: selectedBatch, background }),
    )
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

      <label className="grid gap-2">
        <span className={LABEL}>Phone</span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Mobile number"
          className={FIELD}
        />
      </label>

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
