import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listBatches } from '../services/batchesService'
import { assignBatch, listUserBatches, listUsers, unassignBatch } from '../services/usersService'
import type { Batch, User } from '../types'

// Admin Student Enrollments (Phase 8), reached via a student's "Manage
// Enrollments" link - the UI for the previously-missing
// admin-assign-student-to-batch endpoint (backend/app/users/router.py's
// /{user_id}/batches sub-resource). There's no single-user GET endpoint
// (out of scope for this phase), so the student's name/email for the
// heading comes from the same admin-scale listUsers('STUDENT') call the
// Students list page already uses.
export default function AdminStudentEnrollmentsPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const studentIdNum = Number(studentId)

  const [student, setStudent] = useState<User | null>(null)
  const [enrolled, setEnrolled] = useState<Batch[]>([])
  const [allBatches, setAllBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  function loadData() {
    Promise.all([listUsers('STUDENT'), listUserBatches(studentIdNum), listBatches()])
      .then(([students, enrolledBatches, batches]) => {
        const found = students.find((s) => s.id === studentIdNum)
        if (!found) {
          setLoadError(true)
          return
        }
        setStudent(found)
        setEnrolled(enrolledBatches)
        setAllBatches(batches)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadData, [studentIdNum])

  async function handleAssign() {
    setAssignError(null)
    if (!selectedBatchId) return
    setIsAssigning(true)
    try {
      await assignBatch(studentIdNum, Number(selectedBatchId))
      setSelectedBatchId('')
      loadData()
    } catch {
      setAssignError('Could not assign this batch. It may already be assigned.')
    } finally {
      setIsAssigning(false)
    }
  }

  async function handleUnassign(batchId: number) {
    await unassignBatch(studentIdNum, batchId)
    loadData()
  }

  if (isLoading) {
    return <p className="text-gray-500">Loading...</p>
  }

  if (loadError || !student) {
    return <p className="text-red-600">Could not load this student's enrollments right now.</p>
  }

  const enrolledBatchIds = new Set(enrolled.map((b) => b.id))
  const assignableBatches = allBatches.filter((b) => !enrolledBatchIds.has(b.id))

  return (
    <div>
      <Link to="/admin/students" className="text-sm text-gray-600 hover:text-ink">
        &larr; Back to Students
      </Link>

      <h2 className="mt-2 text-xl font-semibold">{student.full_name} - Enrollments</h2>
      <p className="text-sm text-gray-500">{student.email}</p>

      <div className="mt-6 rounded-xl border border-gray-200 p-4 shadow-sm max-w-md">
        <label htmlFor="assign-batch-select" className="block text-sm font-medium">Assign to a batch</label>
        <div className="mt-1 flex gap-2">
          <select
            id="assign-batch-select"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select a batch</option>
            {assignableBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.course_name} - Batch {b.batch_number}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isAssigning || !selectedBatchId}
            onClick={handleAssign}
            className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Assign
          </button>
        </div>
        {assignError && <p className="mt-2 text-sm text-red-600">{assignError}</p>}
      </div>

      <h3 className="mt-6 font-medium">Current enrollments</h3>
      {enrolled.length === 0 && <p className="mt-2 text-gray-600">Not enrolled in any batches yet.</p>}

      {enrolled.length > 0 && (
        <div className="mt-2 space-y-3">
          {enrolled.map((batch) => (
            <div
              key={batch.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 p-4 shadow-sm max-w-md"
            >
              <div>
                <h4 className="font-medium">{batch.course_name}</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Batch {batch.batch_number} - {batch.start_date} to {batch.end_date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleUnassign(batch.id)}
                className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700"
              >
                Unassign
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
