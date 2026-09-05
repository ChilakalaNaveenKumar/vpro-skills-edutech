import CtaLink from './CtaLink'

// Kept off small screens because the mobile action bar already owns that space.
export default function FloatingContact() {
  return (
    <CtaLink
      cta="course_interest"
      chapter="floating"
      className="fixed bottom-6 right-6 z-[79] hidden h-14 w-14 items-center justify-center rounded-[50%] bg-[#25D366] text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform duration-200 hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--on-ink)] motion-reduce:transform-none motion-reduce:transition-none lg:flex"
    >
      <span className="sr-only">Message VPro Skills on WhatsApp</span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.07 4.37 2.98 1.16 2.98.77 3.52.72.54-.05 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35Z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.04-.19-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.26 8.23Z" />
      </svg>
    </CtaLink>
  )
}
