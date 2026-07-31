import type { ReactNode } from "react"

/**
 * Highlight anchor (issue #568). Wraps an element with a marker WE own, so the
 * walkthrough highlight targets `[data-anchor="<name>"]` rather than a component's
 * internal (generated) classes. `display: contents` adds no box — the player
 * measures the wrapped element via the anchor's `firstElementChild`.
 */
export function Anchor({ name, children }: { name: string; children: ReactNode }) {
  return (
    <span data-anchor={name} style={{ display: "contents" }}>
      {children}
    </span>
  )
}
