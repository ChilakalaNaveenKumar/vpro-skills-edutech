import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createBatch, listBatches, updateBatch } from '../services/batchesService'
import { listCourses } from '../services/coursesService'
import type { Batch, BatchProgressStatus, Course, Origin } from '../types'
import { ORIGIN_LABELS } from '../types'

function emptyForm() {
  return {
    course_id: '',
    batch_number: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    trainer_name: '',
    trainer_email: '',
    // VPro's own storefront is the common case and the backend default; a
    // partner batch is the deliberate choice.
    origin: 'VPRO' as Origin,
    progress_status: 'IN_PROGRESS' as BatchProgressStatus,
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PROGRESS_LABEL: Record<BatchProgressStatus, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

// Extracts a specific, human-readable message from a failed API call
// instead of a generic fallback. FastAPI's HTTPException(detail=...) puts
// a plain string in response.data.detail (our 409 "already has a batch
// with that name" and 422 date/time-order errors both do this); a
// Pydantic-level 422 (e.g. a malformed email) puts a list of
// {loc, msg, ...} objects there instead. Falls back to `fallback` for
// anything else (network error, unexpected shape).
function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d) => (typeof d?.msg === 'string' ? d.msg : String(d))).join(' ')
    }
  }
  return fallback
}

// Suggests the next available batch name for a course ("Batch 1", "Batch
// 2", ...) from the batches already loaded for it, so the New Batch form
// isn't starting from a blank field and the admin doesn't have to think
// one up (and possibly collide with an existing one) themselves. Only
// used to pre-fill the field - it stays fully editable.
function suggestBatchName(courseId: number, existingBatches: Batch[], excludeId?: number): string {
  const pattern = /^batch\s+(\d+)$/i
  let highest = 0
  for (const b of existingBatches) {
    if (b.course_id !== courseId || b.id === excludeId) continue
    const match = b.batch_number.trim().match(pattern)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return `Batch ${highest + 1}`
}

// Case-/whitespace-insensitive, scoped to one course - mirrors
// backend/app/batches/router.py's _reject_duplicate_batch_number, so the
// admin sees the error before submitting instead of only after a round
// trip to the server (which still enforces this too).
function isDuplicateBatchName(
  name: string,
  courseId: number,
  existingBatches: Batch[],
  excludeId?: number
): boolean {
  const normalized = name.trim().toLowerCase()
  return existingBatches.some(
    (b) =>
      b.course_id === courseId &&
      b.id !== excludeId &&
      b.batch_number.trim().toLowerCase() === normalized
  )
}

// Admin Batches (Phase 8; course dropdown seeded from a fixed course list
// and a "Status: In Progress/Completed" field added 2026-08-31 per the
// admin's request - see docs/ARCHITECTURE.md's "Batches" section). Lists
// every batch (active + inactive, since the caller is an admin -
// listBatches() is the same public endpoint students use, it's just
// role-aware), creates new ones against a course, edits the
// schedule/trainer/progress, and toggles Activate/Deactivate - batches
// have no hard delete, same as courses.
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
    const courseId = Number(createForm.course_id)
    const batchName = createForm.batch_number.trim()
    if (!batchName) {
      setCreateError('Enter a batch name.')
      return
    }
    if (isDuplicateBatchName(batchName, courseId, batches)) {
      setCreateError('A batch with this name already exists for this course. Try another name.')
      return
    }
    if (!createForm.start_date || !createForm.end_date) {
      setCreateError('Choose a start date and an end date.')
      return
    }
    if (createForm.end_date < createForm.start_date) {
      setCreateError('End date cannot be before the start date.')
      return
    }
    if (!createForm.start_time || !createForm.end_time) {
      setCreateError('Choose a start time and an end time.')
      return
    }
    if (createForm.end_time <= createForm.start_time) {
      setCreateError('End time must be after the start time.')
      return
    }
    if (!createForm.trainer_name.trim()) {
      setCreateError('Enter the trainer/faculty name.')
      return
    }
    if (!createForm.trainer_email.trim() || !EMAIL_PATTERN.test(createForm.trainer_email.trim())) {
      setCreateError('Enter a valid trainer/faculty email.')
      return
    }
    setIsCreating(true)
    try {
      await createBatch({
        course_id: courseId,
        batch_number: batchName,
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        start_time: createForm.start_time,
        end_time: createForm.end_time,
        trainer_name: createForm.trainer_name.trim(),
        trainer_email: createForm.trainer_email.trim(),
        origin: createForm.origin,
        progress_status: createForm.progress_status,
      })
      setCreateForm(emptyForm())
      setShowCreateForm(false)
      loadData()
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Could not create the batch. Check the fields and try again.'))
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
      trainer_email: batch.trainer_email ?? '',
      origin: batch.origin,
      progress_status: batch.progress_status,
    })
    setEditError(null)
  }

  async function handleSaveEdit(batchId: number) {
    setEditError(null)
    const courseId = Number(editForm.course_id)
    const batchName = editForm.batch_number.trim()
    if (!batchName) {
      setEditError('Enter a batch name.')
      return
    }
    if (isDuplicateBatchName(batchName, courseId, batches, batchId)) {
      setEditError('A batch with this name already exists for this course. Try another name.')
      return
    }
    if (!editForm.start_date || !editForm.end_date) {
      setEditError('Choose a start date and an end date.')
      return
    }
    if (editForm.end_date < editForm.start_date) {
      setEditError('End date cannot be before the start date.')
      return
    }
    if (!editForm.start_time || !editForm.end_time) {
      setEditError('Choose a start time and an end time.')
      return
    }
    if (editForm.end_time <= editForm.start_time) {
      setEditError('End time must be after the start time.')
      return
    }
    if (!editForm.trainer_name.trim()) {
      setEditError('Enter the trainer/faculty name.')
      return
    }
    const trimmedEmail = editForm.trainer_email.trim()
    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      setEditError('Enter a valid trainer/faculty email, or leave it blank.')
      return
    }
    setIsSaving(true)
    try {
      await updateBatch(batchId, {
        batch_number: batchName,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        trainer_name: editForm.trainer_name.trim(),
        // Blank stays unset rather than being sent as an empty string, so
        // an older batch with no email on file yet can still be re-saved
        // (e.g. just to change its status) without being forced to add
        // one right now - the field is required only at creation time.
        trainer_email: trimmedEmail || undefined,
        origin: editForm.origin,
        progress_status: editForm.progress_status,
      })
      setEditingId(null)
      loadData()
    } catch (err) {
      setEditError(getErrorMessage(err, 'Could not save changes. Check the fields and try again.'))
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
              onChange={(e) => {
                const value = e.target.value
                setCreateForm((f) => {
                  // Only auto-fill a suggested name into an empty field -
                  // never overwrite something the admin already typed.
                  if (!value || f.batch_number.trim()) {
                    return { ...f, course_id: value }
                  }
                  return { ...f, course_id: value, batch_number: suggestBatchName(Number(value), batches) }
                })
              }}
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
            <label htmlFor="create-batch-number" className="block text-sm font-medium">Batch name</label>
            <input
              id="create-batch-number"
              type="text"
              value={createForm.batch_number}
              onChange={(e) => setCreateForm({ ...createForm, batch_number: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Batch 1"
            />
            <p className="mt-1 text-xs text-gray-400">
              Must be unique for this course. We suggest one once you pick a course above - feel free to
              change it.
            </p>
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
            <label htmlFor="create-batch-origin" className="block text-sm font-medium">Storefront</label>
            <select
              id="create-batch-origin"
              value={createForm.origin}
              onChange={(e) => setCreateForm({ ...createForm, origin: e.target.value as Origin })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="VPRO">{ORIGIN_LABELS.VPRO}</option>
              <option value="DIGI_SETU">{ORIGIN_LABELS.DIGI_SETU}</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Which site sells this batch. VPro Skills batches appear on vproskills.com; DIGI SETU
              batches are served only to their storefront over the partner API. You see both here.
            </p>
          </div>
          <div>
            <label htmlFor="create-batch-status" className="block text-sm font-medium">Status</label>
            <select
              id="create-batch-status"
              value={createForm.progress_status}
              onChange={(e) =>
                setCreateForm({ ...createForm, progress_status: e.target.value as BatchProgressStatus })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
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
          <div>
            <label htmlFor="create-batch-trainer-email" className="block text-sm font-medium">
              Trainer/faculty email
            </label>
            <input
              id="create-batch-trainer-email"
              type="email"
              value={createForm.trainer_email}
              onChange={(e) => setCreateForm({ ...createForm, trainer_email: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="trainer@vproskills.com"
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
                    aria-label="Batch name"
                    type="text"
                    value={editForm.batch_number}
                    onChange={(e) => setEditForm({ ...editForm, batch_number: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    placeholder="Batch name"
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
                  <select
                    aria-label="Storefront"
                    value={editForm.origin}
                    onChange={(e) => setEditForm({ ...editForm, origin: e.target.value as Origin })}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  >
                    <option value="VPRO">{ORIGIN_LABELS.VPRO}</option>
                    <option value="DIGI_SETU">{ORIGIN_LABELS.DIGI_SETU}</option>
                  </select>
                  <select
                    aria-label="Status"
                    value={editForm.progress_status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, progress_status: e.target.value as BatchProgressStatus })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <input
                    aria-label="Trainer name"
                    type="text"
                    value={editForm.trainer_name}
                    onChange={(e) => setEditForm({ ...editForm, trainer_name: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    placeholder="Trainer name"
                  />
                  <input
                    aria-label="Trainer email"
                    type="email"
                    value={editForm.trainer_email}
                    onChange={(e) => setEditForm({ ...editForm, trainer_email: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    placeholder="Trainer/faculty email"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{batch.course_name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        batch.progress_status === 'IN_PROGRESS'
                          ? 'bg-brand-50 text-brand-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {PROGRESS_LABEL[batch.progress_status]}
                    </span>
                    {/* Only the partner's batches are labelled, the same way
                        only a deactivated one is: this list is mostly VPro's
                        own, and badging every card with that says nothing.
                        What an admin needs to spot is the exception. */}
                    {batch.origin !== 'VPRO' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {ORIGIN_LABELS[batch.origin]}
                      </span>
                    )}
                    {batch.status === 'INACTIVE' && (
                      <span className="text-xs text-gray-400">(deactivated)</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{batch.batch_number}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {batch.start_date} to {batch.end_date}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {batch.start_time} - {batch.end_time}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">Trainer: {batch.trainer_name}</p>
                  {batch.trainer_email && (
                    <p className="mt-1 text-sm text-gray-600">Email: {batch.trainer_email}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={`/admin/courses/${batch.course_id}/topics`}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-gray-50"
                    >
                      Manage Topics
                    </Link>
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
