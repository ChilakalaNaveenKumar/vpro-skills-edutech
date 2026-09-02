# VPro Skills — "Dawn Ascent" home page + communication funnel

Design spec. Date: 2026-09-01.

## 1. Problem

`web/src/pages/HomePage.tsx` is a competent generic marketing page for a
business that does not exist. The real business, verified from
https://vproskills.com on 2026-09-01, sells one sharply-positioned
flagship program: **"Become an AI Engineer in 90 Days"** (Generative AI,
Agentic AI, MCP, RAG, Agents), taught live on Zoom by a named mentor,
converting through free demo sessions booked over WhatsApp.

Six content failures in the current page:

1. **Wrong positioning.** "Practical, instructor-led tech training" is a
   category, not an offer. The real offer is a named outcome with a
   deadline.
2. **No product.** AI, GenAI, Agentic AI, RAG and MCP appear nowhere in
   the web app.
3. **No mentor.** Sambasiva Rao is the strongest trust asset in the
   Ameerpet market, where students choose a trainer before an institute.
   He is absent.
4. **No curriculum or projects.** The 6 modules and 8 projects are the
   substance buyers evaluate. The app's syllabus
   (`GET /api/courses/{id}/topics`) is auth-gated, so a prospect cannot
   see what they would learn.
5. **Wrong conversion action.** CTAs are "Browse Courses" and "Student
   Login", but there is no public signup — `POST /api/users` is
   admin-only. The real funnel step (book a free demo) does not exist in
   the app.
6. **Empty by design.** `listCourses()`/`listBatches()` render bare
   name+description cards; with one course seeded the page is three
   sparse boxes.

Underneath all six: the page tries to be a portal door while the business
needs a sales funnel. It must be both.

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Cinematic 3D on the public surface (Home, PublicLayout, Login); design-token re-skin only for the 5 student + 11 admin pages | 3D where it sells; the portal stays a fast tool |
| D2 | "Dawn Ascent" — palette travels near-black to full daylight | Resolves the Kage-night vs brand-orange collision structurally: orange is the light source at every stage, and login hands you into the app's existing white |
| D3 | Author one Three.js scene with a single scroll-driven camera; ThreeUI for accents only (max 2 extra WebGL contexts) | ThreeUI's cinematic scenes are sandboxed iframes and no component accepts scroll progress. Continuous camera must be ours |
| D4 | `@fiddle-digital/string-tune` + `three ^0.185.1`. No GSAP, no Lenis, no R3F | Matches the digi-setu stack the user already runs; StringTune supplies smooth scroll, progress, split text, cursor, parallax in one loop |
| D5 | This page replaces vproskills.com | One brand, one place to maintain; kills the stale-content bug class |
| D6 | Reuse all published stats and testimonials as-is | Already published under the business's own name; nothing new is claimed |
| D7 | Demo session (date/time/seats/Zoom link) is admin-managed backend data | The live site's countdown currently runs on a dead date — see §3.1 |
| D8 | Communication = Layers 1+2: preserve context-prefilled WhatsApp as primary, add an owned leads module behind it | Verified: the live site's entire funnel is click-to-WhatsApp with zero forms. It works; do not gate it |
| D9 | Procedural 3D only. No AI-generated or stock photographic plates | Kage could generate temple art because it is fiction. VPro is a real school; generated "learner" imagery is slop |
| D10 | `git init` + baseline commit before any edit | The repo is currently not under version control |

## 3. Verified content inventory (source of truth)

Read from the live site 2026-09-01. This is the content the new page must
carry; none of it is invented.

- **Headline:** "Become an AI Engineer in 90 Days"
- **Sub:** Master Python, Machine Learning, Deep Learning, Generative AI,
  RAG, MCP, AI Agents and Real-World Projects.
- **Proof chips:** Live Classes · Real Projects · Placement Support ·
  Certification
- **Market claims:** $1.8T AI market by 2030 · 95% of companies adopting ·
  Rs 8-40 LPA average AI engineer salary · 100M+ new AI jobs globally
