import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ScrollProgress from '../motion/ScrollProgress'
import FloatingContact from '../components/FloatingContact'
import Hero from '../sections/home/Hero'
import Batches from '../sections/home/Batches'
import Trainer from '../sections/home/Trainer'
import Tenets from '../sections/home/Tenets'
import BatchLoop from '../sections/home/BatchLoop'
import Students from '../sections/home/Students'
import Faq from '../sections/home/Faq'
import Enquiry from '../sections/home/Enquiry'
import Join from '../sections/home/Join'
import CourseDetailPage from './CourseDetailPage'
import { CourseDetailContext } from '../contexts/CourseDetailContext'
import { prefersReducedMotion } from '../motion/prefersReducedMotion'
import Seo from '../seo/Seo'
import {
  BreadcrumbJsonLd,
  CourseJsonLd,
  FaqJsonLd,
  LocalBusinessJsonLd,
  OrganizationJsonLd,
} from '../seo/structuredData'
import { courseBySlug } from '../content/courses'
import { FAQS } from '../content/homeSections'

// One question per section, in the order a visitor actually asks them:
//
//   Hero      what is this, and is anything running right now
//   Batches   what could I actually join
//   Tenets    why does "live" mean anything here
//   BatchLoop what does a batch actually feel like
//   Trainer   who is teaching it
//   Students  did it work for anyone else
//   Faq       what am I still unsure about
//   Join      how do I start
//   Enquiry   ...and the form to do it, right under the ask
//
// A course opens inside this page rather than replacing it: the browse layer
// recedes, the course rises in, and the URL is pushed so the link is still
// shareable and Back still closes it. Nothing unmounts, which is what makes it
// read as this page extending rather than a different page arriving.
function HomeSeo() {
  return (
    <>
      <Seo
        path="/"
        title="Live AI & Software Training in Ameerpet, Hyderabad | VPro Skills"
        description="Live instructor-led batches in Agentic AI, Python, Java and .NET full stack, taught at a fixed hour in Ameerpet or online. Sit in on three classes before you pay anything."
      />
      <OrganizationJsonLd />
      <LocalBusinessJsonLd />
      <FaqJsonLd items={FAQS.map((faq) => ({ question: faq.q, answer: faq.a }))} />
    </>
  )
}

function CourseSeo({ slug }: { slug: string }) {
  const course = courseBySlug(slug)
  // An unknown slug renders the shelf's "course not found" state, and a page
  // that says nothing exists should not be offering itself to the index.
  if (!course) {
    return (
      <Seo
        path={`/courses/${slug}`}
        title="Course not found"
        description="This course is not on our current schedule."
        noIndex
      />
    )
  }

  const path = `/courses/${course.slug}`
  return (
    <>
      <Seo
        path={path}
        title={`${course.name} Course`}
        description={`${course.summary} Live instructor-led batches in Ameerpet, Hyderabad and online.`.slice(
          0,
          300,
        )}
      />
      <CourseJsonLd name={course.name} description={course.summary} path={path} />
      <BreadcrumbJsonLd
        trail={[
          { name: 'Courses', path: '/courses' },
          { name: course.name, path },
        ]}
      />
    </>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  // The route is the state. Nothing is mirrored into a ref or a local copy, so
  // the page cannot disagree with the address bar however you got here -
  // clicked, pasted, Back or Forward.
  const { slug: routeSlug } = useParams()
  const slug = routeSlug ?? null
  const [opening, setOpening] = useState(false)

  const openCourse = useCallback(
    (next: string) => {
      navigate(`/courses/${next}`)
      if (prefersReducedMotion()) return
      // Blocks clicks until the transition settles, so a second press cannot
      // start an animation from a half-finished state.
      setOpening(true)
      window.setTimeout(() => setOpening(false), 920)
    },
    [navigate],
  )

  const closeCourse = useCallback(() => navigate('/'), [navigate])

  // Opening a course starts you at its top; closing returns you to the shelf.
  useEffect(() => {
    if (!slug) return
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [slug])

  useEffect(() => {
    if (!slug) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCourse()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [slug, closeCourse])

  const open = slug !== null

  return (
    <CourseDetailContext.Provider value={openCourse}>
      {/* This one component serves two routes, so it owns two sets of metadata.
          A course opened here is a real, indexable page at its own URL - it just
          happens to render inside the home page rather than replacing it - so it
          gets the course's title, description and canonical, not the home
          page's. Taken from the static curriculum rather than the API so the
          prerender does not depend on the backend being up at build time. */}
      {open ? <CourseSeo slug={slug} /> : <HomeSeo />}

      <div className={`${open ? 'mode-detail' : ''} ${opening ? 'is-opening' : ''}`}>
        <ScrollProgress />

        {/* Kept mounted and in the flow only while browsing - once a course is
            open this collapses out so it cannot leave a screen of empty page
            underneath the course. */}
        {/* `hidden` already takes this out of rendering, the a11y tree and the
            tab order, so no separate `inert` is needed. */}
        <div className="browse-ui" hidden={open}>
          <Hero />
          <Batches />
          <Tenets />
          <BatchLoop />
          <Trainer />
          <Students />
          <Faq />
          <Join />
          <Enquiry />
        </div>

        {open && (
          // Deliberately a sibling of .detail-view, not a child: that element
          // is animated with a transform, which would make this button's
          // `fixed` resolve against it and scroll away with the content.
          <button
            type="button"
            onClick={closeCourse}
            aria-label="Close this course"
            className="btn-secondary btn-compact fixed right-[var(--gutter)] top-[88px] z-[60] gap-[9px]"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
              <path
                d="M1 1L10 10M10 1L1 10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="square"
              />
            </svg>
            Close
          </button>
        )}

        {open && (
          <div className="detail-view">
            <CourseDetailPage slug={slug} onClose={closeCourse} />
          </div>
        )}

        <FloatingContact />
      </div>
    </CourseDetailContext.Provider>
  )
}
