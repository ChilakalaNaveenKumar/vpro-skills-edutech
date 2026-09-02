# VPro Skills — content replan

Supersedes §3–§4 of
[the design spec](../specs/2026-09-01-vpro-dawn-ascent-design.md).
Date: 2026-09-01. Written after the Dawn Ascent build landed (`caee87e`)
and the positioning was found to be wrong at the root.

## 1. The root error

The spec built its entire content model from **vproskills.com**, which
markets one program: *"Become an AI Engineer in 90 Days."* So the home
page now hardcodes that program as if it were the whole company —
`PROGRAM.headline`, a "Why AI" chapter of AI market statistics, a
six-module AI roadmap, eight AI projects, one AI mentor.

The repo says otherwise. `backend/scripts/seed_courses.py` carries what
its own comment calls *"the organization's standard course names"*:

| # | Course |
|---|---|
| 1 | Agentic AI |
| 2 | Java Full Stack |
| 3 | .NET Full Stack |
| 4 | Forward Deployment Engineer |
| 5 | Quantum Computing |
| 6 | Python Full Stack |

**Six courses across AI, enterprise development, and quantum computing —
and "Become an AI Engineer in 90 Days" is not one of the six names.** A
home page whose headline, statistics, curriculum and projects are all one
AI course cannot represent a platform that also teaches Java Full Stack
and Quantum Computing.

VPro Skills is the platform. The AI course is a course on it.

**Resolved 2026-09-01:** exactly **one course is live today** — the AI
program. The other seeded names are not running. The public site
therefore shows **one live course plus three "coming soon" placeholders**,
which states the platform truthfully without claiming six running
courses. New courses replace the placeholders as they launch.

## 2. What the platform actually does

Read from the code, not from marketing. This is the product, and almost
none of it is on the current page.

| Capability | Where it lives | Why it sells |
|---|---|---|
| **Live batch classes** | `Batch`: course, batch number, start/end date, start/end time, named trainer, `IN_PROGRESS`/`COMPLETED`. Public via `GET /api/batches/` | Real scheduled classes with a named human. Not a video library |
| **Six course tracks** | `Course`, public via `GET /api/courses/` | Breadth. New courses appear on the site with no redesign |
| **Structured topics, in order** | `Topic` with `topic_order`, per course | You always know what comes next |
| **Topic-wise MCQ assessments** | `Assessment` attached to a topic; reusable; **one attempt per student** | Proof of learning, not attendance |
| **Instant results with full answer review** | `AssessmentResult` + `ResultDetail`: score, wrong count, percentage, and per question your answer beside the correct one | The strongest differentiator on the platform and completely invisible today |
| **Results history** | `GET /api/results/` — every attempt over time | Progress you can see |
| **Student portal** | Dashboard, my enrollments, topics, assessment, results, result detail | A real product behind the marketing |
| **Mobile app** | `mobile/` — Expo, same backend | Attend and revise from a phone |
| **Admin panel** | 11 pages, full CRUD, bulk question upload via Excel | How batches and content stay current |

The honest one-line positioning: **live, instructor-led classes with a
real learning system behind them — structured topics, assessments after
every topic, and instant results you can review answer by answer.**

## 3. What is wrong with the page as built

1. **It sells one course as the company.** §1. The headline, the stats
   chapter, the roadmap and the projects are all one AI program.
2. **The "Why now" chapter is borrowed macro trivia.** `$1.8T AI market`,
   `95% of companies`, `100M+ AI jobs` — uncited numbers about someone
   else's industry, on a platform that also teaches .NET. It answers a
   question nobody asked. **Delete the chapter**; the AI figures move to
   the AI course page where they are at least on topic.
3. **Ameerpet sits in the hero eyebrow.** `Arrival.tsx` line 18 renders
   `CONTACT.location` as the first thing on the page. Remove from the
   hero; the footer is where a location belongs.
4. **Zoom is named twice.** Hero eyebrow "Live on Zoom" (`Arrival.tsx`
   line 21) and the demo card's "Online via Zoom" (`Horizon.tsx`
   line 57). Say *live classes*. The delivery tool is not the product and
   naming it dates the page.