- **Segments:** B.Tech students (industry projects, internships,
  placement chances, stand out from peers) and Working professionals
  (switch to AI careers, higher packages, automate daily work,
  future-proof). Booking form also offers M.Tech Student and Job Seeker.
- **Curriculum, 6 modules:** Python Fundamentals; Machine Learning; Deep
  Learning; Generative AI; Agentic AI; RAG + MCP — each with 5 listed
  topics.
- **Projects, 8:** AI Resume Analyzer; AI Chatbot; RAG Knowledge Bot; AI
  Voice Assistant; Agentic AI System; Multi-Agent Automation; MCP
  Integration; Cloud AI Deployment.
- **Mentor:** Sambasiva Rao — Software Architect, AI Educator, Technology
  Mentor. 17+ years; 5000+ students trained; 100+ projects guided; 95%
  success rate.
- **Testimonials, 6 named:** Rahul Kumar (B.Tech Student), Priya Sharma
  (Software Engineer), Vamsi Krishna (Job Seeker), Sandeep Reddy
  (Working Professional), Anjali Verma (M.Tech Student), Karthik (AI
  Enthusiast).
- **FAQ:** 10 questions (answer bodies to be captured during
  implementation — the live accordion renders them collapsed).
- **Contact:** WhatsApp and phone `+91 90100 01847`. Location: Ameerpet,
  Hyderabad. Footer: (C) 2026 VProSkills.com, developed and marketed by
  VR2Tech. Legal pages: Privacy Policy, Terms & Conditions, Data
  Deletion.

### 3.1 Bugs found on the live site

- **Dead countdown.** The demo date appears three times and disagrees:
  marquee "10TH JUNE 2026", hero badge "1ST JULY 2026", countdown card
  "15 July 2026". All three are in the past as of 2026-09-01. D7 exists
  to make this impossible.
- **No analytics or pixel.** Only the site's own bundle loads. With a
  Data Deletion page implying Meta ads, ad platforms are optimizing with
  no conversion signal. §7 fixes this.
- **`tel:` missing country code.** `tel:9010001847` works inside India
  only; the `wa.me` links correctly use `919010001847`.

### 3.2 Live data vs authored content

- **From the API (already public, no auth):** courses
  (`GET /api/courses/`), batch schedule (`GET /api/batches/`) — real
  dates, times, trainer, IN_PROGRESS/COMPLETED. New courses appear
  automatically, which matters because AI Engineer is course #1 of many.
- **Authored constants in the repo:** modules, projects, mentor bio,
  testimonials, FAQ, market claims. One module per concern under
  `web/src/content/`, typed, so they are editable without touching layout.
- **New backend data:** demo sessions and leads (§6).
- **Deliberately not shown publicly:** topics/syllabus stays auth-gated.
  The marketing curriculum is the authored 6-module roadmap, a separate
  thing from a course's topic rows.

## 4. Information architecture

Two audiences, never competing: **prospects scroll, students log in.**
Login stays a persistent quiet affordance in the header; the journey never
blocks a returning student.

| # | Chapter | Camera and world | Light | Content |
|---|---------|------------------|-------|---------|
| 0 | Arrival | Static, low, fog-bound | One ember | Headline word-by-word, sub, 4 proof chips, primary CTA "Book Free Demo", secondary "View Curriculum" |
| 1 | The Stakes | Lifts, turns uphill | First lanterns | Why AI in 2026 (market claims), then the segment fork: students vs working professionals, lighting separately |
| 2 | The Path | Climbs the lit route | Lanterns ignite in sequence | 6 modules as 6 lanterns, each opening to its real topic list; then the 8 projects as a working gallery |
| 3 | The Mentor | Drops close, slow travel | Warm spill | Sambasiva Rao full-height editorial + 4 stats, "Talk To Trainer"; testimonials as restrained editorial quotes |
| 4 | Horizon | Crests the ridge | Full dawn | Next demo session (live data, seats, Zoom) + live batch schedule from API; FAQ; split ending: "Book Free Demo" / "Student Portal" |

