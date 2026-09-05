# Dark Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public marketing pages (`/`, `/courses`, `/courses/:slug`, `/about`, and a new `/batches`) as a faithful clone of the dark editorial comp, driven by live batch data.

**Architecture:** The existing `[data-journey]` CSS scoping in `web/src/index.css` already isolates marketing styling from the portal and admin. We rewrite that block with the new token set, delete the current motion machinery, and build the comp's sections as focused React components. All CTAs terminate in WhatsApp via the existing `CtaLink`; the only server read is the already-public `GET /api/batches/`.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4 (CSS-first `@theme`), React Router 7, Vitest (added in Task 1), oxlint.

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from [the spec](../specs/2026-09-04-vpro-dark-editorial-redesign-design.md).

- **Ground** `#14161C`. **Card surface** `#191C23`. **Bone (text)** `#EDE7DE`. **Copper (accent)** `#C87046`. **Tan** `#C3A47B`. **Hairline** `rgba(237,231,222,0.14)`.
- **Primary button** fill `#7A3B1F`, hover `#92492A`. **Secondary button** fill `#232733`, hover `#2C313F`, hairline `rgba(237,231,222,0.22)`. These two are the *entire* button vocabulary.
- **Contrast rule:** text below 16px needs bone at **≥0.62 alpha**; 22px and above may drop to 0.55. Never lower.
- **Fonts:** `Newsreader` (display + long copy, weights 300–400, tight negative tracking); `IBM Plex Mono` (labels, meta, buttons — uppercase, ~0.16em tracking); `IBM Plex Sans` (UI/body).
- **The logo plate is the only bone-filled element on the site.** Never place the bare logo on the copper or dark ground.
- **No blinking dots, pulsing rings, or status-light decoration.** (The current `Hero.tsx` has an `animate-ping` indicator; it does not survive.)
- **No headlines built from short dotted fragments.**
- **One course list with a state column.** Never split into separate "In session" / "Opening next" groupings.
- **No invented numbers.** No course counts, no seat counts, no placement guarantees, no market-size or salary claims.
- **Never render a fact the data cannot support.** Specifically: no "Few seats left", no "6 of 18 seats", no "hour to be confirmed".
- **Every CTA goes through `CtaLink`** and the `MESSAGES` map in `web/src/content/contact.ts`. No ad-hoc `wa.me` URLs at call sites.
- **Nothing in `/dashboard`, `/results`, `/topics/*` or `/admin/*` may change.**
- The comp lives at `~/Downloads/VPro Skills Website Redesign/` (`VPro Skills Home.dc.html`, `Course.dc.html`, `Batches.dc.html`). It is the visual source of truth and can be served with `python3 -m http.server 8899` from that directory.
- **Type-checking must use `npx tsc -b --noEmit`.** `web/tsconfig.json` is a solution-style config with `"files": []`, so a bare `npx tsc --noEmit` compiles nothing and exits 0 regardless of what is broken. `npm run build` (`tsc -b && vite build`) is the fuller check.

---

### Task 1: Course state derivation, with tests

The shelf must say "In session" only when a course genuinely has a running batch. This is the one piece of real business logic in the redesign — if it is wrong, the site lies about what is running — so it gets tests and is built first.

**Files:**
- Create: `web/src/utils/courseState.ts`
- Create: `web/src/utils/courseState.test.ts`
- Create: `web/vitest.config.ts`
- Modify: `web/package.json`

**Interfaces:**
- Consumes: `ScheduleRow`, `BatchState` from `web/src/utils/schedule.ts`; `Batch` from `web/src/types`.
- Produces: `type CourseState = 'In session' | 'Gathering interest'`; `courseStateFor(courseName: string, rows: ScheduleRow[] | null): CourseState`; `courseStateNote(courseName: string, rows: ScheduleRow[] | null): string | null`.

- [ ] **Step 1: Add Vitest**

```bash
cd web && npm install --save-dev vitest
```

- [ ] **Step 2: Create `web/vitest.config.ts`**

No jsdom: these are pure functions over plain data and need no DOM.

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Add the test script to `web/package.json`**

In the `"scripts"` block, alongside the existing `dev`/`build`/`lint`/`preview`:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write the failing test**

Create `web/src/utils/courseState.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { courseStateFor, courseStateNote } from './courseState'
import type { ScheduleRow } from './schedule'
import type { Batch } from '../types'

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 1,
    course_id: 1,
    course_name: 'Agentic AI',
    batch_number: 'Batch A-04',
    start_date: '2026-08-04',
    end_date: '2026-11-02',
    start_time: '19:30:00',
    end_time: '21:00:00',
    trainer_name: 'Sambasiva Rao',
    trainer_email: 'trainer@example.com',
    status: 'ACTIVE',
    progress_status: 'IN_PROGRESS',
    ...overrides,
  }
}

const row = (state: ScheduleRow['state'], overrides: Partial<Batch> = {}): ScheduleRow => ({
  batch: batch(overrides),
  state,
})

describe('courseStateFor', () => {
  it('is In session when the course has a batch teaching right now', () => {
    expect(courseStateFor('Agentic AI', [row('live')])).toBe('In session')
  })

  it('is In session when the course has a batch mid-run but not at this hour', () => {
    expect(courseStateFor('Agentic AI', [row('running')])).toBe('In session')
  })

  it('is In session when the course has a batch starting later today', () => {
    expect(courseStateFor('Agentic AI', [row('today')])).toBe('In session')
  })

  it('is Gathering interest when the only batch has not started yet', () => {
    expect(courseStateFor('Agentic AI', [row('upcoming')])).toBe('Gathering interest')
  })

  it('is Gathering interest when the course has no batches at all', () => {
    expect(courseStateFor('Quantum Computing', [row('live')])).toBe('Gathering interest')
  })

  it('ignores a completed batch even if its dates still bracket today', () => {
    expect(
      courseStateFor('Agentic AI', [row('running', { progress_status: 'COMPLETED' })]),
    ).toBe('Gathering interest')
  })

  it('is Gathering interest before the schedule has loaded, never a false positive', () => {
    expect(courseStateFor('Agentic AI', null)).toBe('Gathering interest')
  })

  it('matches the course name exactly, not by prefix', () => {
    expect(courseStateFor('Python', [row('live', { course_name: 'Python Full Stack' })])).toBe(
      'Gathering interest',
    )
  })
})

describe('courseStateNote', () => {
  it('names the running batch and its start date', () => {
    expect(courseStateNote('Agentic AI', [row('running')])).toBe('Batch A-04 · started 4 Aug')
  })

  it('is null when nothing is running, so no note is rendered at all', () => {
    expect(courseStateNote('Agentic AI', [row('upcoming')])).toBeNull()
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `cd web && npx vitest run src/utils/courseState.test.ts`
Expected: FAIL — `Failed to resolve import "./courseState"`.

- [ ] **Step 6: Write the implementation**

Create `web/src/utils/courseState.ts`:

```ts
import type { ScheduleRow } from './schedule'

export type CourseState = 'In session' | 'Gathering interest'

// A batch that is teaching, mid-run, or starting later today all mean the same
// thing to a visitor: this course is running. 'upcoming' does not - the batch
// has not begun, so the course is still gathering people.
const RUNNING_STATES: ReadonlySet<ScheduleRow['state']> = new Set(['live', 'today', 'running'])

function runningRow(courseName: string, rows: ScheduleRow[] | null): ScheduleRow | null {
  if (!rows) return null
  return (
    rows.find(
      (row) =>
        row.batch.course_name === courseName &&
        row.batch.progress_status !== 'COMPLETED' &&
        RUNNING_STATES.has(row.state),
    ) ?? null
  )
}

// Derived, never stored. A `state` column on courses.ts would drift the moment
// a batch ended and nobody remembered to edit it.
export function courseStateFor(courseName: string, rows: ScheduleRow[] | null): CourseState {
  return runningRow(courseName, rows) ? 'In session' : 'Gathering interest'
}

