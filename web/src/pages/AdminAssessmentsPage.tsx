import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  createAssessment,
  deleteAssessment,
  listAssessments,
  updateAssessment,
} from '../services/assessmentsAdminService'
import type { AssessmentAdmin } from '../types'

const EMPTY_FORM = { name: '', description: '' }

// Admin list of reusable, standalone Assessments (2026-08-31) - the
// question banks that get *attached* to one or more Topics from
// AdminTopicsPage.tsx, instead of each topic owning its own private set
// of questions. See app/assessments/models.py's docstring for why this
// exists: an assessment created once here can be reused across as many
// topics/courses/batches as needed, and attaching it to a new topic never
// detaches it from wherever it's already attached.
export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [deleteError, setDeleteError] = useState<string | null>(null)

  function loadData() {
    listAssessments()
      .then((data) => {
        setAssessments(data)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadData, [])

  async function handleCreate() {
    setCreateError(null)
    setIsCreating(true)
    try {
      await createAssessment({
        name: createForm.name,
        description: createForm.description || null,
      })
      setCreateForm(EMPTY_FORM)
      setShowCreateForm(false)
      loadData()
    } catch {
      setCreateError('Could not create the assessment. Check the fields and try again.')
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(assessment: AssessmentAdmin) {
    setEditingId(assessment.id)
    setEditForm({ name: assessment.name, description: assessment.description ?? '' })
    setEditError(null)
  }

  async function handleSaveEdit(assessmentId: number) {
    setEditError(null)
    setIsSaving(true)
    try {
      await updateAssessment(assessmentId, {
        name: editForm.name,
        description: editForm.description || null,
      })
      setEditingId(null)
      loadData()
    } catch {
      setEditError('Could not save changes. Check the fields and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(assessment: AssessmentAdmin) {
    setDeleteError(null)
    if (!window.confirm(`Delete "${assessment.name}"? This cannot be undone.`)) return
    try {
      await deleteAssessment(assessment.id)
      loadData()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setDeleteError(
          assessment.topic_count > 0
            ? `"${assessment.name}" is still attached to ${assessment.topic_count} topic${assessment.topic_count === 1 ? '' : 's'} - detach it first.`
            : `"${assessment.name}" has existing student attempts and cannot be deleted.`,
        )
      } else {
        setDeleteError(`Could not delete "${assessment.name}".`)
      }
    }
  }

  if (isLoading) {
    return <p className="text-gray-500">Loading...</p>
  }

  if (loadError) {
    return <p className="text-red-600">Could not load assessments right now.</p>
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Assessments</h2>
          <p className="text-sm text-gray-500">
            Reusable question banks. Create one here, add its questions, then attach it to any topic
            from that topic's course page - the same assessment can be attached to more than one
            topic.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
        >
          {showCreateForm ? 'Cancel' : 'New Assessment'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4 shadow-sm max-w-md">
          <label htmlFor="create-assessment-name" className="block text-sm font-medium">Name</label>
          <input
            id="create-assessment-name"
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <label htmlFor="create-assessment-description" className="mt-3 block text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            id="create-assessment-description"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          {createError && <p className="mt-2 text-sm text-red-600">{createError}</p>}
          <button
            type="button"
            disabled={isCreating || !createForm.name}
            onClick={handleCreate}
            className="mt-3 rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      {deleteError && <p className="mt-4 text-sm text-red-600">{deleteError}</p>}

      {assessments.length === 0 && <p className="mt-6 text-gray-600">No assessments yet.</p>}

      {assessments.length > 0 && (
        <div className="mt-6 space-y-4">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-xl border border-gray-200 p-4 shadow-sm">
              {editingId === assessment.id ? (
                <div className="max-w-md">
                  <label htmlFor={`edit-assessment-name-${assessment.id}`} className="block text-sm font-medium">
                    Name
                  </label>
                  <input
                    id={`edit-assessment-name-${assessment.id}`}
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <label htmlFor={`edit-assessment-description-${assessment.id}`} className="mt-3 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id={`edit-assessment-description-${assessment.id}`}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  {editError && <p className="mt-2 text-sm text-red-600">{editError}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveEdit(assessment.id)}
                      className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded border border-gray-300 px-4 py-2 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium">{assessment.name}</h3>
                    {assessment.description && (
                      <p className="mt-0.5 text-sm text-gray-500">{assessment.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {assessment.question_count} question{assessment.question_count === 1 ? '' : 's'}
                      {' · '}
                      attached to {assessment.topic_count} topic{assessment.topic_count === 1 ? '' : 's'}
                    </p>
                    <Link
                      to={`/admin/assessments/${assessment.id}/questions`}
                      className="mt-2 inline-block text-sm font-medium text-brand-600 underline hover:text-brand-700"
                    >
                      Manage Questions
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(assessment)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(assessment)}
                      className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
