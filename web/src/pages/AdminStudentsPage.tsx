import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createUser, listUsers, updateUser } from '../services/usersService'
import type { User } from '../types'

const EMPTY_FORM = { full_name: '', email: '', password: '' }

// Admin Students (Phase 8): list/create student accounts and toggle
// Activate/Deactivate. The create form never exposes a role picker - it
// always creates a STUDENT, since this app's admin panel doesn't build a
// screen for managing other admin accounts (see docs/ARCHITECTURE.md).
// Deactivating a student immediately revokes their access (their JWT is
// re-checked against is_active on every request - see Phase 3).
export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  function loadStudents() {
    listUsers('STUDENT')
      .then((data) => {
        setStudents(data)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadStudents, [])

  async function handleCreate() {
    setCreateError(null)
    setIsCreating(true)
    try {
      await createUser({ ...createForm, role: 'STUDENT' })
      setCreateForm(EMPTY_FORM)
      setShowCreateForm(false)
      loadStudents()
    } catch {
      setCreateError(
        'Could not create the student. The email may already be in use, or the password is too short (min 8 characters).',
      )
    } finally {
      setIsCreating(false)
    }
  }

  async function handleToggleActive(student: User) {
    await updateUser(student.id, { is_active: !student.is_active })
    loadStudents()
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Students</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
        >
          {showCreateForm ? 'Cancel' : 'New Student'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4 shadow-sm max-w-md space-y-3">
          <div>
            <label htmlFor="create-student-full-name" className="block text-sm font-medium">Full name</label>
            <input
              id="create-student-full-name"
              type="text"
              value={createForm.full_name}
              onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="create-student-email" className="block text-sm font-medium">Email</label>
            <input
              id="create-student-email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="create-student-password" className="block text-sm font-medium">Password</label>
            <input
              id="create-student-password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <button
            type="button"
            disabled={isCreating || !createForm.full_name || !createForm.email || !createForm.password}
            onClick={handleCreate}
            className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      {isLoading && <p className="mt-6 text-gray-500">Loading...</p>}
      {loadError && <p className="mt-6 text-red-600">Could not load students right now.</p>}
      {!isLoading && !loadError && students.length === 0 && (
        <p className="mt-6 text-gray-600">No students yet.</p>
      )}

      {!isLoading && !loadError && students.length > 0 && (
        <div className="mt-6 space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div>
                <h3 className="font-medium">
                  {student.full_name}{' '}
                  <span className={`ml-1 text-xs ${student.is_active ? 'text-green-700' : 'text-gray-500'}`}>
                    {student.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </h3>
                <p className="mt-1 text-sm text-gray-600">{student.email}</p>
                <Link
                  to={`/admin/students/${student.id}/enrollments`}
                  className="mt-2 inline-block text-sm font-medium text-brand-600 underline hover:text-brand-700"
                >
                  Manage Enrollments
                </Link>
              </div>
              <button
                type="button"
                onClick={() => handleToggleActive(student)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
              >
                {student.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