Footer: manifesto, contact, Ameerpet location, VR2Tech credit, and the
three legal pages (Privacy, Terms, Data Deletion — Data Deletion is a Meta
ads requirement and must carry over).

Nav (anchors, real links): Curriculum · Projects · Mentor · FAQ · Contact ·
Student Login.

## 5. Design system

Existing `brand-*` and `ink` tokens keep their roles and their WCAG
contrast ratios unchanged — the app's AA compliance must not regress.
Added night-side tokens: `--night-900` (near-black), `--night-700`
(blue-charcoal), `--bone`, `--ember`.

Type: Poppins stays for UI. One editorial display face joins it for
chapter headings and oversized numerals. Loaded the way the app already
loads Poppins (Google Fonts, preconnected in `index.html`).

## 6. Technical architecture

### 6.1 One loop, one scroll source of truth

```
StringTune.getInstance()          single rAF loop, start(60)
├── StringGlide / StringScroller  smooth scroll
├── StringProgress                per-chapter scroll progress
├── StringSplit + StringSequence  word-by-word heading reveals
├── StringParallax / Magnetic /
│   Spotlight / StringCursor      flourishes + fine-pointer cursor
└── StringCamera  (ours)          extends StringModule; drives ONE
                                  Three.js camera along a spline
```

`StringCamera` is a custom `StringModule` registered via `.use()`. Camera,
DOM reveals and smooth scroll therefore tick on the same frame from the
same scroll value — no drift between the 3D world and the type over it.
This is what makes it read as one continuous shot rather than parallax.
`StringData.render` (documented by the library as the WebGL/Three.js
context slot) is the intended host for this.

### 6.2 File layout

New:

```
web/src/three/       DawnAscent.tsx (the one <canvas>), terrain, path,
                     lanterns, ember-to-sun, fog, embers, postprocess
web/src/motion/      StringTuneRuntime.tsx, StringCamera.ts, cameraPath.ts
web/src/sections/    one component per chapter (type + layout only)
web/src/content/     modules.ts, projects.ts, mentor.ts, testimonials.ts,
                     faq.ts, claims.ts, contact.ts
```

Rebuilt: `HomePage.tsx`, `PublicLayout.tsx`, `LoginPage.tsx`,
`index.css`. `App.tsx` routing unchanged except new legal routes.

### 6.3 ThreeUI usage

Vendored, MIT, attributed. Max two accents (a shader CTA and one section
field). Every ThreeUI component mounts its own `WebGLRenderer`; beyond two
extra contexts the mobile frame budget is gone. Techniques (not runtime
code) taken from the `Skills-main` library: `build-threejs-scroll-worlds`,
`cinematic-scroll-storytelling`, `no-ai-design-slop`, `falling-leaves`,
`pointer-trail-emitter`.

## 7. Communication funnel

### 7.1 Layer 1 — preserve what converts

Verified: the live site's entire funnel is click-to-WhatsApp, zero forms,
seven CTAs each with a context-specific prefilled message, plus persistent
floating WhatsApp and call buttons. This is the right pattern for the
Ameerpet market and is preserved as-is, including per-chapter prefilled
messages. `tel:` links gain the `+91` country code. Presence is honest and
computed: real IST business hours, live open/closed state.

Contact lives in one place — `web/src/content/contact.ts` — never inlined.

### 7.2 Layer 2 — log on the way out, never gate

A form in front of WhatsApp would reduce conversion. Instead, every CTA
click fires a non-blocking `POST /api/leads` (segment, source chapter,
which prefilled message, UTM params) and then opens WhatsApp. Same single
tap, same destination, zero added friction. **Best-effort by design: if
the POST fails or is blocked, WhatsApp still opens.** Never await it.

The same click fires GA4/Meta conversion events, closing the
ads-optimizing-blind gap in §3.1.

