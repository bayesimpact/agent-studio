// Reusable engine for LIVE, single-instance walkthroughs (v3). Feature-agnostic:
// it mounts the real app ONCE (one store + one memory router) and hands the director the
// primitives to drive it in place — navigate (no remount), dispatch (state evolution) and a
// transient reset (close overlays / clear selection). A feature file only supplies a seed, an
// initial route and its steps. No Playwright, no prerender.
import { type ComponentType, useEffect } from "react"
import { Provider } from "react-redux"
import { createMemoryRouter, type RouteObject, RouterProvider } from "react-router-dom"
import i18n from "../../../web/src/i18n"
import { buildMockStore, type StoryPreloadedState } from "../../../web/src/stories/decorators"
import { mergeSeeds } from "../../../web/src/stories/seed"
import { fireOpen, nextFrame, wait } from "./LiveWalkthroughPlayer"

export type Lang = "en" | "fr"

/* ---- shared DOM helpers (director) ---- */
/** The Studio layout wrapper (sidebar + inset); queries scope to it, falling back to the window. */
export const sidebarOf = (win: HTMLElement) =>
  win.querySelector<HTMLElement>('[data-slot="sidebar-wrapper"]') ?? win
/** First leaf element whose (trimmed) text matches — `exact` for equality, else substring. */
export function leaf(root: ParentNode, text: string, exact = false): HTMLElement | null {
  const wanted = text.trim().toLowerCase()
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    if (el.childElementCount !== 0) continue
    const tx = (el.textContent || "").trim().toLowerCase()
    if (exact ? tx === wanted : tx.includes(wanted)) return el
  }
  return null
}
/** The closest clickable ancestor (button/link/menu-button) of a leaf, for spotting/driving. */
export const clickable = (el: HTMLElement | null): HTMLElement | null =>
  el
    ? (el.closest<HTMLElement>('button,[role="button"],a,[data-slot="sidebar-menu-button"]') ?? el)
    : null

/** Find a clickable control by its own text — robust to icon children (a button holding text
 *  + an <svg> has no leaf text node, so `leaf` misses it; this matches the control directly). */
export function findControl(root: ParentNode, text: string, exact = false): HTMLElement | null {
  const wanted = text.trim().toLowerCase()
  for (const el of Array.from(
    root.querySelectorAll<HTMLElement>(
      'button,[role="button"],a,[role="menuitem"],[data-slot="sidebar-menu-button"]',
    ),
  )) {
    const tx = (el.textContent || "").trim().toLowerCase()
    if (exact ? tx === wanted : tx.includes(wanted)) return el
  }
  return null
}

/** The sidebar NAV area (tight scan root for nav items — not the whole wrapper, which also
 *  contains the page content and its title/breadcrumb). */
export const navOf = (win: HTMLElement) =>
  win.querySelector<HTMLElement>('[data-slot="sidebar-inner"]') ?? sidebarOf(win)
/** The main content pane (the page body inside the Studio layout). */
export const insetOf = (win: HTMLElement) =>
  win.querySelector<HTMLElement>('[data-slot="sidebar-inset"]') ?? win
/** The bulk-action toolbar that shad renders just before a table when rows are selected. */
export const toolbarOf = (win: HTMLElement): HTMLElement | null => {
  const container =
    win.querySelector<HTMLElement>('[data-slot="table-container"]') ??
    win.querySelector<HTMLElement>("table")
  return (container?.previousElementSibling as HTMLElement | null) ?? null
}
/** Set a controlled input's value the way React tracks it, then fire `input`. */
export function typeInto(input: HTMLInputElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
  setter?.call(input, text)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

type Store = ReturnType<typeof buildMockStore>

export type LiveHarness = {
  /** Mounts the real app ONCE (Provider + RouterProvider). Never remounted by the player. */
  Mount: ComponentType
  store: Store
  dispatch: Store["dispatch"]
  /** Navigate the in-memory router (no remount — the layout/sidebar persist). No-op if already there. */
  navigate: (path: string) => Promise<void>
  /** Close any open menu/dialog (Escape) and clear any row/header selection, so a step starts clean. */
  resetTransient: (win: HTMLElement) => Promise<void>
}

export function createLiveWalkthrough({
  seed,
  initialPath,
  routes,
  lang,
  currentIds,
}: {
  seed: StoryPreloadedState
  initialPath: string
  routes: RouteObject
  lang: Lang
  /** URL-driven ids the walkthrough navigates to (e.g. `{ membershipId, resourceLibraryId }`).
   *  The mock store combines every scope's `currentIds` slice and a later scope can win, dropping
   *  studio-specific keys; and useSetCurrentIds can't read deep params from the root. Seeding the
   *  ids here makes detail/scope routes resolve for ANY feature — declare them once, no per-feature
   *  workaround. (organizationId/projectId already come from the org/project seeds.) */
  currentIds?: StoryPreloadedState["currentIds"]
}): LiveHarness {
  const state = currentIds ? mergeSeeds(seed, { currentIds }) : seed
  const store = buildMockStore({ state })
  const router = createMemoryRouter([routes], { initialEntries: [initialPath] })

  const Mount: ComponentType = () => {
    useEffect(() => {
      void i18n.changeLanguage(lang)
    }, [lang])
    return (
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    )
  }

  const navigate = async (path: string) => {
    if (router.state.location.pathname === path) return // already there → no work, no lag
    await router.navigate(path)
    await nextFrame()
  }

  // Only pay a cost when there's actually something to undo (no blind fixed sleeps).
  const resetTransient = async (win: HTMLElement) => {
    // Close EVERY open overlay layer. We dispatch Escape ON the overlay content (not on document):
    // a menu handles Escape at the content level (a document-level Escape never reaches it), while
    // Dialog/Sheet/Popover listen on document — dispatching on the content with `bubbles` satisfies
    // both. One Escape only closes the topmost layer, so loop until none remain (stacked dialog +
    // popover). We look at `[data-state="open"]` so a layer already animating closed isn't recounted.
    // Every overlay primitive we use (kept in sync with the OverlayProvider wiring in packages/ui).
    const OPEN_OVERLAY = [
      "dropdown-menu-content",
      "dialog-content",
      "popover-content",
      "sheet-content",
      "select-content",
      "hover-card-content",
      "tooltip-content",
      "drawer-content",
    ]
      .map((slot) => `[data-slot="${slot}"][data-state="open"]`)
      .join(", ")
    for (let i = 0; i < 6; i++) {
      const overlay = win.querySelector<HTMLElement>(OPEN_OVERLAY)
      if (!overlay) break
      overlay.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
      // layers must close one at a time (topmost first), so awaiting inside the loop is intentional
      await wait(50)
    }
    const checked = win.querySelectorAll<HTMLElement>(
      '[data-slot="checkbox"][data-state="checked"], [data-slot="checkbox"][data-state="indeterminate"]',
    )
    if (checked.length) {
      checked.forEach((box) => {
        fireOpen(box)
      })
      await nextFrame()
    }
  }

  return { Mount, store, dispatch: store.dispatch, navigate, resetTransient }
}