/** e.g. "Batch A-04 · started 4 Aug". Null when nothing is running. */
export function courseStateNote(courseName: string, rows: ScheduleRow[] | null): string | null {
  const row = runningRow(courseName, rows)
  if (!row) return null
  const started = new Date(`${row.batch.start_date}T00:00:00`)
  const label = started.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${row.batch.batch_number} · started ${label}`
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd web && npx vitest run src/utils/courseState.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 8: Commit**

```bash
git add web/src/utils/courseState.ts web/src/utils/courseState.test.ts web/vitest.config.ts web/package.json web/package-lock.json
git commit -m "Derive a course's running state from its batches, and test it"
```

---

### Task 2: Design tokens, fonts, and theme scoping

Replaces the palette and rewrites the `[data-journey]` block. Most of that block styles components deleted in Task 11, so it is rewritten wholesale rather than patched.

**Files:**
- Modify: `web/index.html:10-15`
- Modify: `web/src/index.css` (the `[data-journey]` block, lines ~61–1252)
- Modify: `web/src/layouts/PublicLayout.tsx:62-65`
- Modify: `web/src/App.tsx`
- Create: `web/src/pages/BatchesPage.tsx`

**Interfaces:**
- Produces: CSS custom properties `--ink`, `--ink-2`, `--on-ink`, `--on-ink-mute`, `--on-ink-faint`, `--signal`, `--tan`, `--rule`, `--btn-primary`, `--btn-primary-hover`, `--btn-secondary`, `--btn-secondary-hover`, `--btn-secondary-rule`, `--gutter`; utility classes `.shell`, `.display`, `.eyebrow`, `.lede`, `.mono`, `.btn-primary`, `.btn-secondary`; route `/batches` rendering `BatchesPage`.

- [ ] **Step 1: Swap the fonts in `web/index.html`**

Replace the single `<link href="https://fonts.googleapis.com/css2?family=Poppins...">` element (lines 12–15) with:

```html
    <link
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..400;1,6..72,300..400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
```

Newsreader needs its italic axis: the hero's "is a *recording*." is italic.

- [ ] **Step 2: Replace the `[data-journey]` token block in `web/src/index.css`**

Delete everything from the `THE JOURNEY` comment banner (line ~61) to the end of the file, and replace with the block below. The `@theme` block at the top (lines 18–29) and the `.skip-link` / `:focus-visible` rules (lines 31–59) stay exactly as they are — the portal and admin depend on them.

```css
/* ===========================================================================
   PUBLIC MARKETING SURFACE  (scoped to [data-journey])
   ---------------------------------------------------------------------------
   Dark editorial. Ground is a cool near-black, type is warm bone, and the one
   accent is a muted copper. Scoped to [data-journey] so the student portal and
   the admin panel keep the light brand palette untouched - they never read
   these properties.

   The contrast floor is a hard rule, not a preference: on this ground, bone
   below 0.62 alpha fails AA at text sizes under 16px. --on-ink-faint sits at
   exactly that floor and is the smallest permitted value for small text.
   =========================================================================== */

[data-journey] {
  --ink: #14161c;
  --ink-2: #191c23;

  --on-ink: #ede7de;
  --on-ink-mute: rgb(237 231 222 / 0.78);
  --on-ink-faint: rgb(237 231 222 / 0.62);

  --signal: #c87046;
  --tan: #c3a47b;
  --rule: rgb(237 231 222 / 0.14);

  --btn-primary: #7a3b1f;
  --btn-primary-hover: #92492a;
  --btn-secondary: #232733;
  --btn-secondary-hover: #2c313f;
  --btn-secondary-rule: rgb(237 231 222 / 0.22);

  --gutter: clamp(1.25rem, 5vw, 2.75rem);
  --ease-reveal: cubic-bezier(0.2, 0.85, 0.2, 1);

  background: var(--ink);
  color: var(--on-ink);
  font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
}

[data-journey] ::selection {
  background: var(--signal);
  color: var(--on-ink);
}

/* --- Layout --------------------------------------------------------------- */

[data-journey] .shell {
  width: 100%;
  max-width: 1560px;
  margin-inline: auto;
  padding-inline: var(--gutter);
}

/* --- Type ----------------------------------------------------------------- */

[data-journey] .display {
  font-family: "Newsreader", Georgia, serif;
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.04;
  text-wrap: balance;
}

[data-journey] .display em {
  font-style: italic;
  color: var(--signal);
}

[data-journey] .eyebrow,
[data-journey] .mono {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 0.69rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

[data-journey] .eyebrow {
  color: var(--signal);
}

[data-journey] .lede {
  font-family: "Newsreader", Georgia, serif;
  font-size: clamp(1.05rem, 0.4vw + 0.98rem, 1.24rem);
  line-height: 1.6;
  color: var(--on-ink-mute);
  text-wrap: pretty;
}

/* --- Buttons -------------------------------------------------------------- */
/* Exactly two. Bone fills, plain outlines and copper-with-dark-text were all
   rejected during the comp's design; the logo plate is the only bone fill. */

[data-journey] .btn-primary,
[data-journey] .btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 52px;
  padding: 1.0625rem 1.75rem;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 0.69rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--on-ink);
  border: 0;
  cursor: pointer;
  transition: background 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

[data-journey] .btn-primary {
  background: var(--btn-primary);
}

[data-journey] .btn-primary:hover {
  background: var(--btn-primary-hover);
}

[data-journey] .btn-secondary {
  background: var(--btn-secondary);
  box-shadow: inset 0 0 0 1px var(--btn-secondary-rule);
}

[data-journey] .btn-secondary:hover {
  background: var(--btn-secondary-hover);
}

[data-journey] :focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Add `/batches` to the journey predicate**

In `web/src/layouts/PublicLayout.tsx`, replace the `journey` assignment (lines 62–65) with:

```tsx
  // The marketing surface: home, courses, the batch schedule and about.
  const journey =
    location.pathname === '/' ||
    location.pathname.startsWith('/courses') ||
    location.pathname === '/batches' ||
    location.pathname === '/about'
```

- [ ] **Step 4: Create a placeholder `BatchesPage` so the route resolves**

Create `web/src/pages/BatchesPage.tsx`. Task 9 fills it in.

```tsx
export default function BatchesPage() {
  return (
    <div className="shell py-24">
      <h1 className="display text-[clamp(2rem,4vw,3.2rem)]">Reserve your seat.</h1>
    </div>
  )
}
```

- [ ] **Step 5: Register the route in `web/src/App.tsx`**

Add the import alongside the other page imports:

```tsx
import BatchesPage from './pages/BatchesPage'
```

and the route inside the `<Route element={<PublicLayout />}>` block, immediately after the `/courses/:slug` route:

```tsx
        <Route path="/batches" element={<BatchesPage />} />
```

- [ ] **Step 6: Verify the app still compiles**

Run: `cd web && npx tsc -b --noEmit`
Expected: errors *only* from files that reference now-deleted CSS classes — those are components Task 11 removes. TypeScript does not check CSS, so this should in fact be clean. If any error mentions a missing module, stop and fix it before continuing.

Run: `cd web && npm run dev`, then open `http://localhost:5173/batches`.
Expected: dark `#14161C` ground, bone serif heading. Open `http://localhost:5173/dashboard` (log in if needed): unchanged light theme.

- [ ] **Step 7: Commit**

```bash
git add web/index.html web/src/index.css web/src/layouts/PublicLayout.tsx web/src/App.tsx web/src/pages/BatchesPage.tsx
git commit -m "Dark editorial tokens, the three new families, and a /batches route"
```

---

### Task 3: Motion primitives

Four small pieces every section depends on. One shared scroll listener, not one per component.

**Files:**
- Create: `web/src/motion/prefersReducedMotion.ts`
- Create: `web/src/motion/Reveal.tsx`
- Create: `web/src/motion/useScrollDriver.ts`
- Create: `web/src/motion/ScrollProgress.tsx`
- Create: `web/src/components/Accordion.tsx`

**Interfaces:**
- Produces:
  - `prefersReducedMotion(): boolean`
  - `<Reveal as?: ElementType, delayIndex?: number, className?: string, children>` — fade-up on enter.
  - `useScrollDriver(onScroll: (scrollY: number, maxScroll: number) => void): void` — rAF-throttled, passive.
  - `<ScrollProgress />` — fixed copper bar.
  - `<Accordion items: AccordionItem[], openIndex: number, onToggle: (i: number) => void, className?: string />` where `AccordionItem = { id: string; heading: ReactNode; body: ReactNode }`.

- [ ] **Step 1: Create `web/src/motion/prefersReducedMotion.ts`**

Every animated component on the site reads this. `Ticker` is the one exception: it uses Tailwind's `motion-reduce:animate-none`, because its animation is pure CSS and never touches JS.

```ts
/**
 * Kept as a function so callers read the current OS preference when they
 * initialize, rather than a value cached at module load.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
```

- [ ] **Step 2: Create `web/src/motion/Reveal.tsx`**

The 2800ms failsafe is not optional — without it, any IntersectionObserver misfire leaves the page permanently blank.

```tsx
import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { prefersReducedMotion } from './prefersReducedMotion'

interface Props {
  as?: ElementType
  /** Stagger position. Delay is (delayIndex % 3) * 80ms, matching the comp. */
  delayIndex?: number
  className?: string
  children: ReactNode
}

export default function Reveal({ as, delayIndex = 0, className = '', children }: Props) {
  const Tag = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  // Read once, during the first render: a second render just to reveal content
  // that was never going to animate is forty wasted renders on the home page.
  const [instant] = useState(() => prefersReducedMotion())
  const [shown, setShown] = useState(instant)

  useEffect(() => {
    if (instant) return

    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )
    observer.observe(node)

    // If the observer never fires - a layout quirk, a zero-height parent - the
    // page must not stay blank.
    const failsafe = window.setTimeout(() => setShown(true), 2800)

    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [instant])

  const delay = (delayIndex % 3) * 80

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(20px)',
        transition: instant
          ? undefined
          : `opacity 720ms var(--ease-reveal) ${delay}ms, transform 720ms var(--ease-reveal) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  )
}
```

- [ ] **Step 3: Create `web/src/motion/useScrollDriver.ts`**

```ts
import { useEffect, useLayoutEffect, useRef } from 'react'

type Subscriber = (scrollY: number, maxScroll: number) => void

// Module-level, deliberately: the progress bar, the portrait parallax and the
// mobile action bar all read scroll position, and three separate listeners
// would let them paint in three different frames. One listener, one frame,
// one set of subscribers.
const subscribers = new Set<Subscriber>()
let frame = 0
let listening = false

function paint() {
  frame = 0
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const scrollY = window.scrollY
  subscribers.forEach((notify) => notify(scrollY, maxScroll))
}

function schedule() {
  if (frame) return
  frame = requestAnimationFrame(paint)
}

function subscribe(notify: Subscriber): () => void {
  subscribers.add(notify)
  if (!listening) {
    window.addEventListener('scroll', schedule, { passive: true })
    listening = true
  }
  // Paint once on subscribe so a component that mounts mid-page is correct
  // before the visitor scrolls again.
  schedule()

  return () => {
    subscribers.delete(notify)
    if (subscribers.size > 0) return
    window.removeEventListener('scroll', schedule)
    listening = false
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }
}

export function useScrollDriver(onScroll: Subscriber): void {
  const callback = useRef(onScroll)

  // Assigned in an effect, not during render: React 19 may discard a render,
  // and a ref written during one would then hold a value that never happened.
  useLayoutEffect(() => {
    callback.current = onScroll
  })

  useEffect(() => subscribe((scrollY, maxScroll) => callback.current(scrollY, maxScroll)), [])
}
```

- [ ] **Step 4: Create `web/src/motion/ScrollProgress.tsx`**

```tsx
import { useRef } from 'react'
import { useScrollDriver } from './useScrollDriver'

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null)

  useScrollDriver((scrollY, maxScroll) => {
    if (ref.current) ref.current.style.width = `${(scrollY / maxScroll) * 100}%`
  })

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5"
    >
      <div ref={ref} className="h-full bg-[color:var(--signal)]" style={{ width: '0%' }} />
    </div>
  )
}
```

- [ ] **Step 5: Create `web/src/components/Accordion.tsx`**

`grid-template-rows: 0fr → 1fr` animates height without a hardcoded pixel value. The heading is a real `<button>` with `aria-expanded`.

```tsx
import type { ReactNode } from 'react'

export interface AccordionItem {
  id: string
  heading: ReactNode
  body: ReactNode
}

interface Props {
  items: AccordionItem[]
  /** -1 means every item is closed. */
  openIndex: number
  onToggle: (index: number) => void
  className?: string
}

