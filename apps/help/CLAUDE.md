# Help Center Rules (Astro — apps/help)

## Scope Confinement: Never Modify Anything Outside `apps/help`

**Rule**: All work on the help center MUST stay inside `apps/help/`. You MUST NOT
create, edit, delete, move, or rename any file outside `apps/help/` — this
includes root config (`biome.json`, `turbo.json`, root `package.json`,
`tsconfig` bases), other apps (`apps/api`, `apps/web`, `apps/web-embed`), and
shared packages (`packages/**`).

- If a task appears to require a change outside `apps/help/` (e.g. a root config
  tweak, wiring `VITE_HELP_CENTER_URL` in `apps/web`, adding a workspace-wide
  dependency), **STOP and ask the user first**. Do not make the change yourself.
- Explain what the outside change would be and why, then let the user decide.
- This applies to every tool that mutates files (Write, Edit, mv/rm via shell,
  formatters run with `--write`, etc.). Read-only inspection outside `apps/help/` is fine.
- Running commands is fine as long as they do not write outside `apps/help/`.
  Prefer scoping commands to this app (e.g. `npx biome check --write apps/help`).

**Exception, one-time granted**: the v3 live walkthrough required wiring
`OverlayProvider` into `packages/ui` shad overlay primitives (dialog, dropdown-menu,
popover, sheet, select, tooltip, hover-card, drawer). That is **done and
backward-compatible** — do not redo it, and it does not loosen the rule above.

**Rationale**: the help center is a self-contained static Astro app. Keeping all
changes within its folder makes the work reviewable in isolation.

---

# When asked to "make a guide" — the one-shot checklist

Authoritative procedure; the sections below are the detail.

1. **Scope.** Only touch `apps/help/`. Anything outside → STOP and ask (§Scope).
2. **Feature & placement.** Map the feature to a `guides-*` sub-category
   (§Guide categories); `order` = next free integer within it; pick EN+FR slugs. Only
   ask the user if the feature name is genuinely ambiguous.
3. **Audit the CURRENT code first — never from memory** (§v3 → Audit first). Re-read the
   real `apps/web` route(s) NOW (the code moves): follow imports from the feature's entry
   component and write the **flow inventory** — every screen/dialog/tab/field/action AND
   its render condition (feature flag / project state). This tells you what to **drive**
   and what to **document**. Depict the fully-provisioned superset; never silently drop a
   conditional surface.
4. **Labels & icons come from the REAL app** — in v3 the walkthrough renders the real
   components, so the on-screen labels are always correct automatically. For the **MDX
   prose** you still quote them verbatim from the EN+FR locale files (§Fidelity Phase 2 is
   gone; labels are read for the doc, not to redraw). Keep hardcoded-English labels as-is;
   neutral sample data; terminology is always **"workspace" / "espace de travail"**.
5. **Build the walkthrough = the v3 LIVE island** (§Walkthrough generation v3). One
   per-feature file `src/walkthroughs/<Feature>Live.tsx` (a seed + a `steps` array that
   drives the real app), mounted `client:only` from `src/components/<Feature>Walkthrough.astro`.
   **Do NOT hand-draw or transcribe** the UI — drive the real thing.
6. **Model state consequences** (§v3 → State evolution): the walkthrough's state must
   change with the actions — a sent invite appears under **Pending invitations**, an
   uploaded doc becomes a **Processing** then **Ready** row, etc. — done via seed + Redux
   dispatch, not by redrawing.
7. **Write both MDX** (EN + FR) on the skeleton (§MDX skeleton), importing the
   walkthrough; one `### n` sub-section per animation step. **Exhaustive by rule — no step
   omitted** (§Writing style → Level of detail), serving end users *and* AI agents. **If
   the feature is feature-flagged, add the flag callout** (§Feature-flag callout).
