import CtaLink from './CtaLink'
import { CONTACT } from '../content/contact'

const CIRCLE =
  'flex h-[52px] w-[52px] min-[901px]:h-14 min-[901px]:w-14 items-center justify-center rounded-[50%] shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform duration-200 ease-[var(--ease-state)] hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--on-ink)] motion-reduce:transform-none motion-reduce:transition-none'

// Present at every width. This used to start at 901px and hand the space to a
// fixed bar on narrower screens, but the two hid at different breakpoints, so
// between 901px and 1024px the bar rendered on top of these buttons and covered
// them - and it offered the same two actions they already do.
export default function FloatingContact() {
  return (
    <div className="fixed bottom-5 right-4 z-[79] flex flex-col gap-3 min-[901px]:bottom-6 min-[901px]:right-6">
      <CtaLink
        cta="course_interest"
        chapter="floating"
        className={`${CIRCLE} bg-[#25D366] text-white`}
      >
        <span className="sr-only">Message VPro Skills on WhatsApp</span>
        <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 1 1 6.98 3.86Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.01-.38.11-.5.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
        </svg>
      </CtaLink>

      <a
        href={`tel:${CONTACT.phoneDial}`}
        title="Call us"
        className={`${CIRCLE} bg-[color:var(--btn-primary)] text-[color:var(--on-ink)]`}
      >
        <span className="sr-only">{`Call VPro Skills on ${CONTACT.phoneDisplay}`}</span>
        <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
        </svg>
      </a>
    </div>
  )
}
