import { createContext, useContext } from "react"

/**
 * Ambient config for Radix-based overlays (Dialog, Sheet, DropdownMenu, Popover…).
 *
 * Purpose: let a host embed real overlays inside a bounded region instead of the
 * viewport. The help-center walkthroughs render the REAL Studio components inside a small
 * "window"; without this, Radix portals every dialog/menu to `document.body` (fixed to the
 * viewport) and locks page scroll. Providing a `container` + `modal: false` keeps overlays
 * inside the walkthrough window with no page-level side effects.
 *
 * Fully backward-compatible: the default is empty, so components NOT wrapped in a provider
 * behave exactly as before (portal → body, modal → each component's own default).
 */
export type OverlayContextValue = {
  /** Portal target for overlay content. Default (undefined/null): Radix default = document.body. */
  container?: HTMLElement | null
  /** Force non-modal (no scroll-lock / focus-trap). Default (undefined): the component's own default. */
  modal?: boolean
  /**
   * When `false`, overlays ignore "interact outside" dismissal (pointer/focus outside the content).
   * A host that replays overlays (the help-center walkthroughs) sets this so a click ANYWHERE else on
   * the page doesn't close the animation's open menu/sheet/dialog. Escape is left untouched (the
   * walkthrough director uses it to reset). Default (undefined): each component's own behavior.
   */
  dismissable?: boolean
}

const OverlayContext = createContext<OverlayContextValue>({})

/** Reads the ambient overlay config. Empty by default. */
export function useOverlayContext(): OverlayContextValue {
  return useContext(OverlayContext)
}

type OutsideHandler = (event: { preventDefault: () => void }) => void

/**
 * Props to spread onto a Radix overlay Content so it does NOT close on outside interaction, when the
 * ambient context requests it (`dismissable: false`). Empty otherwise — zero effect on normal use.
 * Spread AFTER `{...props}` so it wins for the embedding host.
 */
export function useOverlayDismissProps(): {
  onPointerDownOutside?: OutsideHandler
  onInteractOutside?: OutsideHandler
  onFocusOutside?: OutsideHandler
} {
  const { dismissable } = useOverlayContext()
  if (dismissable !== false) return {}
  const prevent: OutsideHandler = (event) => event.preventDefault()
  return { onPointerDownOutside: prevent, onInteractOutside: prevent, onFocusOutside: prevent }
}

/**
 * Narrow variant of {@link useOverlayDismissProps} for primitives whose Content type only exposes
 * `onPointerDownOutside` (Select, Tooltip) — spreading the full set would be an invalid prop there.
 */
export function useOverlayPointerDismissProps(): { onPointerDownOutside?: OutsideHandler } {
  const { dismissable } = useOverlayContext()
  if (dismissable !== false) return {}
  return { onPointerDownOutside: (event) => event.preventDefault() }
}

export const OverlayProvider = OverlayContext.Provider