8. **Verify** (§Validate): `astro build` **and** `astro check` at 0 errors; the pages
   render; eyeball the walkthrough **inside a real guide page** (`/en/<slug>`), not just in
   isolation (host `.prose` can bleed — §v3 → Isolation).
9. **Guard** (§v3 → Drift): the engine's dev self-check logs a step whose drive found no
   target (structure moved); `npm run build` runs `check-walkthroughs.mjs`.

Golden rule: a guide is complete only when a first-time user could finish the feature
end-to-end from it *and* an AI agent could answer any "where is X / how do I Y" from its
words alone (§Level of detail). The **site chrome** is the Bayes brand DA (§Design System);
the **walkthrough** is the real Studio app, isolated under `.wt-scope`.

---

# Design System — Bayes brand DA (light-only)

The help center follows the **Bayes Impact brand DA** (bayesimpact.org), NOT a generic
docs/shadcn theme. **Source of truth: `@bayes/ui` `tokens.css` + `components.css`** —
values are *mirrored, never reinvented*. Everything below lives in `src/styles/global.css`.

## Tokens (values in `global.css`, keep the shadcn `--color-*` names)
- Surface **beige `#F2EFE9`** (`--background`) · ink **`#000`** (`--foreground`) · cards
  **`#FFF`** (`--card`) · cream **`#F7F7F2`** (`--secondary`/`--muted`) · muted text
  **`#657180`** (`--muted-foreground`).
- **Gold `#DBCCAF`** = hairlines/borders (`--border`, `--input`) and brand accent surface.
- **Orange `#FF8400`** (`--primary`) = **PUNCTUATION ONLY** — eyebrow, focus ring, active
  dot, link hover. Never large orange fills or orange body text/buttons.
- Emphasis highlight = gold marker **`#EBE092`** (`.hl` / `<mark>`); in-text link accent =
  gold-deep **`#9A6F24`**. Radius **14px**.
- Token *names* stay shadcn-compatible → **use the Tailwind utilities** (`bg-background`,
  `text-foreground`, `border-border`…), **never hardcode a hex**. Missing token? Mirror
  `@bayes/ui`, don't guess.

## Typography
- Body: **Inter** (`--font-sans`). Display/titles: **Archivo Black** via `.font-display`
  (home hero, article H1, prose `h2`). Serif: **Kaisei Decol** (`--font-serif`). Google
  Fonts loaded in `BaseLayout.astro`.

## Chrome patterns
- **Header** container `max-w-[96rem] px-4 sm:px-6` (must match `DocsLayout.astro`). "Back
  to app" = `.btn-outline .btn-sm`. **Footer** = near-black brand surface (`#0e0e13`).
- **Language switcher**: globe + `EN`/`FR` + chevron; active = bold + `bg-secondary`, no check.

## Hard rules
- **Light-only. NEVER reintroduce dark mode.** No `.dark` block, no `dark:` utilities, no
  `@custom-variant dark`, no `prefers-color-scheme`, no toggle. (The platform's "theme" is a
  brand *colour* key, `coral` — not a light/dark toggle.)
- **Orange = punctuation, gold = accent.** Don't turn buttons/links orange.

## The walkthrough is the EXCEPTION — it renders the real Studio app
A walkthrough is NOT styled with the brand DA: it's the **real Studio app** (product palette
— coral `--primary` via `--brand-primary`, neutral greys) rendered inside a scoped root
`.wt-scope` so the site-wide beige/gold rebrand never leaks in. `global.css` declares the
product tokens under `.wt-scope` and neutralizes the guide's `.prose` bleed there. Do NOT
restyle the walkthrough to beige/gold. (In dev, `--brand-primary` falls back to the app's
dev-default violet; production injects the tenant coral — same behaviour as the app itself.)

---

# Walkthrough generation v3 — LIVE (driven real app) — PREFERRED

> Legacy methods (v1 hand-built HTML replicas; v2 static real-component islands) still power
> some existing guides — see §Legacy. Do **not** build new walkthroughs those ways.

