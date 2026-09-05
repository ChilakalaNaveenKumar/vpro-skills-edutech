# VPro Skills — dark editorial redesign (public marketing site)

Date: 2026-09-04.

Supersedes the visual direction of
[the Dawn Ascent spec](2026-09-01-vpro-dawn-ascent-design.md) and the section
structure of [the content replan](../plans/2026-09-01-content-replan.md) for the
public marketing pages only. The strategic argument in the content replan — that
VPro Skills is a platform and not one AI course — still holds and is carried
forward.

Source of the design: a three-page HTML comp at
`~/Downloads/VPro Skills Website Redesign/`, plus its own working document
(`VPro Skills Homepage Report.dc.html`) and brand brief (`CLAUDE.md`).

## 1. Scope

This spec covers **sub-project 1 of four**. The others are named here only so the
boundary is unambiguous; each gets its own spec.

| # | Sub-project | Status |
|---|---|---|
| 1 | Public marketing redesign, content still hardcoded | **This spec** |
| 2 | Site content moves into Postgres, fetched at runtime | Later |
| 3 | Gemini-driven admin authoring, with an approve-the-diff step | Later |
| 4 | Public chatbot answering from live batch/course data | Later |

The build order is forced by dependency: 3 cannot exist before 2, because an LLM
needs a schema to write into rather than TypeScript source to edit. 2 should not
be designed before 1, because the schema has to match the fields the pages
actually render.

**In scope for this spec:** `/`, `/courses`, `/courses/:slug`, `/about`, and a
new `/batches`.

**Out of scope, and unchanged:** the student portal (`/dashboard`, `/results`,
`/topics/*`), the admin panel (`/admin/*`), the mobile app, and every backend
module except a read of the existing public batches endpoint.

### 1.1 Why the redesign

From the comp's own report, and confirmed against the current page: the site
**sells an architecture, not a batch**. Today's hero leads with "Taught live, so
nothing gets skipped" and four proof chips about topic ordering and assessments.
That argues how the platform is built. A visitor is choosing an institute, a
trainer and a start date.

The organising principle of the new page is that section order follows the order
a student's questions actually arrive in: am I in the right place → is anything
running → who teaches me → what will I be able to do → can I try it → what does
it cost → can I trust this → how do I reach a human.

## 2. Decisions taken

Recorded because each one closed a real alternative.

1. **The new look applies to public marketing pages only.** Not the portal, not
   admin, not mobile.
2. **This build is a faithful clone of the three-page comp**, at the comp's own
   section count. Additions (fee, "who this is not for") come in a later round
   after the user has reviewed the clone. "Faithful" governs layout, order,
   palette, type and motion. It is overridden in exactly three places, each
   justified in situ: live data replaces the comp's invented batch rows (§7.1),
   unsupportable claims are dropped rather than rendered (§7.1), and the shelf
   gains a phone layout the comp does not have (§6.3).
3. **Content stays hardcoded** in `web/src/content/*.ts` for this sub-project.
4. **Batch schedule data comes from the live API**, not from hardcoded rows —
   see §7.1.
5. **Motion matches the comp exactly**, including its easing curves and
   durations. The comp is markedly calmer than the current site.
6. **Every CTA terminates in WhatsApp.** No new backend endpoint is introduced.
7. **The fee is ₹25,000 per student for a whole course**, and payment is taken
   only after the student has attended roughly two classes. This is recorded
   here because it is newly-established fact, but it is **not rendered in this
   build** — the comp has no fee section.

## 3. Theme scoping

`web/src/layouts/PublicLayout.tsx` already computes a `journey` flag and sets a
`data-journey` attribute on the page wrapper; `web/src/index.css` scopes an
entire dark-ground token block to `[data-journey]`. The portal and admin never
read those tokens and are therefore insulated by construction.

The redesign **reuses this mechanism and retunes the values**. It does not
introduce a second theming system.

Two changes to the predicate:

- Add `/batches` to the `journey` test.
- The predicate currently reads `location.pathname.startsWith('/courses')`,
  which is correct and needs no change.

## 4. Design tokens

