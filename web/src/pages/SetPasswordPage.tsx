import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import apiClient from '../services/apiClient'
import Seo from '../seo/Seo'

// Where a student provisioned through a partner chooses their own password.
//
// They paid on the partner's storefront and never saw a signup form, so there
// is no password to log in with. The backend issues a one-time token
// (app/partner/service.py) and mails a link here. VPro generating a password
// and emailing it was the alternative, and a password in an inbox stays there
// forever.
export default function SetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // Checked here as well as server-side so the mismatch is caught before a
    // round trip, and so the message can say which of the two is wrong.
    if (password.length < 8) {
      setError('Please use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Those two passwords do not match.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await apiClient.post('/api/set-password', { token, password })
      // To login rather than signing them in here: that page is where they
      // will return every day, so it is worth them seeing it once.
      navigate('/login?ready=1')
    } catch {
      // The server returns one generic error on purpose, so that tokens cannot
      // be probed. Nothing more specific can honestly be said here.
      setError('That link is no longer valid. Ask us and we will send a new one.')
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="p-8 max-w-sm mx-auto">
        <Seo
          path="/set-password"
          title="Set your password"
          description="Choose a password for your VPro Skills student account."
          noIndex
        />
        <h1 className="text-xl font-semibold">Something is missing from that link</h1>
        <p className="mt-3 text-sm text-gray-600">
          Open the link in your welcome email exactly as it was sent. If it has
          stopped working, ask us and we will send a new one.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-brand-600 underline">
          Go to student login
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-sm mx-auto">
      <Seo
          path="/set-password"
          title="Set your password"
          description="Choose a password for your VPro Skills student account."
          noIndex
        />
      <h1 className="text-xl font-semibold">Choose your password</h1>
      <p className="mt-2 text-sm text-gray-600">
        One last step and your student account is ready.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save and continue'}
        </button>
      </form>
    </div>
  )
}