## Principle
A walkthrough **mounts the REAL `apps/web` Studio app once** (its `studioRoutes` render tree +
a mock Redux store with thunks disabled + a memory router) and a per-step **director drives
it** — navigates, dispatches state, opens the real overlays, ticks real checkboxes. No redraw,
no transcription.

**What this eliminates vs. what remains — important:**
- **The RENDERING auto-updates** (this is the whole point). Components, styles, layout, labels
  (real i18n), icons, column order, badge variants, empty states — all are the app's own, so
  when the app changes they change here too, with zero edits. Visual/label drift is gone.
- **The DIRECTOR script does NOT auto-update.** The `steps` locate elements to click/highlight
  by selector or label (`findControl(win, "Invite")`, `[data-slot="dropdown-menu-trigger"]`, …).
  Like an E2E test / guided-tour script, this drives the always-current real app, but the
  *path* ("click Invite, open the ⋮ menu") can break if the app renames a label, changes a
  `data-slot`, or reorders the flow. That residual is authored — the §Drift self-check watches it.

Trade-off (accepted): the island is a `client:only` chunk (~2.8 MB → ~1.3 s to boot in prod,
loaded **async/non-blocking**, shared between guides and cached after first view). A
placeholder + reserved height (`.wt-embed`) avoid any reflow. If a guide ever needs
instant-on-arrival, the only real options are a static poster or trimming the import graph —
both were considered and set aside; the ~1.3 s is accepted.

## The engine (shared, do not re-implement per feature)
`src/walkthroughs/liveWalkthrough.tsx` → `createLiveWalkthrough({ seed, initialPath, routes,
lang, currentIds })` returns `{ Mount, store, dispatch, navigate, resetTransient }`:
- **Single instance**: the app mounts ONCE; the player never remounts it. The director
  `navigate`s (in-memory router — layout/sidebar persist, no flash) and evolves state with
  `dispatch` (e.g. a thunk's `.fulfilled` action) — so overlays/menus stay put and state
  changes in place, exactly like using the app.
- **`resetTransient(win)`**: between steps, closes any open menu/dialog (Escape) and clears
  any selection — only when there is something to undo (no blind sleeps).
- **`currentIds`** (guardrail): the mock store combines every scope's `currentIds` slice and a
  later scope can win, dropping studio-specific keys (`membershipId`, `resourceLibraryId`,
  `reviewCampaignId`, `resourceId`, …), and `useSetCurrentIds` can't read deep params from the
  root. **Declare the deep ids the walkthrough opens here** and the engine seeds them so
  detail/scope routes resolve. (`organizationId`/`projectId` come from the org/project seeds.)

`src/walkthroughs/LiveWalkthroughPlayer.tsx` — the generic player: `{ Mount, steps, lang }`.
Renders the app once inside a bounded, non-interactive `.wt-scope` window; per step runs the
step's `drive(win)` then places the coral **spot** (click target) / dashed **observe** (watch
zone) highlights; controls (Prev/Next/pause + progress, `DUR = 7000`); re-adds the grey
**dialog scrim** (Radix drops its Overlay in non-modal mode). Exposes helpers: `fireOpen`
(dispatches the real pointerdown/up/click Radix listens for), `wait`, `waitFor`, `nextFrame`.

## The director toolkit (from `liveWalkthrough.tsx`)
- **Finders** — `findControl(root, label, exact)` is the canonical one: matches a
  button/link/menu-item by its `textContent`, **robust to icon children** (a `<button>` with
  text + `<svg>` has no leaf text node — `leaf` misses it). `leaf(root, text, exact)` = first
  leaf text node; `clickable(el)` = its closest button/link.
- **Layout scopes** — `sidebarOf` (`[data-slot="sidebar-wrapper"]`), `navOf`
  (`[data-slot="sidebar-inner"]` — nav only, not the page), `insetOf`
  (`[data-slot="sidebar-inset"]` — page body), `toolbarOf` (the bulk toolbar before a table).
