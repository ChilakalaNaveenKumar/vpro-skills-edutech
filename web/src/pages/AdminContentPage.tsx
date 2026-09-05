import { useCallback, useEffect, useState } from 'react'
import type { ContentCollection } from '../services/contentService'
import CourseEditor from '../components/admin/CourseEditor'
import {
  adminListContent,
  createContent,
  deleteContent,
  getSiteBlob,
  saveSiteBlob,
  updateContent,
  type ContentRow,
} from '../services/contentAdminService'

// Each collection is the same table with different columns, so the columns are
// data rather than four near-identical components.
interface FieldSpec {
  name: string
  label: string
  multiline?: boolean
}

const COLLECTIONS: Record<ContentCollection, { label: string; fields: FieldSpec[] }> = {
  testimonials: {
    label: 'Testimonials',
    fields: [
      { name: 'quote', label: 'Quote', multiline: true },
      { name: 'name', label: 'Name' },
      { name: 'role', label: 'Role' },
    ],
  },
  faqs: {
    label: 'FAQs',
    fields: [
      { name: 'question', label: 'Question' },
      { name: 'answer', label: 'Answer', multiline: true },
    ],
  },
  tenets: {
    label: 'Tenets',
    fields: [
      { name: 'number', label: 'No.' },
      { name: 'title', label: 'Title' },
      { name: 'body', label: 'Body', multiline: true },
    ],
  },
  'batch-loop': {
    label: 'Batch loop',
    fields: [
      { name: 'number', label: 'No.' },
      { name: 'title', label: 'Title' },
      { name: 'body', label: 'Body', multiline: true },
    ],
  },
}

const SITE_KEYS = ['hero', 'trainer', 'contact'] as const
type Tab = 'courses' | ContentCollection | (typeof SITE_KEYS)[number]

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none'
const BTN = 'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'

function blank(fields: FieldSpec[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.name, '']))
}

function CollectionEditor({ collection }: { collection: ContentCollection }) {
  const { fields } = COLLECTIONS[collection]
  const [rows, setRows] = useState<ContentRow[] | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>(() => blank(fields))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    try {
      setRows(await adminListContent(collection))
      setError('')
    } catch {
      setError('Could not load. Are you still signed in?')
    }
  }, [collection])

  useEffect(() => {
    setRows(null)
    setDraft(blank(fields))
    void reload()
    // `fields` is derived from `collection` and is stable per collection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, reload])

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    try {
      await action()
      await reload()
      setError('')
    } catch {
      setError('That did not save. Check the values and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void run(async () => {
            await createContent(collection, {
              ...draft,
              display_order: (rows?.length ?? 0) + 1,
            })
            setDraft(blank(fields))
          })
        }}
        className="mb-8 rounded-xl border border-gray-200 bg-white p-5"
      >
        <h3 className="mb-4 font-medium">Add new</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className={field.multiline ? 'sm:col-span-2' : ''}>
              <span className="mb-1 block text-xs text-gray-500">{field.label}</span>
              {field.multiline ? (
                <textarea
                  rows={3}
                  value={draft[field.name] ?? ''}
                  onChange={(event) =>
                    setDraft({ ...draft, [field.name]: event.target.value })
                  }
                  className={INPUT}
                />
              ) : (
                <input
                  value={draft[field.name] ?? ''}
                  onChange={(event) =>
                    setDraft({ ...draft, [field.name]: event.target.value })
                  }
                  className={INPUT}
                />
              )}
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={busy}
          className={`${BTN} mt-4 bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50`}
        >
          Add
        </button>
      </form>

      {rows === null && <p className="text-sm text-gray-500">Loading…</p>}
      {rows?.length === 0 && <p className="text-sm text-gray-500">Nothing here yet.</p>}

      <div className="grid gap-4">
        {rows?.map((row, index) => (
          <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.name} className={field.multiline ? 'sm:col-span-2' : ''}>
                  <span className="mb-1 block text-xs text-gray-500">{field.label}</span>
                  {field.multiline ? (
                    <textarea
                      rows={3}
                      defaultValue={String(row[field.name] ?? '')}
                      onBlur={(event) => {
                        if (event.target.value === String(row[field.name] ?? '')) return
                        void run(() =>
                          updateContent(collection, row.id, { [field.name]: event.target.value }),
                        )
                      }}
                      className={INPUT}
                    />
                  ) : (
                    <input
                      defaultValue={String(row[field.name] ?? '')}
                      onBlur={(event) => {
                        if (event.target.value === String(row[field.name] ?? '')) return
                        void run(() =>
                          updateContent(collection, row.id, { [field.name]: event.target.value }),
                        )
                      }}
                      className={INPUT}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-auto text-xs text-gray-500">
                Position {row.display_order} · {row.status}
              </span>
              <button
                type="button"
                disabled={busy || index === 0}
                onClick={() =>
                  void run(async () => {
                    const above = rows[index - 1]
                    await updateContent(collection, row.id, {
                      display_order: above.display_order,
                    })
                    await updateContent(collection, above.id, {
                      display_order: row.display_order,
                    })
                  })
                }
                className={`${BTN} border border-gray-300 disabled:opacity-40`}
              >
                Move up
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    updateContent(collection, row.id, {
                      status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    }),
                  )
                }
                className={`${BTN} border border-gray-300`}
              >
                {row.status === 'ACTIVE' ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm('Delete this permanently?')) return
                  void run(() => deleteContent(collection, row.id))
                }}
                className={`${BTN} border border-red-300 text-red-700`}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

