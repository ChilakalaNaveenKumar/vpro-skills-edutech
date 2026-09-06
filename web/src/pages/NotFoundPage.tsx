import { Link } from 'react-router-dom'
import Seo from '../seo/Seo'

// Without a catch-all, an unmatched path rendered PublicLayout with an empty
// Outlet - a blank white screen, no header, no footer, no way back. It was
// found because the footer's three legal links landed here, those routes not
// having existed yet; they do now, but a stale bookmark still needs this.
export default function NotFoundPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-24 text-center">
      {/* This is served with a 200 - the page exists as far as the CDN is
          concerned - so noindex is the only thing keeping it out of the index. */}
      <Seo
        path="/404"
        title="Page not found"
        description="That page does not exist."
        noIndex
      />
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