- **Input** — `typeInto(input, text)` sets a controlled React input's value the tracked way.
- **Timing** — `fireOpen`, `wait(ms)`, `waitFor(root, selector, timeout)`, `nextFrame()`
  (2 rAF; prefer it over guessed sleeps).

## The one-shot per-feature file (the ONLY thing you write per feature)
`src/walkthroughs/<Feature>Live.tsx`:
1. `buildEntities()` — build the seed with the **apps/web factories** (`organizationFactory`,
   `projectFactory`, `agentFactory`, `documentFactory`, the memberships/invitations factories,
   …). Use the fixed sample identity below and override display values (names/titles). Do NOT
   re-implement the factories by hand (that reintroduces model drift — the factories track the
   models; faker comes along but is a minor part of the chunk).
2. `createLiveWalkthrough({ lang, routes: studioRoutes, initialPath, currentIds, seed:
   mergeSeeds(seed.me(...), seed.organizations(...), seed.projects(...), seed.agents(...),
   seed.studio.<slice>(...) ) })`.
3. `steps: LiveStep[]` — each `{ caption: { en, fr }, drive: async (win) => ({ spot?, observe? }) }`.
   A typical `drive` does: `resetTransient` + `navigate(path)` + evolve state (`dispatch`) +
   open the target overlay (`fireOpen`) + return the element(s) to highlight (found via
   `findControl`/`leaf`). Start on the workspace **overview** and show the nav path first.
4. `export default function <Feature>Live({ lang }) { return <LiveWalkthroughPlayer …/> }`.

Then `src/components/<Feature>Walkthrough.astro` mounts it:
```astro
import <Feature>Island from "@/walkthroughs/<Feature>Live.tsx"
const { lang = "en" } = Astro.props
---
<div class="wt-embed">
  <<Feature>Island client:only="react" lang={lang}>
    <div slot="fallback" class="wt-embed-loading">{lang === "fr" ? "Chargement…" : "Loading the walkthrough…"}</div>
  </<Feature>Island>
</div>
```
`DocumentsLive.tsx` (Sources-group nav, upload dialog, ⋮ menu, bulk, select-all) and
`AddAdminLive.tsx` (Settings nav, invite dialog, pending, member detail, remove/cancel) are
the references.

## Fixed sample identity (in the seed)
Org **Bayes Impact Demo**, workspace **Demo**, user **Alex Martin** /
`alex.martin@example.com` (owner). Neutral agents (**Helpful Assistant**, **Support Agent**,
**Summary Bot**, **Drafting Helper**), neutral docs (`handbook.pdf`, `faq.pdf`, `policy.pdf`).
Seed the feature-flag superset on the project (`web-sources`, `project-analytics`, `agent-mcp`,
`evaluation`, `agent-orchestration`, `agent-embed`) so every gated sidebar item shows.

## Start on the main menu (show the path to the feature)
Every walkthrough starts on the **workspace overview** (`StudioRoutes.project.path`), then the
first steps drive the NAVIGATION to the feature (open Sources → Documents; or Settings →
Members). Never start deep inside the feature — the guide must teach how to get there.

## State evolution — nothing appears before its step (AUTHORING RULE, not auto-enforced)
The seed is the **"before" state**: it holds ONLY pre-existing content. Anything the walkthrough
**creates / uploads / invites** must be absent from the seed and appear at/after its own step,
pushed with a `dispatch` of the real slice's `*.fulfilled` action via a small `setX` helper (skip
when the data is unchanged — avoids a table re-render/flash). Per created entity:
- keep it OUT of the initial seed **and** out of every step BEFORE its create step;
- give it a **distinct identity** — never reuse the name/id of an already-listed item (e.g. don't
  "upload `handbook.pdf`" when `handbook.pdf` is already in the list — that reads as creating
  something that already exists);
- from its create step onward, the dispatched state INCLUDES it **and only it** — don't smuggle in
  extra siblings the walkthrough never created.