5. **The actual product is missing.** Topic-wise assessments, instant
   results with answer review, results history, the student portal, the
   mobile app — none of it appears anywhere on the page selling it.
6. **Live classes are buried last.** The real batch schedule — the most
   credible, most current thing the site can show — is in chapter 4 at
   the bottom. It belongs immediately after the hero.

## 4. The new structure

Six sections. Each one earns its place by carrying something real.

### 0 — The platform (hero)

VPro Skills as a training platform, not a course. Headline about live
instructor-led learning with a system behind it. Proof strip: Live
Classes · Structured Topics · Assessments After Every Topic ·
Certification. Primary CTA book a free demo, secondary browse courses.

**No location. No Zoom. No 90-day claim** — that belongs to one course.

### 1 — Live classes, right now

Immediately after the hero, as it should have been. Driven entirely by
real `GET /api/batches/` data: course, batch number, named trainer, date
range, and the daily time window.

This is where the "something alive" belongs, and it can be honest rather
than decorative. Every batch carries `start_time` and `end_time`, so the
site can compute in IST which class is **in session right now** and light
it — a live timetable, not an animation pretending to be one. Outside
class hours it shows the next class and when it starts. Alive because it
is true.

Also states plainly what a live class is: a fixed time, a named trainer,
a batch of people moving together.

### 2 — The course, then what's coming

**One live course, shown in depth**, not a grid of six. Its six-module
roadmap, eight projects and the 90-day framing all live here — this is
the section that carries the substance a buyer evaluates. It gets the
curriculum scrub stage (§8).

Beneath it, **three "coming soon" cards** in the same visual family but
deliberately quieter — ghosted plates, no CTA, no fake dates. They make
the platform claim credible without inventing courses that are not
running. Each becomes a real card when its course launches.

The live course reads from `GET /api/courses/`, so nothing is hardcoded;
the placeholders are content, not data.

A course detail route (`/courses/:slug`) is **deferred** — with one live
course the home page carries it in full, and a detail page would be a
second copy of the same content. It goes in when course two launches.

### 3 — How it works

The learning loop, which is the platform's real differentiator and is
currently nowhere: enrol in a batch → attend live → topics unlock in
order → take the topic MCQ → **instant score plus every answer beside
the correct one** → results build into a history → all of it on web or
phone.

Six steps from real screens. This is the section that should carry the
strongest motion work, because for once the motion would be explaining a
real product instead of decorating a claim.

### 4 — The trainer

**Resolved: Sambasiva Rao is the only trainer.** So this is a single
mentor section, not a roster — the real photograph already in
`web/public/`, his published figures (17+ years, 5000+ students trained,
100+ projects guided, 95% success rate), and a "talk to the trainer" CTA.
Testimonials stay editorial type with names and roles, never generated
faces.

### 5 — Start

