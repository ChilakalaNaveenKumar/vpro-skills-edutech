import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ScrollProgress from '../motion/ScrollProgress'
import MobileActionBar from '../components/MobileActionBar'
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

        <MobileActionBar />
        <FloatingContact />
      </div>
    </CourseDetailContext.Provider>
  )
}
