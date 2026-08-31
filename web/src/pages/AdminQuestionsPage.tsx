import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { getCourse } from '../services/coursesService'
import { getTopic } from '../services/topicsService'
import {
  bulkUploadQuestions,
  createQuestion,
  deleteQuestion,
  downloadBulkUploadTemplate,
  listQuestions,
  updateQuestion,
} from '../services/questionsService'
import type { BulkUploadResult, Course, QuestionAdmin, QuestionOptionInput, Topic } from '../types'

const LABELS = ['A', 'B', 'C', 'D'] as const

// Same "extract the backend's actual error text" pattern as
// AdminBatchesPage.tsx's getErrorMessage - a 400 here (bad file type,
// wrong columns, file-level parse failure) carries a specific, useful
// message in response.data.detail that a generic fallback would throw away.
function getUploadErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  return fallback
}

function emptyOptionForm(): { texts: string[]; correctIndex: number } {
  return { texts: ['', '', '', ''], correctIndex: 0 }
}

function toOptions(form: { texts: string[]; correctIndex: number }): QuestionOptionInput[] {
  return LABELS.map((label, index) => ({
    option_label: label,
    option_text: form.texts[index],
    is_correct: index === form.correctIndex,
  }))
}

// Admin Questions for one topic (Phase 8), reached via a topic's "Manage
// Questions" link. Every question always has exactly 4 options labeled
// A-D with exactly one marked correct - enforced backend-side
// (app/questions/schemas.py's _validate_four_options), mirrored here by
// always rendering exactly 4 text inputs plus a single-select radio group.
export default function AdminQuestionsPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const topicIdNum = Number(topicId)

  const [course, setCourse] = useState<Course | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<QuestionAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createText, setCreateText] = useState('')
  const [createOptions, setCreateOptions] = useState(emptyOptionForm())
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [editOptions, setEditOptions] = useState(emptyOptionForm())
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [isBulkUploading, setIsBulkUploading] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  function loadData() {
    getTopic(topicIdNum)
      .then((topicData) => {
        setTopic(topicData)
        return Promise.all([getCourse(topicData.course_id), listQuestions(topicIdNum)])
      })
      .then(([courseData, questionsData]) => {
        setCourse(courseData)
        setQuestions(questionsData)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadData, [topicIdNum])

  async function handleCreate() {
    setCreateError(null)
    if (createOptions.texts.some((t) => !t.trim())) {
      setCreateError('All 4 options need text.')
      return
    }
    setIsCreating(true)
    try {
      await createQuestion({
        topic_id: topicIdNum,
        question_text: createText,
        options: toOptions(createOptions),
      })
      setCreateText('')
      setCreateOptions(emptyOptionForm())
      setShowCreateForm(false)
      loadData()
    } catch {
      setCreateError('Could not create the question. Check the fields and try again.')
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(question: QuestionAdmin) {
    setEditingId(question.id)
    setEditText(question.question_text)
    setEditOptions({
      texts: question.options.map((o) => o.option_text),
      correctIndex: question.options.findIndex((o) => o.is_correct),
    })
    setEditError(null)
  }

  async function handleSaveEdit(questionId: number) {
    setEditError(null)
    if (editOptions.texts.some((t) => !t.trim())) {
      setEditError('All 4 options need text.')
      return
    }
    setIsSaving(true)
    try {
      await updateQuestion(questionId, {
        question_text: editText,
        options: toOptions(editOptions),
      })
      setEditingId(null)
      loadData()
    } catch {
      setEditError('Could not save changes. Check the fields and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(question: QuestionAdmin) {
    setDeleteError(null)
    if (!window.confirm('Delete this question? This cannot be undone.')) return
    try {
      await deleteQuestion(question.id)
      loadData()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setDeleteError('This question has existing assessment answers and cannot be deleted.')
      } else {
        setDeleteError('Could not delete this question.')
      }
    }
  }

  async function handleDownloadTemplate() {
    setBulkError(null)
    setIsDownloadingTemplate(true)
    try {
      const blob = await downloadBulkUploadTemplate()
      // Authenticated GET, so this can't be a plain <a href> - build a
      // throwaway object URL, click it programmatically, then release it.
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'question_upload_template.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      setBulkError('Could not download the template right now. Please try again.')
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  async function handleBulkUpload() {
    setBulkError(null)
    setBulkResult(null)
    if (!bulkFile) {
      setBulkError('Choose an Excel (.xlsx) file first - use "Download template" if you need one.')
      return
    }
    setIsBulkUploading(true)
    try {
      const result = await bulkUploadQuestions(topicIdNum, bulkFile)
      setBulkResult(result)
      setBulkFile(null)
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = ''
      loadData()
    } catch (err) {
      setBulkError(getUploadErrorMessage(err, 'Could not process this file. Check it against the template and try again.'))
    } finally {
      setIsBulkUploading(false)
    }
  }

  if (isLoading) {
    return <p className="text-gray-500">Loading...</p>
  }

  if (loadError || !course || !topic) {
    return <p className="text-red-600">Could not load this topic's questions right now.</p>
  }

  return (
    <div>
      <Link to={`/admin/courses/${course.id}/topics`} className="text-sm text-gray-600 hover:text-ink">
        &larr; Back to {course.name} Topics
      </Link>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">{topic.name} - Questions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowBulkUpload((v) => !v)
              setBulkError(null)
              setBulkResult(null)
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {showBulkUpload ? 'Cancel' : 'Bulk Upload (Excel)'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
          >
            {showCreateForm ? 'Cancel' : 'New Question'}
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4 shadow-sm max-w-xl">
          <p className="text-sm text-gray-600">
            Add many questions at once from an Excel file, instead of filling in the form below one
            question at a time. Each row becomes one question with its 4 options (A-D) and which one
            is correct.
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="mt-3 text-sm font-medium text-brand-600 underline hover:text-brand-700 disabled:opacity-50"
          >
            {isDownloadingTemplate ? 'Downloading...' : 'Download template (.xlsx)'}
          </button>
          <p className="mt-1 text-xs text-gray-400">
            Fill in your questions below the two example rows, keep the column headers as they are, then
            upload the file back here.
          </p>

          <div className="mt-4">
            <label htmlFor="bulk-upload-file" className="block text-sm font-medium">
              Filled-in Excel file
            </label>
            <input
              id="bulk-upload-file"
              ref={bulkFileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </div>

          {bulkError && <p className="mt-3 text-sm text-red-600">{bulkError}</p>}

          {bulkResult && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium text-green-700">
                {bulkResult.created} question{bulkResult.created === 1 ? '' : 's'} added.
              </p>
              {bulkResult.skipped > 0 && (
                <>
                  <p className="mt-1 text-amber-700">
                    {bulkResult.skipped} row{bulkResult.skipped === 1 ? '' : 's'} skipped - fix these
                    and upload just the corrected rows in a new file:
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-gray-600">
                    {bulkResult.errors.map((e) => (
                      <li key={e.row}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={isBulkUploading || !bulkFile}
            onClick={handleBulkUpload}
            className="mt-4 rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isBulkUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4 shadow-sm max-w-xl">
          <label htmlFor="create-question-text" className="block text-sm font-medium">Question text</label>
          <textarea
            id="create-question-text"
            value={createText}
            onChange={(e) => setCreateText(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-3 text-sm font-medium">Options (select the correct one)</p>
          {LABELS.map((label, index) => (
            <label key={label} className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="create-correct-option"
                checked={createOptions.correctIndex === index}
                onChange={() => setCreateOptions({ ...createOptions, correctIndex: index })}
              />
              <span className="w-4">{label}.</span>
              <input
                type="text"
                value={createOptions.texts[index]}
                onChange={(e) => {
                  const texts = [...createOptions.texts]
                  texts[index] = e.target.value
                  setCreateOptions({ ...createOptions, texts })
                }}
                className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
          ))}
          {createError && <p className="mt-2 text-sm text-red-600">{createError}</p>}
          <button
            type="button"
            disabled={isCreating || !createText}
            onClick={handleCreate}
            className="mt-3 rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      {deleteError && <p className="mt-4 text-sm text-red-600">{deleteError}</p>}

      {questions.length === 0 && <p className="mt-6 text-gray-600">No questions yet.</p>}

      {questions.length > 0 && (
        <div className="mt-6 space-y-4">
          {questions.map((question, qIndex) => (
            <div key={question.id} className="rounded-xl border border-gray-200 p-4 shadow-sm max-w-xl">
              {editingId === question.id ? (
                <div>
                  <label htmlFor={`edit-question-text-${question.id}`} className="block text-sm font-medium">Question text</label>
                  <textarea
                    id={`edit-question-text-${question.id}`}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="mt-3 text-sm font-medium">Options (select the correct one)</p>
                  {LABELS.map((label, index) => (
                    <label key={label} className="mt-2 flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`edit-correct-option-${question.id}`}
                        checked={editOptions.correctIndex === index}
                        onChange={() => setEditOptions({ ...editOptions, correctIndex: index })}
                      />
                      <span className="w-4">{label}.</span>
                      <input
                        type="text"
                        value={editOptions.texts[index]}
                        onChange={(e) => {
                          const texts = [...editOptions.texts]
                          texts[index] = e.target.value
                          setEditOptions({ ...editOptions, texts })
                        }}
                        className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                  {editError && <p className="mt-2 text-sm text-red-600">{editError}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveEdit(question.id)}
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
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-medium">
                      {qIndex + 1}. {question.question_text}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(question)}
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(question)}
                        className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {question.options.map((option) => (
                      <li
                        key={option.id}
                        className={option.is_correct ? 'font-medium text-green-700' : 'text-gray-600'}
                      >
                        {option.option_label}. {option.option_text}
                        {option.is_correct ? ' (correct)' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