Next demo session from admin-managed data (never a hardcoded date — the
live site's countdown died exactly that way), FAQ, then the split ending:
prospects to WhatsApp, enrolled students to the portal.

### Navigation

Currently `Why AI · Curriculum · Mentor · Schedule`. Becomes
**Live Classes · Courses · How It Works · Trainers · FAQ · Student
Login** — matching the sections above.

## 5. The theme problem follows from the content problem

"Dawn Ascent" is a single climb from night to dawn: one path, one summit,
90 days, one outcome. It was a reasonable shape for a one-course story.

**With six parallel tracks there is no single summit.** One mountain path
cannot represent Java Full Stack and Quantum Computing running beside
each other, which is why the theme feels wrong rather than merely dark.
The metaphor broke when the content changed.

**Resolved: "Paper technical", light.** Warm paper surfaces, hairline
technical rules, L-brackets and measured guides, charcoal type, brand
orange as the single restrained accent. Library skills:
`light-mode-paper-technical`, `orange-clean-paper-saas`,
`clean-minimal-beige-light-mode`.

Structure per `light-mode-paper-technical`: a darker outer field framing a
large light paper interior, so the content area reads deliberately placed
rather than edge-to-edge white. Accent punctuates — active states, the
in-session marker, progress rules, the primary CTA — and never dominates.

**Honest cost, accepted:** `world/scene.ts`, `terrain.ts` and `ridges.ts`
are roughly 450 lines of procedural night terrain built for the dark
journey. Paper technical discards nearly all of it. `world/conductor.ts`
survives — it is the scroll→progress machinery and it is exactly what the
scrub stages in §8 need. `chapters.ts` is reduced to section registration.
The `night-*` / `bone` / `ember` tokens are replaced by paper tokens.

## 6. Sequence

| # | Step | Depends on |
|---|---|---|
| 1 | **Strip** — Ameerpet out of the hero, both Zoom mentions out *(done)*; delete the "Why now" chapter, its nav entry, and re-index the remaining sections | Nothing |
| 2 | **Paper theme tokens** — replace `night-*`/`bone`/`ember` with paper tokens, add the dark outer frame, hairline grid, L-brackets, type pairing. Retire `world/scene.ts`, `terrain.ts`, `ridges.ts`; keep `conductor.ts` | Step 1 |
| 3 | **Content modules** — `platform.ts`, `howItWorks.ts`, `trainer.ts`, `comingSoon.ts`; retire `program.ts`'s market claims and segment forks | Nothing. Parallel with 2 |
| 4 | **Hero** — the platform statement, proof row, two CTAs. No location, no Zoom, no 90-day claim | Steps 2, 3 |
| 5 | **Live classes section** — real batch data, IST in-session computation, the editorial timetable | Steps 2, 3 |
| 6 | **The course + coming soon** — six modules as a semantic list, eight projects, three ghosted cards | Steps 2, 3 |
| 7 | **Art pipeline** — approve one plate, generate the family, process, commit | Step 3 (needs the module list final) |
| 8 | **Scrub stage 1** — curriculum assembles, Whisk keyframes | Steps 6, 7 |
| 9 | **Scrub stage 2** — how it works, real app screenshots. Requires the app running to capture them | Step 2, Docker |
| 10 | **Trainer, proof, start** — mentor, testimonials, demo session, FAQ, split ending | Steps 2, 3 |
| 11 | **Verify** — build, lint, 390/768/1024/1440, forward and reverse scroll, fast flicks, resize while pinned, reduced motion, keyboard order, console clean | All |

Steps 2 and 3 start now and need nothing from each other. Step 9 is the
only one gated on Docker, which is installed but not currently running.

## 7. Decisions — resolved 2026-09-01

| # | Decision | Answer |
|---|---|---|
| Q1 | Theme direction | **Paper technical (light)**, hero stating the platform with the live timetable as the section directly beneath it |
| Q2 | Which course is live | **One** — the AI program. Three quiet "coming soon" cards beside it |
| Q3 | One trainer or several | **One** — Sambasiva Rao. Single mentor section |
| Q4 | Motion grammar | **Scroll-scrubbed pinned stages, not a 3D camera journey** — see §8 |

Still open: which three courses the "coming soon" cards name, or whether
they stay unnamed as "more tracks in preparation".

## 8. Motion plan

### 8.1 Why not a journey

A continuous-camera journey needs a dark atmospheric world to travel
through — that is what makes Kage read as one shot. **A paper-white
editorial page has no camera.** Flying a 3D camera across parchment does
not read as cinematic, it reads as confused. So the journey grammar is
dropped for a reason stronger than cost.

What replaces it, and gives the same sense of travelling *through*
something, is the **pinned scrub stage** — already a working reference in
this library at
`Skills-main/agent-skills/web-design/scroll-scrubbed-visual-sequence/demo/`.
Paper on one side carrying editorial type and copy stops; a technical
stage on the other where one thing transforms under scroll control. The
page holds still, the subject moves, then the stage releases and hands to
the next section. A journey per section rather than one camera.

Every state is deterministic and reversible: the same scroll position
always produces the same frame, forwards and backwards.

### 8.2 Three layers

**Layer 1 — type and rule choreography.** Near-zero cost, carries most of
the site. Word-by-word headline reveals (`SplitWords`, already built and
working), masked reveals, hairline rules drawing themselves, tabular
numerals counting up, and one thin orange progress rule down the left edge
that doubles as the section rail. CSS plus native scroll-driven
animations — no JavaScript animation loop.

**Layer 2 — pinned scrub stages.** Exactly **two**, each earning its
place. Native scroll is the source of truth; a sticky stage sized to the
viewport; normalized 0..1 progress mapped to a frame index with no
implicit easing; copy stops on the paper side changing at fixed
progress points. `world/conductor.ts` already computes exactly this and is
reused rather than rewritten.

| Stage | Section | Renderer | Why it earns it |
|---|---|---|---|
| **The curriculum assembles** | §4.2, the live course | Whisk-generated frame sequence | Six modules building into one system is genuinely a transformation, and it shows the substance a buyer evaluates |
| **A topic, a test, an answer** | §4.3, how it works | **Real app screenshots**, not generated art | The honest proof is the actual product. The app is built; capture its real Topics / Assessment / Result screens and scrub between them |

That split matters: **Whisk generates art, never product UI.** Inventing
screenshots of a working app would be the exact kind of slop the quality
skill forbids.

**Layer 3 — pointer flourishes.** StringTune `StringMagnetic`,
`StringSpotlight`, `StringParallax` with scroll modes at `"default"`,
exactly as `digi-setu/components/Motion.tsx` runs it. Bails entirely
under `prefers-reduced-motion`.

### 8.3 Non-negotiables

- Native scroll only. Never wheel-delta integration, never a scroll trap,
  never a custom scrollbar.
- `prefers-reduced-motion`: pinning and scrubbing removed, one composed
  static frame rendered per stage, document flow restored, all copy
  readable.
- Ordered information in a sequence is also present as real text — the
  six modules are a semantic `<ol>` regardless of the animation.
- Poster frame visible until the first real frame paints; frame indexes
  clamped; stale requests cancelled; decoding paused when offscreen or
  `document.hidden`.
- Verified at 390 / 768 / 1024 / 1440, forward and reverse, on fast
  flicks, and across resize while a stage is active.

## 9. Whisk asset plan

**Art direction:** two-ink technical letterpress — charcoal and burnt
orange on warm cream, engraved hairline hatching, dotted construction
lines, measurement ticks, halftone in the shadows, slight ink
misregistration. Print register, not photographic and not glossy 3D. This
sits natively on paper surfaces, which photoreal plates would not.

**Hard rules:** no people, no faces, no text baked into any plate
(text must stay live HTML for accessibility and translation), no
photography, no gradients.

**Consistency method:** generate one plate first, approve it, then pass it
as the style reference image for every subsequent asset. This is the only
reliable way to keep a family coherent.

| Asset | Count | Ratio | Use |
|---|---|---|---|
| Curriculum sequence keyframes | 6 (one per module) | 4:3 | Layer-2 scrub stage. Ship as six hard cuts with masked wipes first; interpolate to ~36 frames only if the cuts read as jumpy |
| Project emblems | 8 | 1:1 | One small plate per real project |
| "Coming soon" plates | 3 | 1:1 | Same family, deliberately ghosted and desaturated |
| Section punctuation plates | 2–3 | 16:9 | Editorial breathing room between sections |

**Processing** (all tooling verified installed): `magick` resize and trim
→ `cwebp -q 82` for plates, `-q 80 -alpha_q 90` for any alpha cutouts →
1200w mobile variants → 24px base64 LQIP. Raws land in `art-src/`
(gitignored); only processed WebP under `web/public/art/` is committed.

Starting with six hard-cut keyframes rather than a 36-frame interpolation
is deliberate: it is one sixth of the generation work, it suits the print
aesthetic, and it proves the stage mechanics before committing to volume.
