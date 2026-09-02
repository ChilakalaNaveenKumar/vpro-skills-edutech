# VPro Skills — build plan

Companion to [the design spec](../specs/2026-09-01-vpro-dawn-ascent-design.md).
Date: 2026-09-01. This plan corrects three things the spec got wrong,
adds the generated-image (Whisk) asset pipeline the spec omitted, and
sequences the build into phases with a review checkpoint on each.

## 1. Where the work actually stands

The previous session designed thoroughly and then stopped three commands
into the build. Verified state:

| Done | Evidence |
|---|---|
| `git init` + baseline commit | `b917ca0 Baseline: VPro Skills EduTech platform before Dawn Ascent redesign` |
| Real trainer photograph secured | `web/public/trainer-sambasiva-rao.webp` (30 KB) + `.jpeg` fallback |
| Dependencies installed | `three ^0.185.1`, `@fiddle-digital/string-tune ^1.2.3`, `@types/three ^0.185.4` |
| Design spec written | `docs/superpowers/specs/2026-09-01-vpro-dawn-ascent-design.md`, 304 lines |

**Zero source files changed.** `web/src/` is untouched: `HomePage.tsx` is
still the generic three-value-prop page, `PublicLayout`, `LoginPage` and
`index.css` are original. `git status` shows only `package.json`,
`package-lock.json` and the two new photo files.

So nothing needs unwinding. The starting line is clean.

## 2. Three corrections the spec needs

### C1 — Decision D9 is wrong. Generated imagery is the sanctioned pipeline, not a violation.

Spec D9 reads: *"Procedural 3D only. No AI-generated or stock
photographic plates."* Three independent sources contradict it:

1. **The quality skill requires generated art for illustrative
   elements.** `build-awwwards-quality-sites` SKILL.md line 21: *"Do not
   draw illustrations with model-authored SVG, CSS, or canvas paths. Use
   original generated or appropriately licensed transparent PNG cutouts
   for illustrative elements."* Generated art is the prescribed route;
   model-drawn SVG is the banned one.
2. **Kage — the reference being matched — is a generated-art site.** It
   ships four generated editorial plates
   (`kage-approach.webp`, `kage-lantern-court.webp`, `kage-moonwater.webp`,
   `kage-sanmon-preview.webp`) and ten alpha-preserving foreground
   cutouts. Its own `PROMPT.md` instructs: *"Layer generated cinematic
   stills into editorial cards and use alpha-preserving WebP cutouts…"*
   Matching Kage's grammar without generated art means matching it with
   one hand tied.
3. **The tooling exists and is the user's stated intent.** Whisk is
   available, and every local processing tool is installed (§4).

**D9 is replaced by D9′:**

> Generated imagery is the art pipeline for environment plates,
> foreground cutouts, and project tiles. **No generated humans, ever.**
> Per `build-awwwards-quality-sites` line 22 — *"Use photographs for
> every avatar; never ship initials, illustrated heads, faceless
> silhouettes, or generated people presented as real customers, staff, or
> endorsers"* — the mentor is the real photograph already downloaded, the
> six testimonials ship as editorial type with names and roles and no
> faces, and no student, classroom, or "learner" imagery is ever
> generated. Generated art covers places, objects, light and texture. It
> never covers people or claims.

The originality guard comes from
`codex/generate-reference-inspired-brand-worlds`: before generating,
write the "protected signature elements" list so no prompt reproduces
Kage's temples, torii, lanterns, sakura, or its vermilion moon.
`build-awwwards-quality-sites` line 13 is the binding rule — *"Never
reuse, trace, or closely reproduce reference assets… Generate a
materially new identity, layout, copy system, imagery, and interaction
language."*

### C2 — Spec §6.1's motion architecture is stale and self-contradicting.

Spec §6.1 diagrams `StringGlide / StringScroller` as the smooth-scroll
engine, one 60 FPS rAF loop as the single source of truth, and
`StringCamera` as a custom `StringModule` inside it. That section was
written before the session read the architecture skill, and the session's
own later message corrected it without updating the file. Three pieces of
evidence:

1. `build-threejs-scroll-worlds` line 187: *"Keep native scroll as the
   source of truth; never integrate wheel delta into story position."*
   Line 276: *"Preserve native reversible scroll; do not trap the wheel
   or force a custom scrollbar."*
2. **Kage ships no smooth-scroll engine at all.** No Lenis, no
   Locomotive.