// Hero, trainer and contact are one blob each. Editing them as JSON is honest
// about what they are - nested objects and arrays - and means adding a field to
// the blob does not need a new form here.
function BlobEditor({ blobKey }: { blobKey: string }) {
  // The loaded flag is derived from which key the text belongs to, rather than
  // reset synchronously inside the effect - switching tabs then shows "loading"
  // without an extra render pass.
  const [loadedFor, setLoadedFor] = useState<{ key: string; text: string } | null>(null)
  const [edited, setEdited] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const loaded = loadedFor?.key === blobKey
  const text = (loaded ? (edited ?? loadedFor.text) : '') || ''

  const setText = (value: string) => setEdited(value)

  useEffect(() => {
    let mounted = true
    getSiteBlob(blobKey)
      .then((value) => {
        if (!mounted) return
        setMessage('')
        setEdited(null)
        setLoadedFor({ key: blobKey, text: JSON.stringify(value, null, 2) })
      })
      .catch(() => {
        if (mounted) setMessage('Could not load this section.')
      })
    return () => {
      mounted = false
    }
  }, [blobKey])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="mb-3 text-sm text-gray-500">
        Edit the values, not the field names — the site looks these up by name.
      </p>
      <textarea
        rows={22}
        value={text}
        disabled={!loaded}
        onChange={(event) => setText(event.target.value)}
        className={`${INPUT} font-mono text-xs`}
      />
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={!loaded}
          onClick={async () => {
            let parsed: Record<string, unknown>
            try {
              parsed = JSON.parse(text)
            } catch {
              setMessage('That is not valid JSON — nothing was saved.')
              return
            }
            try {
              await saveSiteBlob(blobKey, parsed)
              setMessage('Saved.')
            } catch {
              setMessage('That did not save.')
            }
          }}
          className={`${BTN} bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50`}
        >
          Save
        </button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </div>
  )
}

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>('courses')
  const isCollection = tab in COLLECTIONS

  return (
    <div>
      <h2 className="text-xl font-semibold">Site content</h2>
      <p className="mt-1 text-sm text-gray-600">
        Everything here is what the public site renders. Changes are live on the next page load.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setTab('courses')}
          className={`${BTN} ${
            tab === 'courses' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Courses
        </button>
        {(Object.keys(COLLECTIONS) as ContentCollection[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`${BTN} ${
              tab === key ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {COLLECTIONS[key].label}
          </button>
        ))}
        {SITE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`${BTN} capitalize ${
              tab === key ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'courses' ? (
          <CourseEditor />
        ) : isCollection ? (
          <CollectionEditor collection={tab as ContentCollection} />
        ) : (
          <BlobEditor blobKey={tab} />
        )}
      </div>
    </div>
  )
}
