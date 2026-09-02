import { istParts } from '../utils/ist'

// Single source of truth for every outbound contact channel. The live site's
// proven pattern: one number, a context-specific prefilled WhatsApp message per CTA.

export const CONTACT = {
  whatsappNumber: '919010001847',
  // Live site used tel:9010001847 (no country code) - broken for roaming/NRI visitors.
  phoneDial: '+919010001847',
  phoneDisplay: '+91 90100 01847',
  location: 'Ameerpet, Hyderabad',
  timezone: 'Asia/Kolkata',
  hours: { openHour: 9, closeHour: 21 },
} as const

export type CtaKey =
  | 'hero_demo'
  | 'curriculum_interest'
  | 'demo_register'
  | 'reserve_seat'
  | 'talk_to_trainer'
  | 'footer_whatsapp'
  | 'course_interest'
  | 'live_class_times'
  | 'course_waitlist'

const MESSAGES: Record<CtaKey, string> = {
  hero_demo: 'Hi VPro Skills, I want to join the FREE AI Demo.',
  curriculum_interest: 'Hi VPro Skills, I am interested in the Generative AI Course.',
  demo_register: 'Hi VPro Skills, I want to register for the FREE AI Demo.',
  reserve_seat: 'Hi VPro Skills, I want to join the FREE Generative AI Demo.',
  talk_to_trainer: 'Hi VPro Skills, I would like to speak with the trainer.',
  footer_whatsapp: 'Hi VPro Skills, I am interested in the AI Course.',
  course_interest: 'Hi VPro Skills, I want to register for the FREE Generative AI Demo Session.',
  live_class_times: 'Hi VPro Skills, I would like to know the live class timings.',
  course_waitlist: 'Hi VPro Skills, I want to be told when the next course opens.',
}

export function whatsappUrl(key: CtaKey, segment?: string): string {
  const base = MESSAGES[key]
  const message = segment ? `${base} I am a ${segment}.` : base
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export function ctaMessage(key: CtaKey): string {
  return MESSAGES[key]
}

// Honest presence: real IST hours, computed - never a fake "online now" dot.
// Uses the fixed-offset helper rather than re-parsing a localized date string,
// which is not guaranteed to round-trip through `Date` across engines.
export function isOpenNow(now: Date = new Date()): boolean {
  const { hour } = istParts(now)
  return hour >= CONTACT.hours.openHour && hour < CONTACT.hours.closeHour
}
