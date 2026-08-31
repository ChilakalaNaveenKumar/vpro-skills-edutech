import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { getCourse } from '../services/coursesService'
import { listAssessments } from '../services/assessmentsAdminService'
import { createTopic, deleteTopic, listCourseTopics, updateTopic } from '../services/topicsService'
import type { AssessmentAdmin, Course, Topic } from '../types'

const EMPTY_FORM = { name: '', topic_order: 1 }

// Admin Topics for one course (Phase 8), reached via a course's "Manage
// Topics" link. Topics are the one domain with a real hard delete - see
// docs/ARCHITECTURE.md's Phase 8 section for the 409 case (a topic with
// already-answered questions can't be deleted).
export default function AdminTopicsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const courseIdNum = Number(courseId)

  const [course, setCourse] = useState<Course | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [assessments, setAssessments] = useState<AssessmentAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [attachError, setAttachError] = useState<string | null>(null)

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
    Promise.all([getCourse(courseIdNum), listCourseTopics(courseIdNum), listAssessments()])
      .then(([courseData, topicsData, assessmentsData]) => {
        setCourse(courseData)
        setTopics(topicsData)
        setAssessments(assessmentsData)
        setCreateForm({ name: '', topic_order: topicsData.length + 1 })
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadData, [courseIdNum])

  async function handleCreate() {
    setCreateError(null)
    setIsCreating(true)
    try {
      await createTopic({
        course_id: courseIdNum,
        name: createForm.name,
        topic_order: createForm.topic_order,
      })
      setShowCreateForm(false)
      loadData()
    } catch {
      setCreateError('Could not create the topic. Check the fields and try again.')
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(topic: Topic) {
    setEditingId(topic.id)
    setEditForm({ name: topic.name, topic_order: topic.topic_order })
    setEditError(null)
  }

  async function handleSaveEdit(topicId: number) {
    setEditError(null)
    setIsSaving(true)
    try {
      await updateTopic(topicId, { name: editForm.name, topic_order: editForm.topic_order })
      setEditingId(null)
      loadData()
    } catch {
      setEditError('Could not save changes. Check the fields and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus(topic: Topic) {
    await updateTopic(topic.id, { status: topic.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
    loadData()
  }

  // Attach (an id) or detach ("") a reusable Assessment (2026-08-31) -
  // this never touches any other topic's own attachment to the same
  // assessment, which is what makes the assessment reusable rather than
  // "moved" - see app/topics/router.py's update_topic docstring.
  async function handleAssessmentChange(topic: Topic, rawValue: string) {
    setAttachError(null)
    try {
      await updateTopic(topic.id, { assessment_id: rawValue === '' ? null : Number(rawValue) })
      loadData()
    } catch {
      setAttachError(`Could not update the assessment attached to "${topic.name}".`)
    }
  }

  async function handleDelete(topic: Topic) {
    setDeleteError(null)
    if (!window.confirm(`Delete "${topic.name}"? This cannot be undone.`)) return
    try {
      await deleteTopic(topic.id)
      loadData()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setDeleteError(
          `"${topic.name}" has recorded student assessment attempts and cannot be deleted.`,
        )
      } else {
        setDeleteError(`Could not delete "${topic.name}".`)
      }
    }
  }

  if (isLoading) {
    return <p className="text-gray-500">Loading...</p>
  }

  if (loadError || !course) {
    return <p className="text-red-600">Could not load this course's topics right now.</p>
  }

  return (
    <div>
      <Link to="/admin/courses" className="text-sm text-gray-600 hover:text-ink">
        &larr; Back to Courses
      </Link>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">{course.name} - Topics</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
        >
          {showCreateForm ? 'Cancel' : 'New Topic'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4 shadow-sm max-w-md">
          <label htmlFor="create-topic-name" className="block text-sm font-medium">Name</label>
          <input
            id="create-topic-name"
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <label htmlFor="create-topic-order" className="mt-3 block text-sm font-medium">Order</label>
          <input
            id="create-topic-order"
            type="number"
            min={1}
            value={createForm.topic_order}
            onChange={(e) => setCreateForm({ ...createForm, topic_order: Number(e.target.value) })}
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
      {attachError && <p className="mt-4 text-sm text-red-600">{attachError}</p>}

      {topics.length === 0 && <p className="mt-6 text-gray-600">No topics yet.</p>}

      {topics.length > 0 && (
        <div className="mt-6 space-y-4">
          {topics.map((topic) => (
            <div key={topic.id} className="rounded-xl border border-gray-200 p-4 shadow-sm">
              {editingId === topic.id ? (
                <div className="max-w-md">
                  <label htmlFor={`edit-topic-name-${topic.id}`} className="block text-sm font-medium">Name</label>
                  <input
                    id={`edit-topic-name-${topic.id}`}
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <label htmlFor={`edit-topic-order-${topic.id}`} className="mt-3 block text-sm font-medium">Order</label>
                  <input
                    id={`edit-topic-order-${topic.id}`}
                    type="number"
                    min={1}
                    value={editForm.topic_order}
                    onChange={(e) => setEditForm({ ...editForm, topic_order: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  {editError && <p className="mt-2 text-sm text-red-600">{editError}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveEdit(topic.id)}
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
                    <h3 className="font-medium">
                      {topic.topic_order}. {topic.name}{' '}
                      <span
                        className={`ml-1 text-xs ${
                          topic.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {topic.status}
                      </span>
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label htmlFor={`assessment-picker-${topic.id}`} className="text-sm text-gray-600">
                        Assessment:
                      </label>
                      <select
                        id={`assessment-picker-${topic.id}`}
                        value={topic.assessment_id ?? ''}
                        onChange={(e) => handleAssessmentChange(topic, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="">Not attached</option>
                        {assessments.map((assessment) => (
                          <option key={assessment.id} value={assessment.id}>
                            {assessment.name} ({assessment.question_count} question
                            {assessment.question_count === 1 ? '' : 's'})
                          </option>
                        ))}
                      </select>
                      {topic.assessment_id !== null && (
                        <Link
                          to={`/admin/assessments/${topic.assessment_id}/questions`}
                          className="text-sm font-medium text-brand-600 underline hover:text-brand-700"
                        >
                          Manage Questions
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(topic)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(topic)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                    >
                      {topic.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(topic)}
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