Values from the comp's brand brief. Mapped onto the token names that already
exist, so components can be migrated one at a time without a flag day.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#14161C` | Page ground |
| `--ink-2` | `#191C23` | Card / inset surface |
| `--on-ink` | `#EDE7DE` | Bone — primary text |
| `--signal` | `#C87046` | Copper — accent |
| `--tan` *(new)* | `#C3A47B` | Secondary accent |
| `--rule` | `rgba(237,231,222,0.14)` | Hairline |
| `--btn-primary` / hover | `#7A3B1F` / `#92492A` | Primary button fill |
| `--btn-secondary` / hover | `#232733` / `#2C313F` | Secondary button fill |
| `--btn-secondary-rule` | `rgba(237,231,222,0.22)` | Secondary button hairline |

**Contrast rule for this palette:** text below 16px needs bone at **≥0.62
alpha**; 22px and above may drop to 0.55. Below those thresholds it fails AA on
the `#14161C` ground. This is a hard rule, not a guideline — it is the reason
the comp's muted text sits at 0.62 rather than a lower value that would look
better in isolation.

**Button vocabulary is closed.** Exactly two styles, above. Bone/white fills,
plain outlines, and copper fill with dark text were each explicitly rejected.
The single bone-filled element on the site is the logo plate.

### 4.1 The two oranges

The VPro logo is `#fb7a02` — fully saturated. Copper `#C87046` is darker and
desaturated. They are different oranges and they share the page.

The comp resolves this by placing the logo on a bone plate, which visually
brackets it as a separate object rather than as part of the palette. That is why
the logo plate is the only bone-filled element in the entire design. **Preserve
this.** Placing the bare logo directly on the copper ground, or introducing a
third orange to bridge them, both read as a mistake.

### 4.2 Typography

| Family | Use | Detail |
|---|---|---|
| Newsreader (serif) | Display and long copy | Weights 300–400, tight negative tracking |
| IBM Plex Mono | Labels, meta, buttons | Uppercase, ~0.16em tracking, 10.5–11px |
| IBM Plex Sans | UI and body | Default weight |

Replaces Poppins. The Google Fonts `<link>` in `web/index.html` changes
accordingly. Three families is a real payload cost; subset to the weights listed
and no others.

### 4.3 Prohibitions carried from the brand brief

Each of these was rejected explicitly by the user during the comp's design and
must not be reintroduced:

- No blinking dots, pulsing rings, or status-light decoration. **Note:** the
  current `Hero.tsx` has an `animate-ping` "Teaching now" indicator. It goes.