The engine CANNOT enforce this (only the author knows what's "created" vs pre-existing) and
`check:walkthrough` does NOT catch it — it's on the author for every guide. References:
`DocumentsLive` (`BASE` → +`faq` Processing → Ready), `AddAdminLive` (`PENDING_NONE` →
`PENDING_ONE`), `ResourceLibrariesLive` (`BEFORE` → `CREATED_EMPTY` → `CREATED_FULL`).

## Isolation & host-bleed contract (GUARDED)
The walkthrough must be an isolated, faithful replay independent of the guide page. Invariants:
1. **Dark mode is class-based** (`@custom-variant dark (&:where(.dark, .dark *))`); the help
   ships no `.dark` → the app's `dark:` variants stay inert → always light.
2. **Prose is neutralized** by `.wt-scope :is(…)` in `@layer components` after `.prose` (beats
   prose, loses to component utilities). It zeroes `border-width: 0` (never `border: 0`).
   **`.prose .lwp :is(h1..h6, strong, b, th)` resets `font-family`+`font-weight`** — the guide's
   `.prose h2` uses the DISPLAY font (Archivo Black) which otherwise bleeds onto the app's
   `<h2>` card/section titles and makes them look ultra-bold. Scoped to `.lwp` only.
3. **Overlays render inside the window, non-modal** via `OverlayProvider` (portal container +
   `modal:false`) — all 8 shad overlay primitives are wired. No page scroll-lock/focus-trap.
4. **Product tokens** scoped under `.wt-scope`; app font is Inter (`--font-sans`).

**Guard:** `npm run check:walkthrough` (`scripts/check-walkthroughs.mjs`, wired into
`npm run build`) asserts the shared-CSS/isolation invariants. Any change to `global.css`,
the player or the engine MUST be eyeballed inside a real guide page.

## Drift self-check (dev)
The RENDERING auto-updates; the only thing that can silently drift is the **director script**
(the selectors/labels each step drives by — see §Principle). The player watches exactly that:
when a step's `drive` **throws** or **finds no target** (both `spot` and `observe` resolve to
nothing), it `console.warn`s which step in **dev only** (`import.meta.env.DEV` — never in the
prod build). So a renamed label / moved `data-slot` / reordered flow shows up the moment you
open the guide in dev — telling you which step to re-point — instead of a half-broken
walkthrough discovered by chance. It changes nothing about rendering; it's a dev tripwire.

---

# Legacy walkthrough methods (existing guides only — do not use for new work)

- **v2 static real-component islands** (`<Feature>Scene.tsx` + shared `StudioChrome.tsx` /
  `WalkthroughPlayer.tsx` / `Anchor.tsx`, labels via `locales.ts`): per-step scenes that
  *import* the real `@caseai-connect/ui` components but *transcribe* the page assembly by hand
  (~99% fidelity). Still powers **web-sources** and **resource-libraries**. Kept as reference.
- **v1 hand-built HTML/CSS replicas** (`*Walkthrough.astro` with a scoped root class like
  `.caw`, `DUR = 6000`, 208px sidebar shell): full hand replicas. Still power the **agent**
  guides (add-a-conversation-agent, …). Kept as backup.

