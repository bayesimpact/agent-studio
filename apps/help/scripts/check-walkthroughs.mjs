// POC (issue #568) — walkthrough fidelity/isolation guard.
//
// The v2 walkthroughs render REAL `@caseai-connect/ui` components inside the help center.
// A whole CLASS of bugs comes from the HOST environment leaking into (or diverging from)
// that island: the guide's `.prose` typography bleeding in, OS dark mode flipping the
// components' `dark:` variants, the OS system font replacing Inter, a `border: 0` shorthand
// darkening table separators, etc. Each looked "small" but broke platform parity.
//
// This script encodes the invariants that keep the walkthrough an ISOLATED, faithful replay
// so those regressions fail the build instead of shipping. Run via `npm run check:walkthrough`
// (also part of the build gate). If you intentionally change the mechanism, update the
// matching assertion here in the same commit — do not just delete it.
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (p) => {
  try {
    return readFileSync(join(root, p), "utf8")
  } catch {
    return ""
  }
}

const css = read("src/styles/global.css")
const player = read("src/walkthroughs/WalkthroughPlayer.tsx")
const chrome = read("src/walkthroughs/StudioChrome.tsx")

const checks = [
  {
    ok: /@custom-variant\s+dark\s*\(\s*&:where\(\.dark/.test(css),
    msg:
      "Dark mode must be CLASS-based in global.css (`@custom-variant dark (&:where(.dark, .dark *))`). " +
      "Otherwise an OS/browser in dark mode activates the components' `dark:` variants inside the " +
      "walkthrough (e.g. the Ready badge inverts to light text on dark bg). The walkthrough must always be light.",
  },
  {
    ok: !/prefers-color-scheme/.test(player) && !/dark:/.test(player),
    msg: "WalkthroughPlayer must not introduce its own dark-mode handling; dark stays neutralized globally.",
  },
  {
    ok: /\.wt-scope\s*\{/.test(css),
    msg: "global.css must define the `.wt-scope` product-token scope (isolates the walkthrough from the site's brand tokens).",
  },
  {
    ok: /\.wt-scope[\s\S]{0,120}:is\([^)]*\bth\b[^)]*\btd\b[^)]*\)/.test(css),
    msg:
      "global.css must contain the `.wt-scope` prose-neutralizer (`:is(h1..h6, p, ul, ol, li, a, …, table, th, td, …)`), " +
      "placed in `@layer components` AFTER `.prose`, so the guide's prose typography cannot bleed into the island.",
  },
  {
    ok: /border-width:\s*0/.test(css) && !/\.wt-scope[\s\S]{0,400}\n\s*border:\s*0;/.test(css),
    msg:
      "The prose-neutralizer must zero `border-width: 0`, NEVER `border: 0`. The shorthand also resets border-COLOR " +
      "to currentColor, which darkens the table row `border-b` separators (they get width from the utility but color from here).",
  },
  {
    ok: /font-family:\s*var\(--font-sans/.test(player),
    msg:
      "WalkthroughPlayer `.dwr` must use `font-family: var(--font-sans, …)` (Inter — same as the guide and the real Studio), " +
      "not a hardcoded `ui-sans-serif, system-ui` (renders in the heavier OS system font, looks 'bold' vs the platform).",
  },
  {
    ok: /\.dwr-stage\s*\{[^}]*pointer-events:\s*none/.test(player),
    msg: "WalkthroughPlayer `.dwr-stage` must set `pointer-events: none` (the walkthrough is a non-interactive replay — no scroll/click/select).",
  },
  {
    ok:
      /position:\s*"relative"[\s\S]{0,200}SidebarProvider|\{modal\}/.test(chrome) &&
      /overlay/.test(chrome) &&
      /modal/.test(chrome),
    msg:
      "StudioChrome must render scrim'd dialogs/sheets via a ROOT-level `modal` slot (veil covers the whole window like the app's " +
      "`fixed inset-0` overlay), and anchored menus via the in-wrap `overlay` slot.",
  },
]

const failed = checks.filter((c) => !c.ok)
if (failed.length) {
  console.error(
    `\n✗ Walkthrough fidelity/isolation guard FAILED (${failed.length}/${checks.length}):\n`,
  )
  for (const c of failed) console.error(`  • ${c.msg}\n`)
  console.error(
    "These invariants keep the walkthrough an isolated, faithful replay of the real platform.\n",
  )
  process.exit(1)
}
console.log(`✓ Walkthrough fidelity/isolation guard OK (${checks.length} invariants).`)