export default function Accordion({ items, openIndex, onToggle, className = '' }: Props) {
  return (
    <div className={className}>
      {items.map((item, index) => {
        const open = index === openIndex
        return (
          <div key={item.id} className="border-t border-[color:var(--rule)]">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`accordion-panel-${item.id}`}
              onClick={() => onToggle(index)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              {item.heading}
              <span
                aria-hidden="true"
                className="mono shrink-0 text-lg text-[color:var(--signal)]"
              >
                {open ? '–' : '+'}
              </span>
            </button>
            <div
              id={`accordion-panel-${item.id}`}
              aria-hidden={!open}
              inert={!open}
              className="grid transition-[grid-template-rows,opacity,padding] duration-500 ease-[var(--ease-reveal)] motion-reduce:transition-none"
              style={{
                gridTemplateRows: open ? '1fr' : '0fr',
                opacity: open ? 1 : 0,
                paddingBottom: open ? '14px' : '0px',
              }}
            >
              <div className="overflow-hidden">{item.body}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Verify**

Run: `cd web && npx tsc -b --noEmit && npx oxlint src/motion src/components/Accordion.tsx`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add web/src/motion/prefersReducedMotion.ts web/src/motion/Reveal.tsx web/src/motion/useScrollDriver.ts web/src/motion/ScrollProgress.tsx web/src/components/Accordion.tsx
git commit -m "Reveal, one shared scroll driver, progress bar and accordion"
```

---

### Task 4: The hero canvas

Three drifting sine traces. The only continuous motion on the site.

**Files:**
- Create: `web/src/motion/HeroScope.tsx`

**Interfaces:**
- Produces: `<HeroScope className?: string />` — an absolutely-positioned `<canvas>` that fills its nearest positioned ancestor.

- [ ] **Step 1: Create `web/src/motion/HeroScope.tsx`**

Every constant below is taken from the comp and must not be rounded.

```tsx
import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './prefersReducedMotion'

interface Trace {
  amp: number
  freq: number
  speed: number
  colour: string
  width: number
}

const TRACES: Trace[] = [
  { amp: 0.16, freq: 1.5, speed: 0.00042, colour: 'rgba(200,112,70,0.62)', width: 1.4 },
  { amp: 0.11, freq: 2.6, speed: 0.00061, colour: 'rgba(195,164,123,0.36)', width: 1 },
  { amp: 0.07, freq: 4.1, speed: 0.00088, colour: 'rgba(237,231,222,0.16)', width: 1 },
]

// A live audio scope. It reads as sound in a room rather than as decoration,
// which is the whole argument the page is making: a class is a voice, live, at
// a fixed hour.
export default function HeroScope({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)
      const mid = height * 0.52
      TRACES.forEach((trace, i) => {
        ctx.beginPath()
        ctx.lineWidth = trace.width
        ctx.strokeStyle = trace.colour
        const phase = t * trace.speed + i * 1.7
        for (let x = 0; x <= width; x += 3) {
          const u = x / Math.max(width, 1)
          // Envelope: both ends fall to zero, so the traces never clip an edge.
          const env = Math.sin(u * Math.PI)
          const y =
            mid +
            Math.sin(u * Math.PI * 2 * trace.freq + phase) * height * trace.amp * env +
            Math.sin(u * Math.PI * 2 * (trace.freq * 2.3) - phase * 1.4) *
              height *
              trace.amp *
              0.3 *
              env
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      })
    }

    if (prefersReducedMotion()) {
      draw(0)
      return () => window.removeEventListener('resize', size)
    }

    let frame = 0
    const tick = (ts: number) => {
      draw(ts)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', size)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
```

- [ ] **Step 2: Verify**

Run: `cd web && npx tsc -b --noEmit && npx oxlint src/motion/HeroScope.tsx`
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add web/src/motion/HeroScope.tsx
git commit -m "The hero's audio scope: three drifting traces on one canvas"
```

---

### Task 5: Home hero

**Files:**
- Modify: `web/src/content/platform.ts` (replace contents)
- Create: `web/src/sections/home/Hero.tsx`
- Create: `web/src/components/NextBatchesCard.tsx`
- Create: `web/src/components/Ticker.tsx`
- Modify: `web/src/content/contact.ts` (add CTA keys)

**Interfaces:**
- Consumes: `HeroScope` (Task 4), `Reveal` (Task 3), `useSchedule` from `web/src/utils/schedule.ts`, `CtaLink`.
- Produces: `<Hero />`; `<NextBatchesCard />`; `<Ticker items: string[] />`; `PLATFORM` and `HERO_FACTS` from `content/platform.ts`.

- [ ] **Step 1: Replace `web/src/content/platform.ts`**

The rotating headline is gone — the comp's report is explicit that a student scanning for a start date will not wait for a sentence to finish cycling.

```ts
// What VPro Skills is, stated once and readable the instant the page paints.
//
// The previous version cycled four endings through the headline. A visitor
// scanning for a start date does not wait for a sentence to finish animating,
// so the sentence is now fixed.

export const PLATFORM = {
  name: 'VPro Skills',
  eyebrow: 'Live instructor-led batches',
  /** Rendered with the second clause in <em>, which the .display rule colours copper. */
  headlineLead: 'Nothing here',
  headlineEmphasis: 'is a recording.',
  sub: 'Every session runs live, at a fixed hour, with the trainer in the room. You ask your question while the class is happening.',
} as const

export const HERO_FACTS = [
  { k: 'Format', v: 'Live, fixed hour' },
  { k: 'Questions', v: 'Asked in the room' },
  { k: 'After class', v: 'Live support' },
  { k: 'Recordings', v: 'Backup, not the course' },
] as const
```

- [ ] **Step 2: Teach `web/src/content/contact.ts` about courses, and add three keys**

Three changes here. The middle one is a bug fix, not a feature.

Add these entries to the `CtaKey` union (line 16):

```ts
  | 'register_now'
  | 'sit_in_on_a_class'
  | 'batch_enquiry'
```

and the matching messages to `MESSAGES` (line 27). While you are there, **export `MESSAGES`** — Task 9 reads `batch_enquiry` from it so the enquiry form's opening line is not a second copy of the same sentence:

```ts
export const MESSAGES: Record<CtaKey, string> = {
  // ...existing nine entries unchanged...
  register_now: 'Hi VPro Skills, I want to register for the next batch.',
  sit_in_on_a_class: 'Hi VPro Skills, I would like to sit in on a live class.',
  batch_enquiry: 'Hi VPro Skills, I would like to enquire about a batch.',
}
```

Now replace `whatsappUrl` (lines 39–43). Today it appends `I am a ${segment}.`, so a *course* passed as the segment produces "I am a Agentic AI." The redesign sends a course name from the shelf, the course page and the schedule, so the two need separate slots:

```ts
/** The one place a wa.me URL is built. */
export function whatsappRawUrl(message: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`
}

// `segment` is who the visitor is ("working professional"). `course` is what
// they are asking about. They were one argument, which meant a course name
// arrived in a sentence reading "I am a Agentic AI."
export function whatsappUrl(key: CtaKey, segment?: string, course?: string): string {
  const parts = [MESSAGES[key]]
  if (course) parts.push(`Course: ${course}.`)
  if (segment) parts.push(`I am a ${segment}.`)
  return whatsappRawUrl(parts.join(' '))
}
```

`whatsappRawUrl` exists for the enquiry form in Task 9, whose message is composed field by field rather than picked from `MESSAGES`. Without it that form would hand-roll a `wa.me` URL at the call site, which the Global Constraints forbid.

- [ ] **Step 2b: Pass `course` through `web/src/components/CtaLink.tsx`**

Add `course?: string` to `Props`, accept it in the signature, and forward it to both the URL and the lead:

```tsx
interface Props {
  cta: CtaKey
  chapter: string
  segment?: string
  course?: string
  children: ReactNode
  className?: string
  magnetic?: boolean
}

export default function CtaLink({ cta, chapter, segment, course, children, className = '', magnetic = false }: Props) {
  const anchor = (
    <a
      href={whatsappUrl(cta, segment, course)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => captureLead({ cta, chapter, segment, course })}
    >
      {children}
    </a>
  )

  return magnetic ? <Magnetic>{anchor}</Magnetic> : anchor
}
```

Add `course?: string` to the payload type in `web/src/services/leadsService.ts` so this type-checks. (`magnetic` and the `Magnetic` import survive until Task 11 removes them.)

- [ ] **Step 3: Create `web/src/components/Ticker.tsx`**

```tsx
interface Props {
  items: string[]
}

// The course names, drifting. Duplicated once so the loop has no visible seam.
export default function Ticker({ items }: Props) {
  const doubled = [...items, ...items]
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-[color:var(--rule)] py-5"
    >
      <div className="flex w-max animate-[ticker_48s_linear_infinite] gap-16 motion-reduce:animate-none">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="display shrink-0 text-[clamp(1.4rem,2.4vw,2rem)] text-[color:var(--on-ink-faint)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
```

Add the keyframes to the end of the `[data-journey]` block in `web/src/index.css`:

```css
@keyframes ticker {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
```

- [ ] **Step 4: Create `web/src/components/NextBatchesCard.tsx`**

Renders only what the API actually returns. There is no seat column in the database, so no seat language appears here.

```tsx
import { Link } from 'react-router-dom'
import CtaLink from './CtaLink'
import { nowInIst, useSchedule } from '../utils/schedule'
import type { ScheduleRow } from '../utils/schedule'

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
}

function hourWindow(row: ScheduleRow): string {
  return `${row.batch.start_time.slice(0, 5)} – ${row.batch.end_time.slice(0, 5)}`
}

// The schedule classifies in IST, so this must too - otherwise a visitor
// abroad sees a different set of batches from the one the schedule means.
// `state === 'today'` covers both "starts today" and "a session runs later
// today in a batch that began weeks ago", so the start date settles which.
function istTodayIso(): string {
  const { date } = nowInIst()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export default function NextBatchesCard() {
  const { rows, liveNow } = useSchedule()
  const today = istTodayIso()
  const upcoming = (rows ?? []).filter(
    (row) =>
      row.state === 'upcoming' || (row.state === 'today' && row.batch.start_date === today),
  )

  if (!rows) return null

  // Nothing scheduled and nothing on air: render no card at all rather than an
  // empty bordered box. The hero's copy stands on its own.
  if (upcoming.length === 0 && !liveNow) return null

  return (
    <div className="bg-[color:var(--ink-2)] p-8 shadow-[inset_0_0_0_1px_var(--rule)] lg:p-10">
      {upcoming.length > 0 && (
        <>
          <p className="eyebrow">Next batches</p>
          <ul className="mt-6 space-y-8">
            {upcoming.slice(0, 2).map((row) => (
              <li key={row.batch.id} className="border-b border-[color:var(--rule)] pb-8">
                <p className="display text-[1.35rem]">{row.batch.course_name}</p>
                <p className="mono mt-2 text-[color:var(--on-ink-faint)]">
                  Starts {longDate(row.batch.start_date)}
                </p>
                <p className="mt-2 text-sm text-[color:var(--on-ink-mute)]">
                  {row.batch.batch_number} · {hourWindow(row)} IST · {row.batch.trainer_name}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <CtaLink
                    cta="register_now"
                    chapter="hero"
                    course={row.batch.course_name}
                    className="btn-primary"
                  >
                    Register now
                  </CtaLink>
                  <Link to="/batches" className="btn-secondary">
                    All batches
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {liveNow && (
        <div className={upcoming.length > 0 ? 'mt-8' : ''}>
          <p className="eyebrow">On air now</p>
          <p className="display mt-3 text-[1.35rem]">{liveNow.batch.course_name}</p>
          <p className="mt-2 text-sm text-[color:var(--on-ink-mute)]">
            {liveNow.batch.batch_number} · {hourWindow(liveNow)} IST · {liveNow.batch.trainer_name}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/courses" className="btn-primary">
              View this course
            </Link>
            <CtaLink
              cta="sit_in_on_a_class"
              chapter="hero"
              course={liveNow.batch.course_name}
              className="btn-secondary"
            >
              Sit in on a class
            </CtaLink>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `web/src/sections/home/Hero.tsx`**

```tsx
import { PLATFORM, HERO_FACTS } from '../../content/platform'
import HeroScope from '../../motion/HeroScope'
import Reveal from '../../motion/Reveal'
import NextBatchesCard from '../../components/NextBatchesCard'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <HeroScope />
      <div className="shell relative grid items-center gap-14 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
        <div>
          <Reveal>
            <p className="eyebrow">{PLATFORM.eyebrow}</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <h1 className="display mt-7 text-[clamp(2.6rem,6vw,4.6rem)]">
              {PLATFORM.headlineLead}
              <br />
              <em>{PLATFORM.headlineEmphasis}</em>
            </h1>
          </Reveal>
          <Reveal delayIndex={2}>
            <p className="lede mt-8 max-w-[42ch]">{PLATFORM.sub}</p>
          </Reveal>
          <Reveal delayIndex={3}>
            <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-10 gap-y-8 border-t border-[color:var(--rule)] pt-8">
              {HERO_FACTS.map((fact) => (
                <div key={fact.k}>
                  <dt className="mono text-[color:var(--on-ink-faint)]">{fact.k}</dt>
                  <dd className="display mt-2 text-[1.05rem]">{fact.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delayIndex={1}>
          <NextBatchesCard />
        </Reveal>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Wire the hero into the home page temporarily**

Replace the whole body of `web/src/pages/HomePage.tsx` so the hero can be seen. Task 7 replaces this file again with the full section list.

```tsx
import ScrollProgress from '../motion/ScrollProgress'
import Ticker from '../components/Ticker'
import Hero from '../sections/home/Hero'
import { COURSES } from '../content/courses'

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <Ticker items={COURSES.map((course) => course.name)} />
    </>
  )
}
```

- [ ] **Step 7: Verify**

Run: `cd web && npx tsc -b --noEmit && npx oxlint src`
Expected: clean, apart from any error in a file Task 11 deletes. If `HomePage.tsx` now has unused imports flagged, remove them.

Run the backend (`cd backend && source .venv/bin/activate && uvicorn app.main:app --reload`) and `cd web && npm run dev`, then open `http://localhost:5173/`.
Expected: dark hero, serif headline with "is a recording." in copper italic, sine traces drifting behind it, the batches card populated from real data, the ticker scrolling below.

- [ ] **Step 8: Commit**

```bash
git add web/src/content/platform.ts web/src/content/contact.ts web/src/components/Ticker.tsx web/src/components/NextBatchesCard.tsx web/src/sections/home/Hero.tsx web/src/pages/HomePage.tsx web/src/index.css
git commit -m "The hero: one fixed sentence, real batches, and the scope behind it"
```

---

### Task 6: The course shelf

Six courses as spines; one open. Below `md` it stacks, which the comp does not solve.

**Files:**
- Create: `web/src/components/CourseShelf.tsx`
- Create: `web/src/sections/home/Batches.tsx`

**Interfaces:**
- Consumes: `COURSES` from `web/src/content/courses.ts` (each has `slug`, `hue`, `name`, `tagline`, `modules`), `courseStateFor` / `courseStateNote` (Task 1), `useSchedule`, `CtaLink`, `Reveal`.
- Produces: `<CourseShelf />`; `<Batches />`.

- [ ] **Step 1: Create `web/src/components/CourseShelf.tsx`**

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import { courseStateFor, courseStateNote } from '../utils/courseState'
import { useSchedule } from '../utils/schedule'
import CtaLink from './CtaLink'

// One lightness family across all six, so the shelf reads as one object rather
// than six unrelated colours. Hue comes from each course's own `hue` field.
const openBg = (hue: number) => `oklch(0.44 0.086 ${hue})`
const closedBg = (hue: number) => `oklch(0.288 0.045 ${hue})`

export default function CourseShelf() {
  // A single index, so exactly one spine is open at any time and hover, focus
  // and click cannot disagree about which one it is.
  const [open, setOpen] = useState(0)
  const { rows } = useSchedule()

  return (
    <>
      {/* Desktop: spines. A row of six vertical spines is unusable on a phone,
          so below md the same data renders as a plain stack (further down). */}
      <div className="hidden h-[560px] gap-1 md:flex">
        {COURSES.map((course, index) => {
          const isOpen = index === open
          // Null while loading and when the fetch fails. Claiming "Gathering
          // interest" on absent data would state as fact something we do not know.
          const state = rows ? courseStateFor(course.name, rows) : null
          const note = courseStateNote(course.name, rows)
          const inSession = state === 'In session'

          return (
            <div
              key={course.slug}
              className="relative overflow-hidden transition-[flex-grow] duration-700 ease-[var(--ease-reveal)] motion-reduce:transition-none"
              style={{
                flexGrow: isOpen ? 7.2 : 1,
                flexBasis: 0,
                background: isOpen ? openBg(course.hue) : closedBg(course.hue),
                boxShadow: `inset 0 0 0 1px rgb(237 231 222 / ${isOpen ? 0.28 : 0.12})`,
              }}
              onMouseEnter={() => setOpen(index)}
              onFocusCapture={() => setOpen(index)}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`shelf-panel-${course.slug}`}
                aria-label={state ? `${course.name}, ${state}` : course.name}
                onClick={() => setOpen(index)}
                className={
                  isOpen
                    ? 'mono absolute left-10 top-10 z-10 text-[color:var(--on-ink)]'
                    : 'flex h-full w-full items-end justify-center pb-8'
                }
              >
                {isOpen ? (
                  state
                ) : (
                  <span
                    className="display whitespace-nowrap text-[1.4rem] text-[color:var(--on-ink)]"
                    style={{ writingMode: 'vertical-rl', rotate: '180deg' }}
                  >
                    {course.name}
                  </span>
                )}
              </button>

              <div
                id={`shelf-panel-${course.slug}`}
                className={isOpen ? 'flex h-full flex-col justify-end p-10' : 'hidden'}
              >
                <div>
                  <h3 className="display text-[clamp(1.8rem,3vw,2.6rem)]">{course.name}</h3>
                  <p className="lede mt-4 max-w-[46ch]">{course.tagline}</p>
                  <p className="mono mt-5 text-[color:var(--on-ink-mute)]">
                    {course.modules.map((module) => module.name).join(' · ')}
                  </p>
                  {note && (
                    <p className="mt-4 text-sm text-[color:var(--on-ink-mute)]">{note}</p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link to={`/courses/${course.slug}`} className="btn-secondary">
                      View curriculum
                    </Link>
                    <CtaLink
                      cta={inSession ? 'reserve_seat' : 'course_waitlist'}
                      chapter="shelf"
                      course={course.name}
                      className="btn-primary"
                    >
                      {inSession ? 'Reserve my seat' : 'Register interest'}
                    </CtaLink>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Phone: a stack. */}
      <div className="space-y-3 md:hidden">
        {COURSES.map((course) => {
          // Null while loading and when the fetch fails. Claiming "Gathering
          // interest" on absent data would state as fact something we do not know.
          const state = rows ? courseStateFor(course.name, rows) : null
          const inSession = state === 'In session'
          return (
            <div
              key={course.slug}
              className="p-7"
              style={{
                background: closedBg(course.hue),
                boxShadow: 'inset 0 0 0 1px rgb(237 231 222 / 0.12)',
              }}
            >
              {state && <p className="mono text-[color:var(--on-ink-faint)]">{state}</p>}
              <h3 className="display mt-3 text-[1.6rem]">{course.name}</h3>
              <p className="lede mt-3 text-[1rem]">{course.tagline}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/courses/${course.slug}`} className="btn-secondary">
                  View curriculum
                </Link>
                <CtaLink
                  cta={inSession ? 'reserve_seat' : 'course_waitlist'}
                  chapter="shelf"
                  course={course.name}
                  className="btn-primary"
                >
                  {inSession ? 'Reserve my seat' : 'Register interest'}
                </CtaLink>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Create `web/src/sections/home/Batches.tsx`**

```tsx
import Reveal from '../../motion/Reveal'
import CourseShelf from '../../components/CourseShelf'

export default function Batches() {
  return (
    <section id="batches" className="shell py-28 lg:py-36">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <h2 className="display text-[clamp(2.2rem,4.4vw,3.4rem)]">Every batch we run.</h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <p className="max-w-[38ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
            A course opens as a live batch when there are enough people to move together —
            register and you hear the moment an hour is fixed.
          </p>
        </Reveal>
      </div>

      <Reveal delayIndex={2} className="mt-14 block">
        <p className="mono mb-4 text-[color:var(--on-ink-faint)]">Click a spine to open it</p>
        <CourseShelf />
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 3: Add it to the home page**

In `web/src/pages/HomePage.tsx`, import `Batches` and render it directly after `<Ticker />`.

- [ ] **Step 4: Verify**

Run: `cd web && npx tsc -b --noEmit && npx oxlint src`
Expected: clean.

In the browser at `http://localhost:5173/`: clicking each spine opens it and closes the previous one. Tab through — every spine takes focus with a visible copper outline and Enter opens it. Narrow the window below 768px: the shelf becomes a readable stack.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/CourseShelf.tsx web/src/sections/home/Batches.tsx web/src/pages/HomePage.tsx
git commit -m "The shelf: six spines, one open, and a stack on phones"
```

---

### Task 7: The remaining home sections

Trainer, tenets, the batch loop, students, FAQ, join, footer, mobile bar.

**Files:**
- Create: `web/src/content/homeSections.ts`
- Create: `web/src/sections/home/Trainer.tsx`
- Create: `web/src/sections/home/Tenets.tsx`
- Create: `web/src/sections/home/BatchLoop.tsx`
- Create: `web/src/sections/home/Students.tsx`
- Create: `web/src/sections/home/Faq.tsx`
- Create: `web/src/sections/home/Join.tsx`
- Create: `web/src/components/MobileActionBar.tsx`
- Modify: `web/src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: `Reveal`, `Accordion`, `useScrollDriver`, `CtaLink`, `TESTIMONIALS` from `web/src/content/testimonials.ts`.
- Produces: `TENETS`, `BATCH_LOOP`, `FAQS`, `TRAINER` from `content/homeSections.ts`; the six section components; `<MobileActionBar />`.

- [ ] **Step 1: Create `web/src/content/homeSections.ts`**

Copy verbatim from the comp — this is approved copy, not a starting point.

```ts
// Copy for the home page's middle sections, taken verbatim from the approved
// comp. Kept as data so a section component carries layout only.

export const TRAINER = {
  eyebrow: 'From the trainer',
  quote:
    'I teach live because the useful half of this work is what happens when it breaks, and a recording cannot look at your screen.',
  body: [
    'Seventeen years building software, cloud systems and enterprise AI. I take the sessions myself — not an assistant, and not last year’s recording.',
    'You get the recordings as well, for the session you had to miss. The recording is the backup. It is not the course.',
  ],
  attribution: 'Sambasiva Rao — trainer',
  photo: '/trainer-sambasiva-rao.webp',
  photoFallback: '/trainer-sambasiva-rao.jpeg',
} as const

export const TENETS = [
  {
    n: '01',
    k: 'The hour does not move',
    v: 'A batch has one fixed time. That constraint is what makes everything else work — and the reason we tell people who cannot hold it not to enrol.',
  },
  {
    n: '02',
    k: 'You ask while it is happening',
    v: 'When your model trains and predicts nothing, somebody looks at your screen there and then. Not in a comment box the next morning.',
  },
  {
    n: '03',
    k: 'The recording is only a backup',
    v: 'You get it, for the session you had to miss. It is not the course, and we do not sell it as one.',
  },
] as const

export const BATCH_LOOP = [
  {
    n: '01',
    title: 'The topic, live',
    body: 'A fixed hour with the trainer in the room. Topics arrive in order, so the thing you need next is the thing being taught.',
  },
  {
    n: '02',
    title: 'One attempt',
    body: 'The topic ends in an assessment you get one attempt at. Nothing to retake until the number looks better.',
  },
  {
    n: '03',
    title: 'The answer, beside yours',
    body: 'Your result is there the moment you submit, with the answer you chose sitting next to the one that was correct.',
  },
  {
    n: '04',
    title: 'On the record',
    body: 'Every attempt stays in your history, so by the end you can see what you knew and where you were wrong.',
  },
] as const

export const FAQS = [
  {
    q: 'What happens if I miss a session?',
    a: 'You get the recording for that session, and you can ask about it in the next class. The recording is a backup for a session you missed — it is not a substitute for attending.',
  },
  {
    q: 'Do I need programming experience?',
    a: 'Not for Agentic AI, Python Full Stack, Java Full Stack or .NET Full Stack — all four start from first principles. Forward Deployment Engineer and Quantum Computing assume you can already write basic code.',
  },
  {
    q: 'What does it cost, and can I pay in instalments?',
    a: 'We share the fee and the payment options on WhatsApp or on the call, after you have seen the demo class. Nothing is taken before then.',
  },
  {
    q: 'Is this online or classroom?',
    a: 'Both work. Sessions run live at a fixed hour and you can attend from Ameerpet or join online — the same class either way.',
  },
  {
    q: 'Do you guarantee placement?',
    a: 'No. We provide placement support — interview preparation, project review, and help presenting your work. Anyone guaranteeing a job is selling you something else.',
  },
  {
    q: 'What if no batch hour suits me?',
    a: 'Tell us the hours you can hold. Batches open when enough people can move together, so your constraint is genuinely useful information to us.',
  },
  {
    q: 'Do I get a certificate?',
    a: 'Yes, on completion of the course and its assessments.',
  },
] as const
```

- [ ] **Step 2: Create `web/src/sections/home/Trainer.tsx`**

The portrait parallax uses the shared scroll driver.

```tsx
import { useEffect, useRef } from 'react'
import { TRAINER } from '../../content/homeSections'
import Reveal from '../../motion/Reveal'
import { useScrollDriver } from '../../motion/useScrollDriver'
import { prefersReducedMotion } from '../../motion/prefersReducedMotion'

export default function Trainer() {
  const ref = useRef<HTMLImageElement | null>(null)
  const metricsRef = useRef({ top: 0, height: 0 })

  useEffect(() => {
    const measure = () => {
      const node = ref.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      metricsRef.current = {
        top: rect.top + window.scrollY,
        height: rect.height,
      }
    }

    measure()
    window.addEventListener('resize', measure)
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => measure())
    observer?.observe(document.body)

    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [])

  useScrollDriver((scrollY) => {
    const node = ref.current
    if (!node) return
    if (prefersReducedMotion()) {
      node.style.transform = ''
      return
    }
    const { top, height } = metricsRef.current
    const viewportTop = top - scrollY
    if (viewportTop + height <= 0 || viewportTop >= window.innerHeight) return
    const centre = (viewportTop + height / 2 - window.innerHeight / 2) / window.innerHeight
    node.style.transform = `translateY(${(centre * -26).toFixed(2)}px) scale(1.06)`
  })

  return (
    <section id="trainer" className="shell py-24 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20">
        <Reveal className="overflow-hidden">
          <picture>
            <source srcSet={TRAINER.photo} type="image/webp" />
            <img
              ref={ref}
              src={TRAINER.photoFallback}
              alt="Sambasiva Rao, the trainer"
              width={760}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover will-change-transform"
            />
          </picture>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow">{TRAINER.eyebrow}</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <blockquote className="display mt-6 text-[clamp(1.5rem,2.6vw,2.1rem)]">
              {TRAINER.quote}
            </blockquote>
          </Reveal>
          {TRAINER.body.map((paragraph, index) => (
            <Reveal key={paragraph} delayIndex={index + 2}>
              <p className="mt-6 max-w-[56ch] text-[0.98rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                {paragraph}
              </p>
            </Reveal>
          ))}
          <Reveal delayIndex={2}>
            <p className="mono mt-8 text-[color:var(--on-ink-faint)]">{TRAINER.attribution}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create `web/src/sections/home/Tenets.tsx`**

```tsx
import { TENETS } from '../../content/homeSections'
import Reveal from '../../motion/Reveal'

export default function Tenets() {
  return (
    <section className="shell py-28 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
        <div>
          <Reveal>
            <p className="eyebrow">What live means here</p>
          </Reveal>
          <Reveal delayIndex={1}>
            <h2 className="display mt-6 max-w-[16ch] text-[clamp(2.1rem,4vw,3.1rem)]">
              Three things we will not move
            </h2>
          </Reveal>
          <Reveal delayIndex={2}>
            <p className="mt-7 max-w-[38ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              Every course on the internet uses the word live. These are the three commitments
              that make it true here.
            </p>
          </Reveal>
        </div>

        <dl>
          {TENETS.map((tenet, index) => (
            <Reveal key={tenet.n} delayIndex={index} className="block">
              <div className="grid grid-cols-[auto_1fr] gap-x-7 border-t border-[color:var(--rule)] py-8">
                <span className="display text-[1.7rem] text-[color:var(--signal)]">{tenet.n}</span>
                <div>
                  <dt className="display text-[1.2rem]">{tenet.k}</dt>
                  <dd className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                    {tenet.v}
                  </dd>
                </div>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `web/src/sections/home/BatchLoop.tsx`**

```tsx
import { useState } from 'react'
import { BATCH_LOOP } from '../../content/homeSections'
import Accordion from '../../components/Accordion'
import Reveal from '../../motion/Reveal'

export default function BatchLoop() {
  const [open, setOpen] = useState(0)

  return (
    <section id="loop" className="shell py-28 lg:py-36">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <p className="eyebrow">How a batch runs</p>
          <h2 className="display mt-6 max-w-[14ch] text-[clamp(2.2rem,4.4vw,3.4rem)]">
            Four steps, repeated per topic.
          </h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <p className="max-w-[36ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
            A filling progress bar feels exactly like learning right up until somebody asks you a
            question. So we ask. Open a step to see it.
          </p>
        </Reveal>
      </div>

      <Accordion
        className="mt-14"
        openIndex={open}
        onToggle={setOpen}
        items={BATCH_LOOP.map((step, index) => ({
          id: step.n,
          heading: (
            <span className="flex items-baseline gap-8">
              <span
                className="display text-[1.9rem]"
                style={{
                  color: index === open ? 'var(--signal)' : 'var(--on-ink-faint)',
                }}
              >
                {step.n}
              </span>
              <span
                className="display text-[1.25rem]"
                style={{
                  color: index === open ? 'var(--on-ink)' : 'var(--on-ink-faint)',
                }}
              >
                {step.title}
              </span>
            </span>
          ),
          body: (
            <p className="max-w-[62ch] pl-[4.4rem] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              {step.body}
            </p>
          ),
        }))}
      />
    </section>
  )
}
```

- [ ] **Step 5: Create `web/src/sections/home/Students.tsx`**

```tsx
import { TESTIMONIALS } from '../../content/testimonials'
import Reveal from '../../motion/Reveal'

export default function Students() {
  return (
    <section id="students" className="shell py-28 lg:py-36">
      <Reveal>
        <p className="eyebrow">From students</p>
      </Reveal>
      <Reveal delayIndex={1}>
        <h2 className="display mt-6 text-[clamp(2.2rem,4.4vw,3.4rem)]">What they said after.</h2>
      </Reveal>

      <div className="mt-14 grid gap-px bg-[color:var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <Reveal key={testimonial.name} delayIndex={index} className="bg-[color:var(--ink)] p-9">
            <blockquote className="display text-[1.15rem] leading-snug">
              “{testimonial.quote}”
            </blockquote>
            <p className="mono mt-7 text-[color:var(--on-ink)]">{testimonial.name}</p>
            <p className="mono mt-1 text-[color:var(--on-ink-faint)]">{testimonial.role}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

`Testimonial` is `{ quote: string; name: string; role: string }` — verified, no adaptation needed. There are no photographs for these students, which is why they render as editorial quotes with the name set in type rather than as avatar cards.

- [ ] **Step 6: Create `web/src/sections/home/Faq.tsx`**

The FAQ allows all items closed; the batch loop does not.

```tsx
import { useState } from 'react'
import { FAQS } from '../../content/homeSections'
import Accordion from '../../components/Accordion'
import Reveal from '../../motion/Reveal'
import CtaLink from '../../components/CtaLink'

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="shell py-28 lg:py-36">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <p className="eyebrow">Frequently asked questions</p>
          <h2 className="display mt-6 text-[clamp(2.2rem,4.4vw,3.4rem)]">
            The questions we answer on every call.
          </h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <div className="max-w-[34ch]">
            <p className="text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              If yours is not here, send it. A person replies, usually within the hour during
              working hours.
            </p>
            <CtaLink cta="talk_to_trainer" chapter="faq" className="btn-secondary mt-6">
              Ask your question
            </CtaLink>
          </div>
        </Reveal>
      </div>

      <Accordion
        className="mt-14"
        openIndex={open}
        onToggle={(index) => setOpen(index === open ? -1 : index)}
        items={FAQS.map((faq, index) => ({
          id: `faq-${index}`,
          heading: <span className="display text-[1.15rem]">{faq.q}</span>,
          body: (
            <p className="max-w-[68ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
              {faq.a}
            </p>
          ),
        }))}
      />
    </section>
  )
}
```

- [ ] **Step 7: Create `web/src/sections/home/Join.tsx`**

```tsx
import Reveal from '../../motion/Reveal'
import CtaLink from '../../components/CtaLink'

export default function Join() {
  return (
    <section id="join" className="shell py-32 lg:py-40">
      <Reveal>
        <p className="eyebrow">Free demo class · no fee to attend</p>
      </Reveal>
      <Reveal delayIndex={1}>
        <h2 className="display mt-7 max-w-[18ch] text-[clamp(2.6rem,6vw,4.4rem)]">
          Attend a free demo class before you enrol.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <Reveal delayIndex={2}>
          <p className="lede max-w-[44ch]">
            You attend a real session, not a sales presentation. Ask questions, watch something
            break and get fixed, and decide afterwards. Nothing is charged before that.
          </p>
        </Reveal>
        <Reveal delayIndex={0} className="flex flex-wrap gap-4 lg:justify-end">
          <CtaLink cta="hero_demo" chapter="join" className="btn-primary">
            Book a free demo
          </CtaLink>
          <CtaLink cta="footer_whatsapp" chapter="join" className="btn-secondary">
            WhatsApp us
          </CtaLink>
        </Reveal>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Create `web/src/components/MobileActionBar.tsx`**

It duplicates the hero's own buttons, so it stays hidden until the hero is gone.

```tsx
import { useEffect, useState } from 'react'
import CtaLink from './CtaLink'
import { prefersReducedMotion } from '../motion/prefersReducedMotion'

export default function MobileActionBar() {
  const [reduced] = useState(prefersReducedMotion)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('top')
    if (!hero || typeof IntersectionObserver === 'undefined') return

    // Whether the hero is still on screen is a threshold question, so let the
    // browser answer it. The previous version queried the DOM and read
    // offsetHeight on every scroll frame to work out the same thing.
    const observer = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting),
      { rootMargin: '0px' },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      inert={!shown}
      aria-hidden={!shown}
      className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-2 lg:hidden"
      style={{
        transform: shown ? 'translateY(0)' : 'translateY(100%)',
        // The bar still appears and hides under reduced motion - it is a
        // control, not decoration. Only the slide is dropped.
        transition: reduced ? undefined : 'transform 420ms cubic-bezier(0.22,1,0.28,1)',
      }}
    >
      <CtaLink cta="hero_demo" chapter="mobile_bar" className="btn-primary">
        Free demo
      </CtaLink>
      <CtaLink cta="footer_whatsapp" chapter="mobile_bar" className="btn-secondary">
        WhatsApp
      </CtaLink>
    </div>
  )
}
```

- [ ] **Step 9: Assemble `web/src/pages/HomePage.tsx`**

```tsx
import ScrollProgress from '../motion/ScrollProgress'
import MobileActionBar from '../components/MobileActionBar'
import Ticker from '../components/Ticker'
import Hero from '../sections/home/Hero'
import Batches from '../sections/home/Batches'
import Trainer from '../sections/home/Trainer'
import Tenets from '../sections/home/Tenets'
import BatchLoop from '../sections/home/BatchLoop'
import Students from '../sections/home/Students'
import Faq from '../sections/home/Faq'
import Join from '../sections/home/Join'
import { COURSES } from '../content/courses'

// Section order follows the order a student's questions actually arrive in:
// is anything running, who teaches me, how is this different from a recording,
// what does a batch feel like, has it worked for anyone, what am I still
// unsure about, how do I start.
export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <Ticker items={COURSES.map((course) => course.name)} />
      <Batches />
      <Trainer />
      <Tenets />
      <BatchLoop />
      <Students />
      <Faq />
      <Join />
      <MobileActionBar />
    </>
  )
}
```

- [ ] **Step 10: Verify**

Run: `cd web && npx tsc -b --noEmit && npx oxlint src`
Expected: clean.

In the browser: scroll the whole page. Every section fades up once. The progress bar tracks. The portrait drifts. Past the hero on a narrow window, the mobile bar slides up. Both accordions open and close; the FAQ can be fully closed, the loop cannot. Enable "Reduce motion" in macOS System Settings and reload: the canvas is a single static frame and nothing animates in.

- [ ] **Step 11: Commit**

```bash
git add web/src/content/homeSections.ts web/src/sections/home web/src/components/MobileActionBar.tsx web/src/pages/HomePage.tsx
git commit -m "The rest of the home page: trainer, tenets, the loop, students, FAQ, join"
```

---

### Task 8: The course page

**Files:**
- Modify: `web/src/pages/CourseDetailPage.tsx` (rewrite)

**Interfaces:**
- Consumes: `COURSES` from `content/courses.ts`, `courseStateFor` / `courseStateNote`, `useSchedule`, `Reveal`, `ScrollProgress`, `CtaLink`.

- [ ] **Step 1: Rewrite `web/src/pages/CourseDetailPage.tsx`**

The curriculum heading counts modules rather than hardcoding "Six" — not every course has six.

```tsx
import { useParams, Navigate, Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import { courseStateFor, courseStateNote } from '../utils/courseState'
import { useSchedule } from '../utils/schedule'
import ScrollProgress from '../motion/ScrollProgress'
import Reveal from '../motion/Reveal'
import CtaLink from '../components/CtaLink'

const COUNT_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

function moduleHeading(count: number): string {
  const word = COUNT_WORDS[count] ?? String(count)
  return `${word} modules, in order.`
}

export default function CourseDetailPage() {
  const { slug } = useParams()
  const { rows } = useSchedule()
  const course = COURSES.find((entry) => entry.slug === slug)

  if (!course) return <Navigate to="/courses" replace />

  const state = courseStateFor(course.name, rows)
  const note = courseStateNote(course.name, rows)
  const inSession = state === 'In session'

  const facts = [
    { k: 'Level', v: course.level },
    { k: 'Prerequisites', v: course.prerequisites },
    { k: 'Format', v: inSession ? 'Live, at a fixed hour' : 'Live, hour fixed when the batch opens' },
    { k: 'Trainer', v: 'Sambasiva Rao' },
  ]

  return (
    <>
      <ScrollProgress />

      <section className="shell py-24 lg:py-32">
        <Reveal>
          <p className="eyebrow">{state}</p>
        </Reveal>
        <Reveal delayIndex={1}>
          <h1 className="display mt-6 text-[clamp(2.6rem,6vw,4.4rem)]">{course.name}</h1>
        </Reveal>
        <Reveal delayIndex={2}>
          <p className="lede mt-6 max-w-[52ch]">{course.summary}</p>
        </Reveal>
        {note && (
          <Reveal delayIndex={0}>
            <p className="mono mt-6 text-[color:var(--on-ink-faint)]">{note}</p>
          </Reveal>
        )}

        <Reveal delayIndex={1}>
          <dl className="mt-12 grid gap-x-10 gap-y-8 border-t border-[color:var(--rule)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.k}>
                <dt className="mono text-[color:var(--on-ink-faint)]">{fact.k}</dt>
                <dd className="mt-2 text-[0.98rem] text-[color:var(--on-ink)]">{fact.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delayIndex={2}>
          <div className="mt-10 flex flex-wrap gap-4">
            <CtaLink
              cta={inSession ? 'reserve_seat' : 'course_waitlist'}
              chapter="course_hero"
              course={course.name}
              className="btn-primary"
            >
              {inSession ? 'Reserve my seat' : 'Register interest'}
            </CtaLink>
            <Link to="/batches" className="btn-secondary">
              See the schedule
            </Link>
          </div>
        </Reveal>
      </section>

      <section id="curriculum" className="shell py-24 lg:py-28">
        <Reveal>
          <p className="eyebrow">Curriculum</p>
          <h2 className="display mt-6 text-[clamp(2.1rem,4vw,3.1rem)]">
            {moduleHeading(course.modules.length)}
          </h2>
        </Reveal>

        <div className="mt-14">
          {course.modules.map((module, index) => (
            <Reveal key={module.order} delayIndex={index} className="block">
              <article className="grid gap-6 border-t border-[color:var(--rule)] py-9 lg:grid-cols-[auto_1fr_1fr] lg:gap-12">
                <span className="display text-[1.7rem] text-[color:var(--signal)]">
                  {String(module.order).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="display text-[1.25rem]">{module.name}</h3>
                  <p className="mt-3 max-w-[46ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                    {module.summary}
                  </p>
                </div>
                <div>
                  {/* `builds` is optional on CourseModule - a few modules have
                      no single artefact, and an empty "You build" reads worse
                      than no heading at all. */}
                  {module.builds && (
                    <>
                      <p className="mono text-[color:var(--on-ink-faint)]">You build</p>
                      <p className="mt-2 text-[0.95rem] text-[color:var(--on-ink)]">
                        {module.builds}
                      </p>
                    </>
                  )}
                  <p className={`mono text-[color:var(--on-ink-faint)] ${module.builds ? 'mt-5' : ''}`}>
                    {module.topics.join(' · ')}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="projects" className="shell py-24 lg:py-28">
        <Reveal>
          <p className="eyebrow">What you leave with</p>
          <h2 className="display mt-6 text-[clamp(2.1rem,4vw,3.1rem)]">
            Things that exist afterwards.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px bg-[color:var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
          {course.projects.map((project, index) => (
            <Reveal key={project.name} delayIndex={index} className="bg-[color:var(--ink)] p-8">
              <h3 className="display text-[1.15rem]">{project.name}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                {project.description}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="enrol" className="shell py-32">
        <Reveal>
          <h2 className="display max-w-[18ch] text-[clamp(2.2rem,4.6vw,3.6rem)]">
            {inSession ? 'This batch is running now.' : 'Tell us you want this one.'}
          </h2>
        </Reveal>
        <Reveal delayIndex={1}>
          <div className="mt-10 flex flex-wrap gap-4">
            <CtaLink
              cta={inSession ? 'reserve_seat' : 'course_waitlist'}
              chapter="course_enrol"
              course={course.name}
              className="btn-primary"
            >
              {inSession ? 'Reserve my seat' : 'Register interest'}
            </CtaLink>
            <CtaLink cta="hero_demo" chapter="course_enrol" className="btn-secondary">
              Book a free demo
            </CtaLink>
          </div>
        </Reveal>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Verify**

Run: `cd web && npx tsc -b --noEmit && npx oxlint src`
Expected: clean. `CourseContent` provides `level`, `prerequisites`, `summary`, `modules` and `projects` exactly as used above — verified against `web/src/content/courses.ts:26-42`. Its `forWhom`, `outcomes` and `techs` fields are deliberately unused on this page; `forWhom` returns in the notes round.

In the browser, visit `/courses/agentic-ai` (should read "In session" if a live batch exists) and `/courses/quantum-computing` (should read "Gathering interest", with no state note and a "Register interest" CTA). Confirm the curriculum heading matches each course's real module count.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/CourseDetailPage.tsx
git commit -m "The course page: curriculum, projects, and a heading that counts"
```

---

### Task 9: The batches page and enquiry form

**Files:**
- Create: `web/src/utils/enquiry.ts`
- Create: `web/src/utils/enquiry.test.ts`
- Create: `web/src/components/EnquiryForm.tsx`
- Modify: `web/src/pages/BatchesPage.tsx` (replace the Task 2 placeholder)

**Interfaces:**
- Produces: `composeEnquiry(fields: EnquiryFields): string` where `EnquiryFields = { name: string; phone: string; batch: string; background?: string }`; `<EnquiryForm batchOptions: string[] />`.

- [ ] **Step 1: Write the failing test**

Create `web/src/utils/enquiry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { composeEnquiry } from './enquiry'
import { MESSAGES } from '../content/contact'

describe('composeEnquiry', () => {
  it('opens with the shared batch_enquiry line, then one field per line', () => {
    expect(
      composeEnquiry({ name: 'Asha', phone: '9876543210', batch: 'Agentic AI — Batch A-04' }),
    ).toBe(
      `${MESSAGES.batch_enquiry}\n` +
        'Name: Asha\n' +
        'Phone: 9876543210\n' +
        'Batch: Agentic AI — Batch A-04',
    )
  })

  it('appends the background line only when one was given', () => {
    const message = composeEnquiry({
      name: 'Asha',
      phone: '9876543210',
      batch: 'Agentic AI',
      background: 'Working, switching from testing',
    })
    expect(message.endsWith('\nAbout me: Working, switching from testing')).toBe(true)
  })

  it('omits the background line when it is blank or whitespace', () => {
    expect(composeEnquiry({ name: 'A', phone: '1', batch: 'B', background: '   ' })).not.toContain(
      'About me',
    )
  })

  it('trims each field so stray spaces never reach WhatsApp', () => {
    expect(composeEnquiry({ name: '  Asha  ', phone: ' 98 ', batch: ' B ' })).toContain(
      'Name: Asha\nPhone: 98\nBatch: B',
    )
  })

  it('substitutes an em dash for a field left empty', () => {
    expect(composeEnquiry({ name: '', phone: '9876543210', batch: 'B' })).toContain('Name: —')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run src/utils/enquiry.test.ts`
Expected: FAIL — `Failed to resolve import "./enquiry"`.

- [ ] **Step 3: Write the implementation**

Create `web/src/utils/enquiry.ts`:

```ts
import { MESSAGES } from '../content/contact'

export interface EnquiryFields {
  name: string
  phone: string
  batch: string
  background?: string
}

// The enquiry form is a WhatsApp composer, not a form submission - there is no
// leads endpoint yet. Kept as a pure function so the exact message shape is
// testable without a DOM. The opening line comes from the same MESSAGES map
// every other CTA uses, so there is one place to edit the greeting.
export function composeEnquiry(fields: EnquiryFields): string {
  const value = (input: string | undefined) => input?.trim() || '—'

  const lines = [
    MESSAGES.batch_enquiry,
    `Name: ${value(fields.name)}`,
    `Phone: ${value(fields.phone)}`,
    `Batch: ${value(fields.batch)}`,
  ]

  const background = fields.background?.trim()
  if (background) lines.push(`About me: ${background}`)

  return lines.join('\n')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run`
Expected: PASS, 15 tests across both files.

- [ ] **Step 5: Create `web/src/components/EnquiryForm.tsx`**

A real `<form>`, so browser validation and Enter-to-submit work. The helper text states that sending opens WhatsApp — a form that silently launches another app without saying so is a dark pattern.

```tsx
import { useState, type FormEvent } from 'react'
import { whatsappRawUrl } from '../content/contact'
import { composeEnquiry } from '../utils/enquiry'

const FIELD =
  'w-full min-h-[48px] bg-[color:var(--ink)] px-4 py-3.5 text-base text-[color:var(--on-ink)] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.24)]'
const LABEL = 'mono text-[color:var(--on-ink-faint)]'

export default function EnquiryForm({ batchOptions }: { batchOptions: string[] }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [batch, setBatch] = useState(batchOptions[0] ?? '')
  const [background, setBackground] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const url = whatsappRawUrl(composeEnquiry({ name, phone, batch, background }))
    window.open(url, '_blank', 'noopener')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 bg-[color:var(--ink-2)] p-8 shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)] lg:p-10"
    >
      <label className="grid gap-2">
        <span className={LABEL}>Your name</span>
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Full name"
          className={FIELD}
        />
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Phone</span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Mobile number"
          className={FIELD}
        />
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Which batch</span>
        <select
          value={batch}
          onChange={(event) => setBatch(event.target.value)}
          className={FIELD}
        >
          {batchOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className={LABEL}>Where you are starting from</span>
        <textarea
          rows={3}
          value={background}
          onChange={(event) => setBackground(event.target.value)}
          placeholder="Student, working, switching from another field — and any question you have"
          className={FIELD}
        />
      </label>

      <button type="submit" className="btn-primary mt-1">
        Send my enquiry
      </button>

      <p className="text-sm text-[color:var(--on-ink-faint)]">
        No fee is taken at this stage. Sending this opens WhatsApp with your details filled in.
      </p>
    </form>
  )
}
```

- [ ] **Step 6: Replace `web/src/pages/BatchesPage.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import { useSchedule } from '../utils/schedule'
import { courseStateFor } from '../utils/courseState'
import ScrollProgress from '../motion/ScrollProgress'
import Reveal from '../motion/Reveal'
import CtaLink from '../components/CtaLink'
import EnquiryForm from '../components/EnquiryForm'
import MobileActionBar from '../components/MobileActionBar'
import { BATCH_LOOP } from '../content/homeSections'

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BatchesPage() {
  const { rows, failed } = useSchedule()

  const batchOptions = [
    ...(rows ?? []).map(
      (row) => `${row.batch.course_name} — ${row.batch.batch_number}, ${longDate(row.batch.start_date)}`,
    ),
    ...COURSES.filter((course) => courseStateFor(course.name, rows) === 'Gathering interest').map(
      (course) => `${course.name} — not yet scheduled`,
    ),
    'Not sure yet — please advise',
  ]

  return (
    <>
      <ScrollProgress />

      <section id="top" className="shell py-24 lg:py-32">
        <Reveal>
          <p className="eyebrow">Batch schedule</p>
        </Reveal>
        <Reveal delayIndex={1}>
          <h1 className="display mt-6 text-[clamp(2.6rem,6vw,4.4rem)]">Reserve your seat.</h1>
        </Reveal>
        <Reveal delayIndex={2}>
          <p className="lede mt-6 max-w-[48ch]">
            Every batch we are running or opening, with its hour. Pick one and message us, or send
            your details and we will come back to you.
          </p>
        </Reveal>
      </section>

      <section id="schedule" className="shell py-16 lg:py-20">
        <Reveal>
          <h2 className="display text-[clamp(2rem,3.8vw,2.9rem)]">Every batch, with its hour.</h2>
        </Reveal>

        {failed && (
          <p className="mt-10 text-[0.95rem] text-[color:var(--on-ink-mute)]">
            The schedule is not loading right now. Message us on WhatsApp and we will tell you what
            is running.
          </p>
        )}

        {rows && rows.length === 0 && (
          <p className="mt-10 text-[0.95rem] text-[color:var(--on-ink-mute)]">
            No batch is scheduled at the moment. Send your details below and you will hear the
            moment an hour is fixed.
          </p>
        )}

        {rows && rows.length > 0 && (
          <div className="mt-12">
            {rows.map((row, index) => (
              <Reveal key={row.batch.id} delayIndex={index} className="block">
                <article className="grid gap-4 border-t border-[color:var(--rule)] py-8 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center lg:gap-10">
                  <div>
                    <h3 className="display text-[1.3rem]">{row.batch.course_name}</h3>
                    <p className="mono mt-2 text-[color:var(--on-ink-faint)]">
                      {row.batch.batch_number}
                    </p>
                  </div>
                  <p className="text-[0.95rem] text-[color:var(--on-ink-mute)]">
                    {longDate(row.batch.start_date)} – {longDate(row.batch.end_date)}
                  </p>
                  <p className="text-[0.95rem] text-[color:var(--on-ink-mute)]">
                    {row.batch.start_time.slice(0, 5)} – {row.batch.end_time.slice(0, 5)} IST ·{' '}
                    {row.batch.trainer_name}
                  </p>
                  <CtaLink
                    cta="reserve_seat"
                    chapter="schedule"
                    course={row.batch.course_name}
                    className="btn-primary"
                  >
                    Reserve my seat
                  </CtaLink>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section id="how" className="shell py-24 lg:py-28">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="display mt-6 text-[clamp(2rem,3.8vw,2.9rem)]">Four steps to a seat.</h2>
        </Reveal>

        <ol className="mt-12 grid gap-px bg-[color:var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
          {BATCH_LOOP.map((step, index) => (
            <Reveal key={step.n} delayIndex={index} className="bg-[color:var(--ink)] p-8">
              <span className="display text-[1.7rem] text-[color:var(--signal)]">{step.n}</span>
              <h3 className="display mt-4 text-[1.15rem]">{step.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="enquiry" className="shell py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <p className="eyebrow">Enquiry form</p>
            </Reveal>
            <Reveal delayIndex={1}>
              <h2 className="display mt-6 max-w-[16ch] text-[clamp(2rem,3.8vw,2.9rem)]">
                Send us your details.
              </h2>
            </Reveal>
            <Reveal delayIndex={2}>
              <p className="mt-6 max-w-[40ch] text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                Fill this in and it opens WhatsApp with your details written out, so you are not
                typing them twice. We reply during working hours, usually within the hour.
              </p>
            </Reveal>
            <Reveal delayIndex={0}>
              <Link to="/courses" className="btn-secondary mt-8">
                Browse the courses
              </Link>
            </Reveal>
          </div>

          <Reveal delayIndex={1}>
            <EnquiryForm batchOptions={batchOptions} />
          </Reveal>
        </div>
      </section>

      <MobileActionBar />
    </>
  )
}
```

- [ ] **Step 7: Verify**

Run: `cd web && npx tsc -b --noEmit && npx oxlint src && npx vitest run`
Expected: all clean, 15 tests passing.

In the browser at `/batches`: the schedule lists real batches. Fill the form and submit — a WhatsApp tab opens with all four lines filled in. Submit with an empty name — the browser blocks it and focuses the field. Stop the backend and reload: the "not loading right now" message appears instead of an empty page.

- [ ] **Step 8: Commit**

```bash
git add web/src/utils/enquiry.ts web/src/utils/enquiry.test.ts web/src/components/EnquiryForm.tsx web/src/pages/BatchesPage.tsx
git commit -m "The batches page, and an enquiry form that composes a WhatsApp message"
```

---

### Task 10: Header, footer, and the two retoned pages

**Files:**
- Modify: `web/src/layouts/PublicLayout.tsx`
- Modify: `web/src/pages/CoursesPage.tsx`
- Modify: `web/src/pages/AboutPage.tsx`
- Modify: `web/src/components/FloatingContact.tsx`
- Modify: `web/src/components/CourseCard.tsx`

**Interfaces:**
- Consumes: `courseStateFor` (Task 1), the button classes from Task 2.

- [ ] **Step 1: Rework the header nav in `web/src/layouts/PublicLayout.tsx`**

Replace the `ROUTES` constant (lines 27–30) with:

```tsx
const ROUTES = [
  { to: '/courses', label: 'Courses' },
  { to: '/batches', label: 'Batch schedule' },
  { to: '/about', label: 'About' },
]
```

Delete the `LiveTicker` import and its `{journey && <LiveTicker />}` render — the hero's own `Ticker` replaces it. Delete the `NAV_SECTIONS` / `DEMO_SECTION` / `HOME_JUMPS` block and every reference to it: those anchor jumps pointed at the old section ids, which no longer exist.

Set the journey header class to:

```tsx
  const headerClass = journey
    ? 'sticky top-0 z-40 border-b border-[color:var(--rule)] bg-[color-mix(in_srgb,var(--ink),transparent_12%)] px-[var(--gutter)] py-4 backdrop-blur-md'
    : 'sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur'
```

Give the journey nav links the mono treatment by replacing `railLinkClass`'s body with:

```tsx
    return `mono rounded px-1 py-1 transition-colors ${FOCUS_RING} ${
      isCurrent(to) ? 'text-[color:var(--signal)]' : 'text-[color:var(--on-ink-faint)] hover:text-[color:var(--on-ink)]'
    }`
```

Add a "Reserve my seat" primary CTA to the journey header, to the right of the nav, linking to `/batches`.

In the footer, keep the existing contact block but restyle it: `border-t border-[color:var(--rule)]`, labels in `.mono` at `--on-ink-faint`, values at `--on-ink`. **The logo keeps its bone plate** — it is the only bone fill on the site.

- [ ] **Step 2: Restyle `web/src/components/FloatingContact.tsx`**

Make it the comp's circular WhatsApp button: 56px, `border-radius: 50%`, background `#25D366`, white icon, `box-shadow: 0 2px 8px rgba(0,0,0,0.4)`, `fixed right-6 bottom-6 z-[79]`, `hover:scale-[1.06]` over 200ms. Hide it below `lg` so it cannot collide with `MobileActionBar`.

- [ ] **Step 3: Retone `web/src/pages/CoursesPage.tsx` and `web/src/components/CourseCard.tsx`**

Structure unchanged. Replace light-theme utility classes with the tokens: card background `var(--ink-2)`, `shadow-[inset_0_0_0_1px_var(--rule)]`, headings `.display`, labels `.mono`, body `--on-ink-mute`, buttons `.btn-primary` / `.btn-secondary`. Add a state line per card using `courseStateFor(course.name, rows)`. `CourseCard` keeps its `TechMarks` row.

Both files import `SplitWords`, which Task 11 deletes. Remove the import and render the heading text directly.

- [ ] **Step 4: Retone `web/src/pages/AboutPage.tsx`**

Same treatment, including the `SplitWords` removal. `Prose` keeps its role; give it `.lede` sizing and `--on-ink-mute`. Its steps list keys off `step.order`, which is unchanged.

- [ ] **Step 5: Verify**

Run: `cd web && npx tsc -b --noEmit && npx oxlint src`
Expected: clean.

Walk `/` → `/courses` → `/courses/agentic-ai` → `/batches` → `/about` in the browser. No page flashes light. The header is identical on all five. Then visit `/login` and `/dashboard`: both still light, unchanged.

- [ ] **Step 6: Commit**

```bash
git add web/src/layouts/PublicLayout.tsx web/src/pages/CoursesPage.tsx web/src/pages/AboutPage.tsx web/src/components/FloatingContact.tsx web/src/components/CourseCard.tsx
git commit -m "One dark shell across every public page, and the two retoned pages"
```

---

### Task 11: Delete the old machinery and verify the whole thing

**Files:**
- Delete: 12 components, 5 motion files, 7 sections, 1 hook, 96 image frames
- Modify: `web/package.json`

- [ ] **Step 1: Delete the superseded files**

```bash
cd web/src
rm components/ScrollSequence.tsx components/ScrubStage.tsx components/CourseVScroller.tsx \
   components/WeekBoard.tsx components/ModuleExplorer.tsx components/ModuleVisual.tsx \
   components/SectionRail.tsx components/LiveTicker.tsx
rm motion/StringTuneRuntime.tsx motion/LiveType.tsx motion/SplitWords.tsx \
   motion/Spotlight.tsx motion/Magnetic.tsx
rm sections/CoursesAndSchedule.tsx sections/HowItWorks.tsx \
   sections/Trainer.tsx sections/ForWhom.tsx sections/Join.tsx sections/Section.tsx
rm hooks/useActiveSection.ts
rm content/sections.ts
cd .. && rm -rf public/seq
```

`sections/home/` is untouched — only the flat files directly in `sections/` are removed.

**Left in place on purpose:**
- `web/src/visuals/` — after `ModuleVisual.tsx` goes, the only thing referencing it is the `visual?: VisualKey` type on `CourseModule`. That is a type-only import, erased at build, and nothing imports `registry.ts` at runtime, so the nine files tree-shake out of the bundle. Deleting them properly means editing the `visual:` key out of every module entry in `courses.ts`, which is churn with no shipping benefit. It goes when the module explorer's replacement is designed.
- `web/src/content/techMarks.ts` and `components/TechMarks.tsx` — still used by `CourseCard`, which Task 10 retones rather than removes.
- `web/src/services/demoSessionsService.ts` and `leadsService.ts` — see spec §7.4. `captureLead` still fires from `CtaLink` and will start working the day the backend endpoint lands; `demoSessionsService` becomes unreferenced but stays for sub-project 2.

- [ ] **Step 2: Strip `Magnetic` out of `CtaLink`**

`CtaLink` is the one surviving file that imports a deleted motion module. The comp has no magnetic hover, so the prop goes with it. In `web/src/components/CtaLink.tsx`, delete the `import Magnetic from '../motion/Magnetic'` line, drop `magnetic` from `Props` and from the destructured signature, and return the anchor directly instead of conditionally wrapping it:

```tsx
export default function CtaLink({ cta, chapter, segment, course, children, className = '' }: Props) {
  return (
    <a
      href={whatsappUrl(cta, segment, course)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => captureLead({ cta, chapter, segment, course })}
    >
      {children}
    </a>
  )
}
```

Then check no call site still passes it: `rg -n "magnetic" web/src` should return nothing.

Every other importer of a deleted module — `HomePage`, `CourseDetailPage`, `PublicLayout`, `CoursesPage`, `AboutPage` — was rewritten or retoned in Tasks 5–10. `CoursesPage` and `AboutPage` in particular imported `SplitWords`; if Task 10 left those imports behind, remove them now.

- [ ] **Step 3: Remove the three unused dependencies**

```bash
cd web && npm uninstall three @types/three @fiddle-digital/string-tune
```

- [ ] **Step 4: Find every dangling import**

Run: `cd web && npx tsc -b --noEmit`
Expected: errors naming any file still importing something deleted. Fix each by removing the import and the JSX that used it. Re-run until clean.

Then: `cd web && npx oxlint src`
Expected: clean. Unused-import warnings here are real and must be fixed, not suppressed.

- [ ] **Step 5: Confirm `narrative.ts` survived**

Run: `cd web && rg -n "FOR_WHOM" src/content/narrative.ts`
Expected: a match. This copy returns in the notes round and must not be deleted with its section.

- [ ] **Step 6: Full verification**

```bash
cd web
npx tsc -b --noEmit       # clean
npx oxlint                # clean
npx vitest run            # 15 passing
npm run build             # succeeds
```

Compare the built bundle against the pre-redesign size — it must be smaller, given roughly 1,100 lines and 2MB of assets removed. Record both numbers in the commit message.

- [ ] **Step 7: Manual acceptance pass**

Serve the comp for side-by-side comparison:

```bash
cd "$HOME/Downloads/VPro Skills Website Redesign" && python3 -m http.server 8899
```

Check each, at 1440px and at 390px:

- Layout, section order, colour, type scale and motion timing match the comp. Exact pixel metrics need not.
- Keyboard only: every shelf spine, accordion header, form field and CTA is reachable and operable, with a visible copper focus ring.
- "Reduce motion" enabled: canvas static, no fade-ups, no parallax.
- Every text run under 16px uses bone at ≥0.62 alpha.
- No seat counts, no "hour to be confirmed", no invented numbers anywhere.
- `/dashboard`, `/results` and `/admin/batches` are visually identical to before.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Remove the motion machinery the new design does not use

Deletes ScrollSequence and its 96-frame sequence, string-tune, the pointer
effects, and the seven sections rebuilt against the comp. Drops three
dependencies no file imported. Bundle: <before> -> <after>."
```

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task: §3 theme scoping and §4 tokens/type → Task 2; §5.1 home → Tasks 5–7; §5.2 course → Task 8; §5.3 batches → Task 9; §5.4 retoned pages → Task 10; §6.1 new components → Tasks 3–7, 9; §6.2 removals → Task 11; §6.3 shelf → Task 6; §7.1 live data and derived state → Tasks 1, 5, 6; §7.2 course content → Task 8; §7.3 CTAs → Tasks 5, 9; §8 motion → Tasks 3, 4, 7; §9 verification → Task 11 Steps 5–6.

**Deliberately deferred, per spec §10:** the fee section, "who this is not for", seat counts, and photographed testimonials. `narrative.ts` is explicitly preserved (Task 11 Step 4) so the copy survives its section.

**Known soft edges.** Task 10 Steps 1–4 describe restyling in prose rather than as complete files, because they are token substitutions across existing markup that has to be read before it is changed; the exact classes to apply are given in each step. Every other step carries the code it needs.

**Type consistency.** Field names were checked against the source, not assumed:

| Used in plan | Source | Note |
|---|---|---|
| `Testimonial.quote` / `.name` / `.role` | `content/testimonials.ts:4-8` | matches |
| `CourseModule.order: number` | `content/courses.ts:12` | a number, rendered `String(order).padStart(2,'0')` — an earlier draft had `module.n` and was wrong |
| `CourseModule.builds?: string` | `content/courses.ts:16` | optional, so Task 8 guards it |
| `CourseContent.level` / `.prerequisites` / `.projects` / `.hue` | `content/courses.ts:26-42` | match |
| `Batch.progress_status` / `.batch_number` / `.trainer_name` | `types/index.ts:24-38` | match |
| `ScheduleRow.state` values | `utils/schedule.ts:5` | `'live' \| 'today' \| 'running' \| 'upcoming'` |
| `CtaLink` props | `components/CtaLink.tsx:6-13` | gains `course?`; `magnetic` removed in Task 11 |
| `MESSAGES` | `content/contact.ts:27` | currently **not** exported — Task 5 exports it |

**One bug found while writing this.** `whatsappUrl(key, segment)` appends `I am a ${segment}.`, and the redesign sends a course name from three places. Passing `segment={course.name}` would have produced "I am a Agentic AI." on every course CTA. Task 5 Step 2 splits `segment` (who the visitor is) from `course` (what they are asking about); Step 2b threads it through `CtaLink`.

`courseStateFor` / `courseStateNote` keep one signature across Tasks 1, 6, 8, 9 and 10. `AccordionItem` is defined in Task 3 and consumed unchanged in Task 7. `composeEnquiry` is defined and consumed inside Task 9.