Both drift when the app changes (that's why v3 exists). Don't extend them; migrate a guide to
v3 when you touch it. `locales.ts` (`makeT`) is shared by v2 and v3 for label lookups.

### Agent editor reference (factual, RE-VERIFY before use)
Source: `AgentCreator.tsx` + `AgentEditor.tsx` + each `Agent*Tab.tsx`.
- **Create:** New Agent dialog → **Agent type** [Conversation / Extraction / Form] → **Name**
  (≥3 chars) → **Create** → editor. Conversation is default.
- **Editor = tabs, each its own form with `Save`** (`actions:save`) — except **Embed** which
  saves with **`Update`**. Conversation tabs: General, Model, Sources, Resource libraries, then
  **Conversation categories** (if the project has categories), **Orchestration**
  (`agent-orchestration`), **Embed** (`agent-embed`). Extraction/Form: General, Model, **Output**
  (labeled **Form** for form agents) — no Sources/Resources/Categories/Orchestration/Embed.
- **Resources** tab is literally **Resources**; picker labels **Add library**, **Search
  libraries…**, **No libraries found** stay English in FR.

---

# Guide Authoring Playbook

Every feature guide is **two paired artifacts** that stay identical in **form** (only content
differs):
1. A bilingual MDX doc: `src/content/docs/en/<slug>.mdx` + `src/content/docs/fr/<slug>.mdx`
2. A paired walkthrough `src/components/<Feature>Walkthrough.astro` (§v3).

## Deriving the flow & cutting the steps
Reconstruct the ordered actions from the CURRENT `apps/web` code and cut **one step per
discrete action or screen** — fine-grained. The recurring shape:
1. Open the section in the sidebar (backdrop = workspace overview, spot the nav item).
2. Select the feature's sub-item.
3. Primary action on the page (the top-right button).
4. The create/upload **dialog**: fill fields, then confirm.
5. The **result** row/entry in the table (wait for its status where relevant).
6. Per-row **`⋮` menu** (View / Edit / Download / Delete as applicable).
7. Secondary flows the feature actually has: tag, bulk-select + toolbar, select-all, detail
   page, cancel a pending item, etc. Include only what exists; one step per real action.
In v3 these become the `steps` array (what to drive) AND the `### n` MDX sub-sections (what to
document) — they must match 1:1 (folding allowed, §Level of detail).

## MDX skeleton (identical order, both languages)
```
---
title: <Feature>
description: <one line>
category: <guide sub-category id — see "Guide categories">
order: <next integer within that sub-category>
updated: <YYYY-MM-DD>
---

import <Feature>Walkthrough from "@/components/<Feature>Walkthrough.astro"

<Intro para 1 — what it is>
<Intro para 2 — where it lives>

## <Concept>            ← how it works / how agents use it — BEFORE the animation
<one short paragraph>

## The full flow at a glance
The walkthrough below replays every step in the real interface. Use **Prev / Next**
to move at your own pace; each step highlights the button to click and the area to watch.

<<Feature>Walkthrough lang="en" />   (lang="fr" in the FR file)

## Step by step
### 1. <action>   ← one numbered subsection per animation step, exact button labels
…

## Tips
## Troubleshooting
```
FR headings are fixed: `## Le parcours complet en un coup d'œil`, `## Étape par étape`,
`## Conseils`, `## Dépannage`. The concept heading is feature-specific.

**Extra `##` sections are allowed, additively** — genuine feature content, mirrored EN+FR,
never reordering/renaming/replacing a canonical section.

## Feature-flag callout (MANDATORY when the feature is flagged)
Flags gate rendering; grep `feature="<key>"` / `hasFeature("<key>")` in `apps/web`
(`StudioRoutes.tsx`, `SidebarFooterChildren.tsx`, `AgentEditor.tsx`, `*Button.tsx`). Known:
`web-sources`, `project-analytics`, `evaluation`, `agent-orchestration`, `agent-embed`,
`agent-mcp`. If the feature is flagged, add a **blockquote callout** right after the intro,
in **both** EN and FR — the feature is optional and flags are set platform-side (a workspace
admin can't toggle them; ask the Bayes team). Tailor the "if you don't see it" locator.

```
> **Optional feature — ask to have it enabled.** <Feature> is turned on per workspace. If you
> don't see <exact bold locator> in Studio, the feature isn't enabled for your workspace yet —
> contact the Bayes team to request it.
```
```
> **Fonctionnalité optionnelle — à faire activer.** <Fonctionnalité> s'active espace de travail
> par espace de travail. Si vous ne voyez pas <repère exact en gras> dans Studio, c'est que la
> fonctionnalité n'est pas encore activée pour votre espace de travail — contactez l'équipe
> Bayes pour en faire la demande.
```
If the intro already says "optional", shorten the opening to `> **Ask to have it enabled.**` /
`> **À faire activer.**`.

## Guide categories (a `guides` parent with nested sub-categories)
Two-level tree (`src/i18n/categories.ts`): a top-level category has no `parent`; a sub-category
sets `parent`. The **`guides`** parent holds no docs. Pick the `category` id:
- **`guides-agents`** — Agents. · **`guides-sources`** — Sources & knowledge (Documents, Web
  sources, Resource libraries, tags). · **`guides-team`** — Team & access (members,
  invitations, roles, Admin). · **`guides-eval`** — Evaluation & insights.

`order` sorts within its level. Only categories that contain a doc are shown. To open a new
sub-category, add it to `categories.ts` (`parent: "guides"`, bilingual label + description,
`icon` from `Icon.astro`) in the same commit.

## Writing style

### Level of detail (non-negotiable)
Guides are read by **two audiences at once**, both fully served:
- **End users** following click-by-click in the real UI — they need every concrete action named.
- **AI agents** answering from the guide text alone — anything omitted becomes an answer they
  cannot give.

Therefore:
- **No step may be omitted or glossed over.** Document from the very first entry point (which
  app / card / sidebar item / button, exact label + icon) to the final result — every screen,
  dialog, tab, field, toggle, dropdown option, confirmation, and what happens after each action.
  If clicking opens a dialog, the dialog is its own step. Three tabs → all three covered.
  "Obvious" intermediate steps are still written.
- **Numbered `### n` sub-sections track the walkthrough steps — 1:1 by default.** You MAY fold a
  short run of *adjacent, closely-related* steps into one — but only if it drops **no** content
  (every action/screen/dialog/label still appears, in bold). Never the reverse: no prose for a
  screen the animation doesn't show; no animated action left undocumented.
- **Every on-screen label appears verbatim and in bold** — buttons, tabs, fields, menu items,
  empty-state text, status badges, validation messages — EN + FR, from the locale files. Never
  paraphrase a label.
- **Name the exact control**: "click **Run Evaluation** (top right)", not "start the run". Say
  where it is and what it does.
- **Cover conditional/edge surfaces**: empty states, disabled/greyed buttons and why,
  flag-gated screens (annotate as optional), a **Troubleshooting** entry per way a step stalls.
- Keep prose **tight** — exhaustive coverage, short label-dense sentences; sub-lists for fields.

**Litmus test:** could a never-seen-it user finish the feature from the guide alone, and could
an AI agent answer "where is X / how do I Y" for every X and Y using only the guide's words?

### Other rules
- **Terminology: always "workspace" / "espace de travail"**, never "project" / "projet".
- **Keep platform-hardcoded English labels as-is** even in FR (agent editor **Resources**,
  **Add library** / **Search libraries…** / **No libraries found**). Flag them when useful.
- **Neutral sample data** (`handbook.pdf`, `example.com`, "Getting started") — no vertical.
- Cross-link sibling guides where relevant.

## Consistency (hard rule)
All guides share the **same form**, only content differs: the MDX `##` skeleton, terminology,
the fixed sample identity, and — for the animation — the **shared v3 engine + player** (no
per-feature shell or player). Only the `<Feature>Live.tsx` seed + steps are bespoke. When
adding a guide, diff its MDX skeleton against the siblings.

## Validate (Astro build; `npx` is NOT on PATH)
```
node ../../node_modules/astro/astro.js build   # from apps/help; node at "C:\Program Files\nodejs"
```
Confirm: build 0-error (runs the walkthrough guard); pages exist in `dist/{en,fr}/<slug>/`; the
`##` skeleton matches siblings. `astro check` type-checks. Then open the guide page and watch
the walkthrough render inside the `.prose` container.