3. **digi-setu — the stack being matched — does not use StringTune for
   scroll.** `components/Motion.tsx` sets
   `st.scrollDesktopMode = "default"` and `st.scrollMobileMode =
   "default"`, registers only `StringMagnetic`, `StringSpotlight` and
   `StringParallax`, and carries the comment *"Scroll stays with the
   browser: the page's reveals run on animation-timeline, which needs a
   real scroll position."* Word-by-word reveals there are a hand-rolled
   `SplitWords` component plus CSS, not `StringSplit`.

**Corrected architecture:**

```
native scroll  (the single source of truth — never wheel delta)
└── scroll conductor            ported from
    │                          build-threejs-scroll-worlds/references/scroll-conductor.js
    ├── chapter state           active chapter + normalized 0..1 progress
    ├── camera                  ONE Three.js camera along an authored spline
    └── DOM chapter classes     drives reveals, foreground layers, chapter rail

StringTune  (pointer layer only, exactly as digi-setu runs it)
    scrollDesktopMode = "default", scrollMobileMode = "default"
    StringMagnetic · StringSpotlight · StringParallax
    bails entirely under prefers-reduced-motion
```

Damping lives in the **render** state only — the camera eases toward a
target derived from scroll position; scroll position itself is never
smoothed or intercepted. Word reveals follow digi-setu's proven
`SplitWords` + CSS approach rather than `StringSplit`, so they work
without JavaScript.

This removes the spec's §13 risk *"`StringCamera` is a custom module
against a library API with no public precedent"* — we no longer need that
module. It also drops `StringGlide`/`StringScroller`/`StringSplit`/
`StringSequence`/`StringCursor` from the plan.

### C3 — Confirm the contact number before it gets wired into seven CTAs.

The spec's §7.1 is correct and was verified live: the entire funnel is
click-to-WhatsApp, zero forms, seven context-specific prefilled messages,
plus persistent floating WhatsApp and call widgets, all on
**`+91 90100 01847`**. The repo itself contains zero WhatsApp references —
grep confirmed — so there is no existing module to read; the live site is
the only source. That number needs one explicit confirmation before it is
committed to `web/src/content/contact.ts`, because it will then be the
single destination for every conversion on the site.

Also carried from spec §3.1: `tel:` links currently omit `+91` and break
for anyone roaming or abroad. Fixed in Phase 5.

## 3. The one genuinely open creative decision

Spec §4 describes the world as *"procedural terrain, a lit path,
lanterns, an ember that becomes a sun."* That is Kage's furniture with
the lanterns recoloured orange — and `build-awwwards-quality-sites`
line 13 forbids close reproduction of a reference.

What is locked and should stay locked: **the lighting arc.** Near-black →
dawn, brand orange as the literal light source at every stage, login
handing the visitor into the app's existing white. That decision is
sound and it solves the brand collision structurally.

What was never actually decided: **what the world is made of.** It
determines every Whisk prompt, so it has to be settled before a single
asset is generated. Candidates are recorded with the decision in §7.

## 4. The Whisk asset pipeline

All local tooling verified present: `magick`, `cwebp`, `ffmpeg`, `sips`,
and `rembg` (background removal → alpha cutouts). Nothing to install.

**Flow**

1. `docs/art/ART-DIRECTION.md` — the world bible. The world's subject,
   palette as OKLCH tokens, the five chapter keyframes written as camera
   shots, type pairing, and the protected-signature-elements list that
   keeps every prompt clear of Kage.
2. `docs/art/whisk-prompts.md` — one numbered prompt per asset, each with
   its aspect ratio and intended use. Chapter 0's plate is generated
   first and then used as the style anchor for chapters 1–4, which is the
   only reliable way to keep five plates in one visual family.
3. Generate in Whisk → raw downloads land in `art-src/` (gitignored,
   never committed).
4. `scripts/process-art.sh` — deterministic, re-runnable:
   - plates: `magick -resize 2400x -strip` → `cwebp -q 82`, plus a 1200w
     variant for mobile, plus a 24px base64 LQIP for instant paint
   - cutouts: `rembg i` → `magick -trim` → `cwebp -q 80 -alpha_q 90`
   - output to `web/public/art/`, which is what gets committed
5. Contact sheet screenshot for approval before any scene code is
   written.