### 7.3 Backend: one new module

Following the repo's one-package-per-domain rule
(`docs/ARCHITECTURE.md` §"Adding a future module"), a new
`backend/app/leads/` package:

- `POST /api/leads` — public, unauthenticated, rate-limited. Fields:
  name (optional), phone (optional), email (optional), segment, source
  chapter, cta message key, UTM params, created_at. Optional-by-design:
  a click-tracked lead may carry no PII at all.
- `GET /api/admin/leads` — admin-only list with pipeline status.
- `PATCH /api/admin/leads/{id}` — status transitions
  NEW -> CONTACTED -> DEMO_BOOKED -> JOINED | LOST.
- `GET /api/demo-sessions/next` — public. Next demo date, time, seats,
  Zoom link.
- Admin CRUD for demo sessions.

Alembic migration for both tables. New web admin pages: **Leads** (inbox
with pipeline) and **Demo Sessions**, following existing admin page
patterns.

Student-facing confirmation: on-page confirmation plus a downloadable
`.ics` calendar invite. No paid messaging provider is required to ship
this.

## 8. Re-skin scope

The 16 remaining pages get shared chrome (PublicLayout header/footer,
AdminLayout), tokens, buttons, cards, focus rings, table styling. **No 3D,
no new motion, no logic changes.** They stay dense, fast tools that
visibly belong to the same brand.

## 9. Quality gates (non-negotiable)

- `prefers-reduced-motion` — camera pins to composed per-chapter framings;
  all copy fully readable. StringTune bails, matching digi-setu's
  `Motion.tsx` pattern.
- Mobile <=768px — reduced instance counts, DPR capped at 2. Scene
  degrades before it stutters.
- No WebGL — CSS-gradient dawn; site fully functional.
- Every canvas `IntersectionObserver`-gated and `document.hidden`-aware.
- Semantic landmarks, skip-link, keyboard nav preserved. Chapter nav is
  real anchors. Existing AA contrast ratios unchanged.

## 10. Replacing vproskills.com (D5)

Required before cutover: per-page `<title>`/meta description matching the
live site's keyword surface (Generative AI, Agentic AI, MCP, RAG,
Ameerpet Hyderabad), Open Graph and Twitter cards, `robots.txt`,
`sitemap.xml`, and the three legal pages ported as real routes
(`/privacy`, `/terms`, `/data-deletion`). Static hosting already serves
`web/`; a redirect map from any live-site paths is captured during
implementation.

## 11. Out of scope

Mobile Expo app (unaffected — no API contract changes to existing
endpoints). Layer 3 live chat. Layer 4 "Ask the Curriculum" AI assistant.
WhatsApp Business API automation. Payments, certificates, video learning.

## 12. Verification plan

1. `npm run build` (tsc -b + vite build) and `npm run lint` (oxlint) clean.
2. Backend: existing test suite passes; new leads/demo-session tests pass.
3. Browser pane at desktop and 390x844: console clean, zero 404s, one
   complete scroll pass, screenshots delivered.
4. Login / dashboard / admin still render after the re-skin.
5. Lead capture proven end to end: click a CTA, confirm the row lands and
   WhatsApp still opens when the POST is forced to fail.

Honest dependency: the home page fetches courses and batches from the
backend, so real verification needs `docker compose up` from `docker/`.
If Docker is unavailable, verification runs against a temporary local mock
that is never committed, and that fact is reported plainly.

## 13. Risks

- **Camera authoring is the long pole.** A scroll-driven spline that
  frames five compositions well is iterative tuning, not one pass.
- **Two extra WebGL contexts is a hard ceiling**, not a target.
- **`StringCamera` is a custom module against a library API** with no
  public precedent for this use; if the module lifecycle fights the
  camera, fallback is a direct `on('scroll')` subscription driving the
  same spline.
- **Content capture debt:** the 10 FAQ answer bodies and the legal page
  texts still need to be read off the live site during implementation.
