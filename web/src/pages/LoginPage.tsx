import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Seo from '../seo/Seo'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Already logged in (e.g. navigated here directly, or a stored token was
  // just rehydrated) - go straight to the right landing page instead of
  // showing the form again. Admins land on the Admin Panel, not the
  // student "My Courses" dashboard - they aren't enrolled in anything, so
  // that page was always empty and confusing for them (post-launch fix).
  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const loggedInUser = await login(email, password)
      navigate(loggedInUser.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err) {
      if (axios.isAxiosError(err) && typeof err.response?.data?.detail === 'string') {
        setError(err.response.data.detail)
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-sm mx-auto">
      <Seo
        path="/login"
        title="Student Login"
        description="Sign in to your VPro Skills EduTech account."
        noIndex
      />
      <h1 className="text-xl font-semibold">Student Login</h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