- No headlines built from short dotted fragments ("A fixed hour. A named
  trainer. A batch that moves together.").
- One course list with a state column — never split into separate "In session" /
  "Opening next" / "Courses we offer" groupings.
- No invented numbers: no course counts, no seats-per-batch, no placement
  guarantees, no market-size or salary claims.

## 5. Page structure

### 5.1 `/` — Home (8 sections)

| # | Section | Contents |
|---|---|---|
| 1 | Hero | "Nothing here is a recording." Left: eyebrow, headline, lede, 4-fact grid. Right: next-batches card + on-air-now block. Behind: the sine-wave canvas. Below: the course-name ticker. |
| 2 | Batches | "Every batch we run." The course shelf — one open, five as vertical spines. |
| 3 | Trainer | Parallax portrait, pull-quote, two paragraphs, attribution. |
| 4 | What live means | "Three things we will not move." Three numbered tenets. |
| 5 | How a batch runs | "Four steps, repeated per topic." Accordion, first item open. |
| 6 | Students | Testimonial grid. |
| 7 | FAQ | Accordion, first item open. |
| 8 | Join | "Attend a free demo class before you enrol." Two CTAs, then footer. |

### 5.2 `/courses/:slug` — Course

Course hero (name, tagline, summary, fact list, primary CTA) → curriculum →
projects → enrol.

The primary CTA label is derived: `Reserve my seat` when the course has a live
batch, `Register interest` otherwise.

**The curriculum heading is derived from the module count, not hardcoded.** The
comp reads "Six modules, in order" because Agentic AI has six; not every course
does. Render the count from `course.modules.length` so the heading cannot lie
about a course it was not written for.

### 5.3 `/batches` — new route

"Reserve your seat." → schedule ("Every batch, with its hour.") → "Four steps to
a seat." → FAQ → enquiry form.

### 5.4 `/courses` index and `/about`

The comp has no equivalent for either. Both are **retoned to the new palette and
typography without restructuring**. Neither may be left on the old light theme:
paid traffic lands on `/courses` directly, and a visitor crossing from a dark
page to a light one reads it as a broken link.

## 6. Components

### 6.1 New

| Component | Responsibility |
|---|---|
| `HeroScope` | Canvas: three drifting sine traces (§8.2) |
| `CourseShelf` | The spine/accordion shelf (§6.3) |
| `NextBatchesCard` | Hero right-hand card: next batches + on-air-now |
| `Ticker` | Course-name marquee below the hero |
| `Reveal` | IntersectionObserver fade-up wrapper (§8.1) |
| `Accordion` | Shared by "how a batch runs" and both FAQs |
| `TrainerPanel` | Portrait with scroll parallax |
| `EnquiryForm` | WhatsApp message composer (§7.3) |
| `ScrollProgress` | Copper progress bar, top of viewport |
| `MobileActionBar` | Sticky bar, slides up once the hero is passed |

### 6.2 Removed

The comp uses none of the current motion machinery. Removing it is part of this
work, not a follow-up — leaving it in place means dead code that still ships in
the bundle.

| Removed | Reason |
|---|---|
| `ScrollSequence` + `web/public/seq/` (96 frames, ~1.6MB) | No scrubbed sequence in the comp |
| `StringTuneRuntime` + the `@fiddle-digital/string-tune` dependency | No library-driven motion in the comp |
| `Magnetic`, `Spotlight` | Pointer effects; rejected direction |
| `LiveType`, `SplitWords` | Per-word headline animation; the comp reveals whole blocks |
| `ScrubStage`, `CourseVScroller`, `WeekBoard`, `ModuleExplorer`, `ModuleVisual` | Superseded by `CourseShelf` and the accordions |
| `SectionRail` + the `useActiveSection` hook | The comp has no side rail; the hook has no other caller |
| `LiveTicker` | Layout-level live ticker replaced by the hero's course-name `Ticker` |
| All of `sections/` — `Hero`, `CoursesAndSchedule`, `HowItWorks`, `Trainer`, `ForWhom`, `Join`, `Section` | Rebuilt against the comp |
| `three`, `@types/three` | Dependencies no file in `web/src` has ever imported |

Approximately 1,100 lines of component code and 2MB of assets. All recoverable
from git history if any of it is wanted back.

**`web/src/content/narrative.ts`'s `FOR_WHOM` block is retained even though its
section is removed** — the join-if / do-not-join-if copy is good, it is named as
a section in the content replan, and it returns in the notes round.

### 6.2.1 Retained, restyled

These survive because `/courses` and `/about` keep their structure (§5.4). They
are retoned to the §4 tokens, not rewritten.

| Retained | Used by |
|---|---|
| `Logo` | Both layouts. Keeps its bone plate (§4.1) |
| `Prose` | `AboutPage` |
| `CourseCard`, `TechMarks` | `CoursesPage` |
| `LiveClassesPanel` | `CoursesPage`. The `/batches` schedule is a separate, new section |
| `FloatingContact` | Becomes the comp's circular WhatsApp button |
| `CtaLink` | Every CTA on the site (§7.3) |
| `ProtectedRoute`, `AdminRoute` | Auth plumbing; untouched by this work |

### 6.3 The shelf, precisely

Six courses as horizontal flex children of a fixed-height row.

- The open course has `flex: 7.2`; every closed spine has `flex: 1`.
- Closed spines render their course name rotated to vertical.
- Background is OKLCH so all six stay in one lightness family:
  open `oklch(0.44 0.086 <hue>)`, closed `oklch(0.288 0.045 <hue>)`.
- Hues come from `courses.ts`, which already carries a `hue` field per course.
- Border: `inset 0 0 0 1px rgba(237,231,222,0.28)` open,
  `rgba(237,231,222,0.12)` closed.
- Clicking a spine opens it. Exactly one is open at a time; index 0 initially.
- The open panel shows name, tagline, module list, hour, state note, a
  "View curriculum" link, and the derived primary CTA.

**Accessibility:** spines are `<button>` elements, not click-handled `<div>`s.
Vertical text needs an accessible name that reads normally to a screen reader.
The open/closed state must be exposed via `aria-expanded`.

**Below `md`, the shelf becomes a vertical stack of cards.** A row of six
horizontal spines is unusable at phone width; the comp does not solve this and
it must be solved here.

## 7. Data and CTAs

### 7.1 Batch data is live

The comp hardcodes illustrative rows ("Batch A-05 · 15 September · Few seats
left") and says so in its own source comment. This build reads the real
`GET /api/batches/`, which is public, unauthenticated, and already returns
`course_name`, `batch_number`, `start_date`, `end_date`, `start_time`,
`end_time`, `trainer_name`, `status` and `progress_status`.

Consume it through the existing `useSchedule` hook in
`web/src/utils/schedule.ts`, which already shares one in-flight promise across
all callers — a fix made specifically because four components were each issuing
their own identical request.

**A course's state is derived, not stored.** A course with at least one `ACTIVE`
batch whose `progress_status` is `IN_PROGRESS` renders as *In session*;
otherwise *Gathering interest*. This means the shelf cannot drift out of sync
with reality, and no `state` field is added to `courses.ts`.

**The batch card degrades to what is true.** Your `Batch` model has no seat
capacity, so **"Few seats left" and "6 of 18 seats left" are not rendered** —
they would be invented numbers, which §4.3 forbids. Every batch always has a
real `start_time`, so "hour to be confirmed" never appears either. The card
renders course name, batch number, start date, the hour window, and the trainer.

### 7.2 Course content

Unchanged: `web/src/content/courses.ts` already carries `slug`, `hue`, `name`,
`tagline`, `summary`, `level`, `prerequisites`, `forWhom`, `modules` (each with
`n`, `name`, `summary`, `builds`, `topics`) and `projects`, for all six courses.
The comp's own data file is a copy of it. **No new content fields are needed.**

### 7.3 CTAs

Every CTA goes to WhatsApp through the existing `CtaLink` component and the
`whatsappUrl()` / `MESSAGES` map in `web/src/content/contact.ts`. New `CtaKey`
entries are added there for any comp button without an existing match; no CTA
gets an ad-hoc `wa.me` URL built at the call site.

The enquiry form on `/batches` is **not a form submission**. It composes a
multi-line message and opens WhatsApp:

```
Hi VPro Skills, I would like to enquire about a batch.
Name: <name>
Phone: <phone>
Batch: <batch>
About me: <background>   ← omitted when empty
```

It must still be a real `<form>` with `onSubmit` and `required` attributes, so
browser validation and Enter-to-submit work. Its helper text states plainly that
sending opens WhatsApp with the details filled in — a form that silently
launches another app without saying so is a dark pattern.

### 7.4 The dead lead endpoint

`CtaLink` calls `captureLead()`, which POSTs to `/api/leads`. **That endpoint
does not exist**, and the call is deliberately fire-and-forget so the failure is
invisible. Likewise `demoSessionsService.getNextDemoSession()` calls
`/api/demo-sessions/next`, which also does not exist and returns `null` on
error.

`captureLead` stays and keeps firing — `CtaLink` still calls it on every CTA, so
it starts working the moment the endpoint exists.

`demoSessionsService` becomes **unreferenced**: the comp's Join section promises
a free demo but shows no date, so nothing fetches one. Keep the file rather than
deleting it; sub-project 2 gives it a real endpoint and the Join section a date
to show. It is recorded here so a future reader finds a documented decision
rather than an orphan.

Neither absence breaks anything today. Both are known, not discovered later as
bugs.

## 8. Motion

Values taken from the comp's source so "the same smoothness" is literal.

### 8.1 Reveals

Opacity `0 → 1`, `translateY(20px) → none`, over **720ms**
`cubic-bezier(0.2, 0.85, 0.2, 1)`, with a stagger of `(index % 3) * 80ms`.

IntersectionObserver at `rootMargin: '0px 0px -10% 0px'`, `threshold: 0.05`,
unobserving each element once shown. Two fallbacks, both required: elements are
revealed immediately if `IntersectionObserver` is absent, and a **2800ms
failsafe timer** reveals everything regardless. Without the failsafe, any
observer misfire leaves the page permanently blank.

### 8.2 Hero canvas

Three sine traces composited over a shared `sin(u·π)` envelope so they fall to
zero at both edges:

| Trace | Amplitude | Frequency | Speed | Colour | Width |
|---|---|---|---|---|---|
| 1 | 0.16 | 1.5 | 0.00042 | `rgba(200,112,70,0.62)` | 1.4 |
| 2 | 0.11 | 2.6 | 0.00061 | `rgba(195,164,123,0.36)` | 1 |
| 3 | 0.07 | 4.1 | 0.00088 | `rgba(237,231,222,0.16)` | 1 |

Each trace adds a second harmonic at `frequency × 2.3`, amplitude `× 0.3`, phase
`× -1.4`. Sampled every 3px. Mid-line at `height × 0.52`. Phase offset per trace
is `index × 1.7`.

Device pixel ratio capped at 2. `requestAnimationFrame` loop, cancelled on
unmount, with the resize listener removed too. Under
`prefers-reduced-motion: reduce` it draws **one static frame** and never starts
the loop.

This is the only continuous motion on the site.

### 8.3 Scroll-driven

One shared `requestAnimationFrame`-throttled scroll listener, registered
`{ passive: true }`, driving all three effects:

- **Progress bar** — width = `scrollY / (scrollHeight - innerHeight) × 100%`.
- **Trainer portrait** — `translateY(centreOffset × -26px) scale(1.06)`, applied
  only while the element intersects the viewport.
- **Mobile action bar** — `translateY(100%)` until `scrollY` exceeds
  `heroHeight - 120`, then `translateY(0)`, transitioned over 420ms
  `cubic-bezier(0.22, 1, 0.28, 1)`. It duplicates the hero's own buttons, so it
  stays hidden until the hero is gone.

The course page substitutes a video scale for the portrait parallax:
`scale(1 - |centreOffset| × 0.03)`.

### 8.4 Accordions

`grid-template-rows` `0fr → 1fr`, with opacity and padding transitioning
alongside. Toggle glyph `+` / `–`. On the home page, opening one closes the
others; the FAQ additionally allows closing the open item so all can be shut.

## 9. Verification

- `npx tsc --noEmit` clean in `web/`.
- `npx oxlint` clean in `web/`.
- Rendered side by side against the comp, served locally, at desktop and phone
  widths. Differences expected and acceptable in exact pixel metrics; not
  acceptable in layout, order, colour, type scale or motion timing.
- Keyboard-only pass: every shelf spine, accordion header, form field and CTA
  reachable and operable, with a visible focus indicator on the dark ground.
- `prefers-reduced-motion: reduce` — canvas static, reveals instant, no parallax.
- Contrast audit against §4's rule, with particular attention to every text run
  under 16px.
- The portal and admin confirmed visually unchanged, which the `[data-journey]`
  scoping should guarantee but which is cheap to verify.
- Bundle size compared before and after; it must fall, given §6.2.

## 10. Known gaps

Recorded so they are decisions rather than oversights.

1. **No fee anywhere on the site.** The number is known (§2.7) and the
   pay-after-two-classes policy is a genuinely strong answer to the price
   objection. The comp has no section for it. This is the single largest
   omission and the first thing to raise in the notes round.
2. **"Who this is not for" is absent**, though the copy exists in
   `narrative.ts`. The comp's own report argues this section "buys the
   credibility for everything above it."
3. **The six testimonials are unverified** — carried over from
   `testimonials.ts`, with names but no photographs and no known provenance. The
   comp's report insists anonymous testimonials are worth less than none and
   demands named students with photographs. They ship as-is in this build; that
   is a conscious deferral, not an endorsement.
4. **No seat counts**, per §7.1.
5. **A faithful reproduction, not a byte-identical copy.** The comp is built
   entirely from inline styles; this build uses Tailwind v4 and the token system
   in §4, because inline styles cannot express the theme scoping in §3 and would
   be unmaintainable. Small metric differences are expected.
