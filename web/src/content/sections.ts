// The home page's running order, as data, so the rail, the header anchors and
// the section numbers can never drift out of sync with the DOM.
//
// Replaces world/chapters.ts. The old ledger carried camera frames and sky
// colours for a 3D dawn scene; this page's meaning is carried by type and
// structure, so a section only needs an anchor and a name.

export interface SectionMeta {
  id: string
  /** Shown in the side rail and the header nav. */
  label: string
  /** Section numbers are printed on the page; false for the hero. */
  numbered: boolean
}

export const SECTIONS: SectionMeta[] = [
  { id: 'hero', label: 'Top', numbered: false },
  { id: 'why', label: 'Why this way', numbered: true },
  { id: 'courses', label: 'Courses', numbered: true },
  { id: 'how', label: 'How it works', numbered: true },
  { id: 'trainer', label: 'Trainer', numbered: true },
  { id: 'join', label: 'Join', numbered: true },
]

/** 1-based number as printed, skipping the unnumbered hero. */
export function sectionNumber(id: string): string {
  const numbered = SECTIONS.filter((section) => section.numbered)
  const index = numbered.findIndex((section) => section.id === id)
  return index < 0 ? '' : String(index + 1).padStart(2, '0')
}

/** Header/rail anchors - everything except the hero, which the logo returns to. */
export const NAV_SECTIONS = SECTIONS.filter((section) => section.numbered)
