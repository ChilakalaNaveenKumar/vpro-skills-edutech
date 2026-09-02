import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCourse, listCourses, updateCourse } from '../services/coursesService'
import type { Course } from '../types'

const EMPTY_FORM = { name: '', description: '' }

// Admin Courses (Phase 8): list every course (active + inactive, since the
// caller is an admin - listCourses() is the same public endpoint students
// use, it's just role-aware), create new ones, edit name/description, and
// toggle Activate/Deactivate - courses have no hard delete (see
// docs/ARCHITECTURE.md).
export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
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

  function loadCourses() {
    listCourses()
      .then((data) => {
        setCourses(data)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadCourses, [])

  async function handleCreate() {
    setCreateError(null)
    setIsCreating(true)
    try {
      await createCourse({
        name: createForm.name,
        description: createForm.description || null,
      })
      setCreateForm(EMPTY_FORM)
      setShowCreateForm(false)
      loadCourses()
    } catch {
      setCreateError('Could not create the course. Check the fields and try again.')
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(course: Course) {
    setEditingId(course.id)
    setEditForm({ name: course.name, description: course.description ?? '' })
    setEditError(null)
  }

  async function handleSaveEdit(courseId: number) {
    setEditError(null)
    setIsSaving(true)
    try {
      await updateCourse(courseId, {
        name: editForm.name,
        description: editForm.description || null,
      })
      setEditingId(null)
      loadCourses()
    } catch {
      setEditError('Could not save changes. Check the fields and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus(course: Course) {
    await updateCourse(course.id, {
      status: course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    loadCourses()
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Courses</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
        >
          {showCreateForm ? 'Cancel' : 'New Course'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4 shadow-sm max-w-md">
          <label htmlFor="create-course-name" className="block text-sm font-medium">Name</label>
          <input
            id="create-course-name"
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <label htmlFor="create-course-description" className="mt-3 block text-sm font-medium">Description</label>
          <textarea
            id="create-course-description"
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

      {isLoading && <p className="mt-6 text-gray-500">Loading...</p>}
      {loadError && <p className="mt-6 text-red-600">Could not load courses right now.</p>}
      {!isLoading && !loadError && courses.length === 0 && (
        <p className="mt-6 text-gray-600">No courses yet.</p>
      )}

      {!isLoading && !loadError && courses.length > 0 && (
        <div className="mt-6 space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-gray-200 p-4 shadow-sm">
              {editingId === course.id ? (
                <div className="max-w-md">
                  <label htmlFor={`edit-course-name-${course.id}`} className="block text-sm font-medium">Name</label>
                  <input
                    id={`edit-course-name-${course.id}`}
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <label htmlFor={`edit-course-description-${course.id}`} className="mt-3 block text-sm font-medium">Description</label>
                  <textarea
                    id={`edit-course-description-${course.id}`}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  {editError && <p className="mt-2 text-sm text-red-600">{editError}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveEdit(course.id)}
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
                      {course.name}{' '}
                      <span
                        className={`ml-1 text-xs ${
                          course.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {course.status}
                      </span>
                    </h3>
                    {course.description && (
                      <p className="mt-1 text-sm text-gray-600">{course.description}</p>
                    )}
                    <Link
                      to={`/admin/courses/${course.id}/topics`}
                      className="mt-2 inline-block text-sm font-medium text-brand-600 underline hover:text-brand-700"
                    >
                      Manage Topics
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(course)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(course)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                    >
                      {course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