**Asset budget** (mirrors Kage's proven counts): 5 chapter plates,
~8 foreground cutouts, 8 project tiles. Above the fold: at most two
images, both with LQIP. Everything else lazy.

## 5. Phases

Each phase ends at a checkpoint that produces something reviewable. No
phase starts before the previous checkpoint is approved.

| # | Phase | Output | Checkpoint |
|---|---|---|---|
| 0 | **Ground the project** | Move the repo off `~/Downloads` (§8 risk), add a remote, gitignore `art-src/`, apply C1/C2 to the spec | Repo is safe and pushed |
| 1 | **Art direction + assets** | `ART-DIRECTION.md`, `whisk-prompts.md`, generated + processed art in `web/public/art/` | Contact sheet — you approve the look before code |
| 2 | **Content modules** | `web/src/content/`: modules, projects, mentor, testimonials, faq, claims, contact. Typed, no layout. Includes capturing the 10 FAQ answers and 3 legal texts off the live site | You read the actual copy |
| 3 | **Motion + 3D foundation** | Ported scroll conductor, chapter state, the one `DawnAscent` canvas, `StringTuneRuntime`. **Reduced-motion and no-WebGL fallbacks built first, not retrofitted** | Scroll a grey untextured world: 5 framings land correctly, 60 FPS, fallbacks work |
| 4 | **Chapters 0–4** | One chapter per pass — Arrival, The Stakes, The Path, The Mentor, Horizon | A screenshot per chapter at desktop and 390×844 |
| 5 | **Funnel, front end** | `contact.ts`, per-chapter prefilled `wa.me`, floating widgets, `+91` fix, fire-and-forget `POST /api/leads`, GA4/Meta events | Click a CTA with the POST forced to fail — WhatsApp still opens |
| 6 | **Funnel, backend** | `backend/app/leads/`, demo-sessions module, Alembic migration, admin Leads inbox + Demo Sessions pages | A lead row lands; the countdown reads from data |
| 7 | **Re-skin** | Tokens and chrome pushed through the 5 student + 11 admin pages. No 3D, no new motion, no logic changes | Login, dashboard, admin all still render |
| 8 | **Cutover prep** | Per-page title/meta, OG + Twitter cards, `robots.txt`, `sitemap.xml`, `/privacy`, `/terms`, `/data-deletion`, redirect map | Ready to replace vproskills.com |

Phases 1 and 2 are independent of each other and can run in parallel.
Phase 3 depends on neither, so it can start while art is generating.

## 6. Verification gates

Per spec §12, plus what the corrected architecture adds:

- `npm run build` (tsc -b + vite build) and `npm run lint` (oxlint) clean
- Browser pane at desktop and 390×844: console clean, zero 404s, one
  complete scroll pass in both directions, screenshots delivered
- `prefers-reduced-motion`: camera pins to composed framings, all copy
  readable, StringTune bails
- WebGL disabled: CSS-gradient dawn, site fully functional
- Scroll reversibility: scrolling up returns to the exact prior visual
  state — the test that catches wheel-delta integration
- Lead capture end to end with the POST forced to fail
- Login / dashboard / admin render after the re-skin

**Honest dependency:** Docker is installed but **not currently running**.
The home page fetches courses and batches from the backend, so Phases 4
and 6 need `docker compose up` from `docker/`. If Docker stays down,
verification runs against a temporary local mock that is never committed,
and that gets reported plainly rather than glossed.

## 7. Decisions pending

| # | Decision | Why it blocks |
|---|---|---|
| P1 | What the world is made of (§3) | Determines every Whisk prompt |
| P2 | Where the repo lives (§8) | Should be settled before more work accumulates |
| P3 | Who drives Whisk — you generate from written prompts, or browser automation attempts it | Whisk has no API and needs a Google session |

## 8. Risks

- **Camera authoring is the long pole.** A spline that frames five
  compositions well is iterative tuning, not one pass. Phase 3's grey-world
  checkpoint exists to de-risk it before art and copy are layered on.
- **Plate consistency across five chapters is the hardest part of the art
  pipeline.** Mitigation: generate chapter 0 first, then use it as the
  explicit style reference for 1–4.
- **The project lives in `~/Downloads/3d website/` with no remote.** One
  local commit is the only copy of the work. Phase 0 fixes this.
- **Content capture debt:** the 10 FAQ answer bodies and the three legal
  page texts are still only on the live site. Phase 2 captures them.
- **Two extra WebGL contexts is a hard ceiling**, not a target
  (spec §6.3). Every canvas stays `IntersectionObserver`-gated and
  `document.hidden`-aware.
