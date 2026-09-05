import { Link } from 'react-router-dom'

// Without a catch-all, an unmatched path rendered PublicLayout with an empty
// Outlet - a blank white screen, no header, no footer, no way back. The footer's
// three legal links land here today, which is how it was found.
export default function NotFoundPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500">404</p>
      <h1 className="mt-4 font-display text-3xl text-gray-900">We could not find that page.</h1>
      <p className="mt-4 text-gray-600">
        It may have moved, or the link may be wrong. The batch schedule and the course pages are
        below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Home
        </Link>
        <Link
          to="/courses"
          className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400"
        >
          All courses
        </Link>
        <Link
          to="/batches"
          className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400"
        >
          Batch schedule
        </Link>
      </div>
    </section>
  )
}
