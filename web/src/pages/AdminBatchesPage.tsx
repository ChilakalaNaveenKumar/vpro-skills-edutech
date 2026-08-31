import { useEffect, useState } from 'react'
import { createBatch, listBatches, updateBatch } from '../services/batchesService'
import { listCourses } from '../services/coursesService'
import type { Batch, Course } from '../types'

function emptyForm() {
  return {
    course_id: '',
    batch_number: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    trainer_name: '',
  }
}

// Admin Batches (Phase 8): list every batch (active + inactive, since the
// caller is an admin - listBatches() is the same public endpoint students
// use, it's just role-aware), create new ones against a course, edit the
// schedule/trainer, and toggle Activate/Deactivate - batches have no hard
// delete, same as courses.
export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm())
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(emptyForm())
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function loadData() {
    Promise.all([listBatches(), listCourses()])
      .then(([batchesData, coursesData]) => {
        setBatches(batchesData)
        setCourses(coursesData)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadData, [])

  async function handleCreate() {
    setCreateError(null)
    if (!createForm.course_id) {
      setCreateError('Choose a course.')
      return
    }
    setIsCreating(true)
    try {
      await createBatch({
        course_id: Number(createForm.course_id),
        batch_number: createForm.batch_number,
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        start_time: createForm.start_time,
        end_time: createForm.end_time,
        trainer_name: createForm.trainer_name,
      })
      setCreateForm(emptyForm())
      setShowCreateForm(false)
      loadData()
    } catch {
      setCreateError('Could not create the batch. Check the fields and try again.')
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(batch: Batch) {
    setEditingId(batch.id)
    setEditForm({
      course_id: String(batch.course_id),
      batch_number: batch.batch_number,
      start_date: batch.start_date,
      end_date: batch.end_date,
      start_time: batch.start_time,
      end_time: batch.end_time,
      trainer_name: batch.trainer_name,
    })
    setEditError(null)
  }

  async function handleSaveEdit(batchId: number) {
    setEditError(null)
    setIsSaving(true)
    try {
      await updateBatch(batchId, {
        batch_number: editForm.batch_number,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        trainer_name: editForm.trainer_name,
      })
      setEditingId(null)
      loadData()
    } catch {
      setEditError('Could not save changes. Check the fields and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus(batch: Batch) {
    await updateBatch(batch.id, { status: batch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
    loadData()
  }

  if (isLoading) {
    return <p className="text-gray-500">Loading...</p>
  }

  if (loadError) {
    return <p className="text-red-600">Could not load batches right now.</p>
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Batches</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
        >
          {showCreateForm ? 'Cancel' : 'New Batch'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4 shadow-sm max-w-md space-y-3">
          <div>
            <label htmlFor="create-batch-course" className="block text-sm font-medium">Course</label>
            <select
              id="create-batch-course"
              value={createForm.course_id}
              onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.status === 'INACTIVE' ? '(inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="create-batch-number" className="block text-sm font-medium">Batch number</label>
            <input
              id="create-batch-number"
              type="text"
              value={createForm.batch_number}
              onChange={(e) => setCreateForm({ ...createForm, batch_number: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="create-batch-start-date" className="block text-sm font-medium">Start date</label>
              <input
                id="create-batch-start-date"
                type="date"
                value={createForm.start_date}
                onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="create-batch-end-date" className="block text-sm font-medium">End date</label>
              <input
                id="create-batch-end-date"
                type="date"
                value={createForm.end_date}
                onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="create-batch-start-time" className="block text-sm font-medium">Start time</label>
              <input
                id="create-batch-start-time"
                type="time"
                value={createForm.start_time}
                onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="create-batch-end-time" className="block text-sm font-medium">End time</label>
              <input
                id="create-batch-end-time"
                type="time"
                value={createForm.end_time}
                onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="create-batch-trainer" className="block text-sm font-medium">Trainer name</label>
            <input
              id="create-batch-trainer"
              type="text"
              value={createForm.trainer_name}
              onChange={(e) => setCreateForm({ ...createForm, trainer_name: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <button
            type="button"
            disabled={isCreating}
            onClick={handleCreate}
            className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      {batches.length === 0 && <p className="mt-6 text-gray-600">No batches yet.</p>}

      {batches.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <div key={batch.id} className="rounded-xl border border-gray-200 p-4 shadow-sm">
              {editingId === batch.id ? (
                <div className="space-y-2">
                  <input
                    aria-label="Batch number"
                    type="text"
                    value={editForm.batch_number}
                    onChange={(e) => setEditForm({ ...editForm, batch_number: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    placeholder="Batch number"
                  />
                  <div className="flex gap-2">
                    <input
                      aria-label="Start date"
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <input
                      aria-label="End date"
                      type="date"
                      value={editForm.end_date}
                      onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      aria-label="Start time"
                      type="time"
                      value={editForm.start_time}
                      onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <input
                      aria-label="End time"
                      type="time"
                      value={editForm.end_time}
                      onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <input
                    aria-label="Trainer name"
                    type="text"
                    value={editForm.trainer_name}
                    onChange={(e) => setEditForm({ ...editForm, trainer_name: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    placeholder="Trainer name"
                  />
                  {editError && <p className="text-sm text-red-600">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveEdit(batch.id)}
                      className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-medium">
                    {batch.course_name}{' '}
                    <span
                      className={`ml-1 text-xs ${
                        batch.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">Batch {batch.batch_number}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {batch.start_date} to {batch.end_date}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {batch.start_time} - {batch.end_time}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">Trainer: {batch.trainer_name}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(batch)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(batch)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                    >
                      {batch.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
