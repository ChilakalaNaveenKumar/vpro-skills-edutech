import { useCallback, useEffect, useState } from 'react'
import {
  createCourse,
  deleteCourse,
  listCourses,
  updateCourse,
} from '../../services/coursesService'
import type { Course, CourseUpdate } from '../../types'

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none'
const BTN = 'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'

// Lists are edited as comma-separated text - three short phrases each, so a
// repeater UI would be more chrome than content.
const toList = (value: string): string[] =>
  value.split(',').map((part) => part.trim()).filter(Boolean)

interface FieldSpec {
  name: keyof Course
  label: string
  hint?: string
  kind?: 'text' | 'area' | 'list' | 'number'
}

const FIELDS: FieldSpec[] = [
  { name: 'slug', label: 'Slug', hint: 'URL path, e.g. agentic-ai' },
  { name: 'tagline', label: 'Tagline' },
  { name: 'summary', label: 'Summary', kind: 'area' },
  { name: 'level', label: 'Level' },
  { name: 'prerequisites', label: 'Prerequisites' },
  { name: 'for_whom', label: 'Who it is for', kind: 'list', hint: 'Comma separated' },
  { name: 'outcomes', label: 'Outcomes', kind: 'list', hint: 'Comma separated' },
  { name: 'techs', label: 'Technology marks', kind: 'list', hint: 'Icon keys, comma separated' },
  { name: 'hue', label: 'Shelf hue', kind: 'number', hint: '0-360, the spine colour' },
  { name: 'display_order', label: 'Position', kind: 'number' },
  {
    name: 'video_url',
    label: 'Explainer video',
    hint: 'YouTube or Vimeo link, or a direct .mp4 URL. Blank shows the placeholder.',
  },
]

export default function CourseEditor() {
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [newName, setNewName] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  // A token rather than an imperative reload(): the fetch lives inside the
  // effect, so every setState here provably happens after an await rather than
  // synchronously during the effect body.
  const [reloadToken, setReloadToken] = useState(0)
  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  useEffect(() => {
    let mounted = true
    listCourses()
      .then((rows) => {
        if (!mounted) return
        setCourses(rows)
        setError('')
      })
      .catch(() => {
        if (mounted) setError('Could not load courses. Are you still signed in?')
      })
    return () => {
      mounted = false
    }
  }, [reloadToken])

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    try {
      await action()
      setError('')
      reload()
    } catch (caught) {
      // Delete answers 409 with a sentence naming the batches in the way -
      // worth showing verbatim rather than a generic failure.
      const detail = (caught as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail
      setError(typeof detail === 'string' ? detail : 'That did not save.')
    } finally {
      setBusy(false)
    }
  }

  function current(course: Course, field: keyof Course): string {
    const value = course[field]
    if (Array.isArray(value)) return value.join(', ')
    return value === null || value === undefined ? '' : String(value)
  }

  function save(course: Course, field: keyof Course, raw: string) {
    const spec = FIELDS.find((entry) => entry.name === field)
    let value: unknown = raw
    if (spec?.kind === 'list') value = toList(raw)
    else if (spec?.kind === 'number') value = raw === '' ? null : Number(raw)
    else if (raw === '') value = null
    void run(() => updateCourse(course.id, { [field]: value } as CourseUpdate))
  }

  return (
    <div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!newName.trim()) return
          void run(async () => {
            await createCourse({ name: newName.trim() })
            setNewName('')
          })
        }}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-5"
      >
        <label className="flex-1">
          <span className="mb-1 block text-xs text-gray-500">New course name</span>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="e.g. Data Engineering"
            className={INPUT}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className={`${BTN} bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50`}
        >
          Add course
        </button>
      </form>

      {courses === null && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="grid gap-4">
        {courses?.map((course) => (
          <article key={course.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-medium">{course.name}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  course.status === 'ACTIVE'
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {course.status}
              </span>
              {course.flagship && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">Flagship</span>
              )}
              <span className="text-xs text-gray-500">
                {course.modules.length} modules, {course.projects.length} projects
              </span>

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === course.id ? null : course.id)}
                  className={`${BTN} border border-gray-300`}
                >
                  {openId === course.id ? 'Close' : 'Edit'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(() =>
                      updateCourse(course.id, {
                        status: course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      }),
                    )
                  }
                  className={`${BTN} border border-gray-300`}
                >
                  {course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Delete ${course.name} permanently, with its modules and projects? ` +
                          'Deactivating hides it instead and keeps everything.',
                      )
                    )
                      return
                    void run(() => deleteCourse(course.id))
                  }}
                  className={`${BTN} border border-red-300 text-red-700`}
                >
                  Delete
                </button>
              </div>
            </div>

            {openId === course.id && (
              <div className="mt-5 grid gap-3 border-t border-gray-200 pt-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs text-gray-500">Name</span>
                  <input
                    defaultValue={course.name}
                    onBlur={(event) => {
                      if (event.target.value === course.name) return
                      void run(() => updateCourse(course.id, { name: event.target.value }))
                    }}
                    className={INPUT}
                  />
                </label>

                {FIELDS.map((field) => (
                  <label
                    key={String(field.name)}
                    className={field.kind === 'area' ? 'sm:col-span-2' : ''}
                  >
                    <span className="mb-1 block text-xs text-gray-500">
                      {field.label}
                      {field.hint && <span className="ml-2 text-gray-400">{field.hint}</span>}
                    </span>
                    {field.kind === 'area' ? (
                      <textarea
                        rows={3}
                        defaultValue={current(course, field.name)}
                        onBlur={(event) => {
                          if (event.target.value === current(course, field.name)) return
                          save(course, field.name, event.target.value)
                        }}
                        className={INPUT}
                      />
                    ) : (
                      <input
                        type={field.kind === 'number' ? 'number' : 'text'}
                        defaultValue={current(course, field.name)}
                        onBlur={(event) => {
                          if (event.target.value === current(course, field.name)) return
                          save(course, field.name, event.target.value)
                        }}
                        className={INPUT}
                      />
                    )}
                  </label>
                ))}

                <label className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    defaultChecked={course.flagship}
                    onChange={(event) =>
                      void run(() => updateCourse(course.id, { flagship: event.target.checked }))
                    }
                  />
                  <span className="text-sm">Flagship — leads the shelf</span>
                </label>

                <p className="text-xs text-gray-500 sm:col-span-2">
                  Modules and projects come from the curriculum seed; editing them one by one is
                  not built yet.
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
