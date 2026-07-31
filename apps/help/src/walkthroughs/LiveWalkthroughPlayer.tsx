// LIVE walkthrough player (v3). Renders the REAL app (via `Mount`) inside a
// bounded, non-interactive window; a per-step "director" drives the real UI into each
// step's state (open the ⋮ menu, tick checkboxes…) by dispatching real pointer events, then
// the player highlights the target. Each step REMOUNTS the app fresh (clean reset). No
// Playwright, no prerender — the real components run in the visitor's browser (async chunk).
import { OverlayProvider } from "@caseai-connect/ui/shad/overlay-context"
import {
  type ComponentType,
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

type Lang = "en" | "fr"
type Box = { x: number; y: number; w: number; h: number }
export type DriveResult = { spot?: HTMLElement | null; observe?: HTMLElement | null }
export type LiveStep = {
  caption: { en: string; fr: string }
  /** Bring the freshly-mounted app to this step's state; return the element(s) to highlight. */
  drive?: (win: HTMLElement) => Promise<DriveResult> | DriveResult
}

const DUR = 7000
const LABELS = {
  en: { prev: "Prev", next: "Next", step: "Step", full: "Fullscreen", exitFull: "Exit fullscreen" },
  fr: {
    prev: "Précédent",
    next: "Suivant",
    step: "Étape",
    full: "Plein écran",
    exitFull: "Quitter le plein écran",
  },
} as const

/** Dispatch the real pointer sequence Radix listens for (it opens on pointerdown, not click). */
export function fireOpen(el: HTMLElement) {
  const o = {
    bubbles: true,
    cancelable: true,
    composed: true,
    button: 0,
    pointerId: 1,
    pointerType: "mouse" as const,
  }
  el.dispatchEvent(new PointerEvent("pointerdown", o))
  el.dispatchEvent(new PointerEvent("pointerup", o))
  el.dispatchEvent(new MouseEvent("click", o))
}
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
/** Resolve after layout has settled (two frames) — replaces guessed fixed sleeps. */
export const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
export async function waitFor(
  root: ParentNode,
  selector: string,
  timeout = 5000,
): Promise<HTMLElement | null> {
  const start = Date.now()
  // poll (awaiting inside the loop is intentional) for a real element to appear
  while (Date.now() - start < timeout) {
    const el = root.querySelector<HTMLElement>(selector)
    if (el) return el
    await wait(25)
  }
  return null
}

/** Position a highlight box tightly on the target (the ring/frame is drawn just outside it). */
function boxStyle(b: Box): CSSProperties {
  return { left: b.x, top: b.y, width: b.w, height: b.h }
}

export function LiveWalkthroughPlayer({
  Mount,
  steps,
  lang = "en",
  height = 760,
}: {
  /** Renders the real harness (Provider + store + router) ONCE. It is never remounted — the
   *  per-step director navigates and evolves state in place (so overlays/menus stay put). */
  Mount: ComponentType
  steps: LiveStep[]
  lang?: Lang
  height?: number
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [spot, setSpot] = useState<Box | null>(null)
  const [observe, setObserve] = useState<Box | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isFs, setIsFs] = useState(false)
  const labels = LABELS[lang]

  useEffect(() => {
    setContainer(winRef.current)
  }, [])

  // Fullscreen: give narrow views (e.g. web sources — a wide desktop table) the full viewport
  // width, so the app lays out without clipping. We fullscreen the whole widget (window +
  // controls) so the controls stay reachable. Toggling re-measures highlights (layout changed).
  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen?.()
    else void el.requestFullscreen?.()
  }, [])

  useEffect(() => {
    const onChange = () => setIsFs(document.fullscreenElement === rootRef.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  // Passive replay: a top blocker swallows ALL real pointer input (clicks/hover), so the visitor
  // can't interact with the app OR its overlays (Radix forces pointer-events:auto on overlay
  // content, so pointer-events:none alone doesn't cut it). Capture + stopImmediatePropagation also
  // prevents the click reaching Radix's document-level "outside" listeners (which would close an
  // open menu/dialog). The director drives via dispatchEvent straight on the target nodes — a
  // different propagation path that never crosses the blocker — so driving is unaffected. Scroll
  // (wheel/touchmove) is intentionally NOT blocked, so the page still scrolls over the widget.
  useEffect(() => {
    const el = blockRef.current
    if (!el) return
    const stop = (e: Event) => {
      e.stopImmediatePropagation()
      e.preventDefault()
    }
    const types = [
      "pointerdown",
      "pointerup",
      "click",
      "dblclick",
      "mousedown",
      "mouseup",
      "contextmenu",
    ]
    for (const type of types) el.addEventListener(type, stop, true)
    return () => {
      for (const type of types) el.removeEventListener(type, stop, true)
    }
  }, [])

  // The elements the current step wants highlighted, kept so we can RE-MEASURE them (after an
  // overlay's open animation settles, or when the window resizes / goes fullscreen) WITHOUT
  // re-running the whole drive — re-driving re-navigates + reopens overlays and blanks the anchor,
  // which is what caused the lag / delay / flash.
  const targetsRef = useRef<{ spot: HTMLElement | null; observe: HTMLElement | null }>({
    spot: null,
    observe: null,
  })

  const boxOf = useCallback((el: HTMLElement | null | undefined): Box | null => {
    const win = winRef.current
    if (!win || !el) return null
    const wr = win.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return null
    return {
      x: r.left - wr.left - win.clientLeft,
      y: r.top - wr.top - win.clientTop,
      w: r.width,
      h: r.height,
    }
  }, [])

  // Continuously pin the anchor to its target every frame, updating state ONLY when the box
  // actually changes. One robust mechanism that replaces all the bespoke timing (measure-once +
  // settle timers + resize handler): it naturally follows overlay open animations, async/late
  // renders, fullscreen, resize and scroll. Idle-cheap — with no target, boxOf returns before
  // touching the DOM, so most frames do nothing.
  useEffect(() => {
    let raf = 0
    let prevSpot: Box | null = null
    let prevObserve: Box | null = null
    const same = (a: Box | null, b: Box | null) =>
      a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h)
    const tick = () => {
      const s = boxOf(targetsRef.current.spot)
      const o = boxOf(targetsRef.current.observe)
      if (!same(s, prevSpot)) {
        prevSpot = s
        setSpot(s)
      }
      if (!same(o, prevObserve)) {
        prevObserve = o
        setObserve(o)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [boxOf])

  // Drive the mount into the current step's state and record the targets. The rAF tracker above
  // pins the anchor to them and keeps it pinned through animations/resizes — this effect does NO
  // measuring or timing itself. Runs on STEP change only.
  useEffect(() => {
    let cancelled = false
    setDialogOpen(false)
    targetsRef.current = { spot: null, observe: null } // blank the anchor until the drive resolves
    const run = async () => {
      const win = winRef.current
      if (!win) return
      // Single instance: the app is already mounted, so this returns immediately after step 0.
      await waitFor(win, '[data-slot="sidebar-wrapper"]', 20000)
      if (cancelled) return
      let res: DriveResult = {}
      try {
        res = (await steps[idx]?.drive?.(win)) ?? {}
      } catch (err) {
        // Drift self-check (dev only): a drive that throws (querySelector on a vanished node, a
        // renamed label, …) almost always means the real app's structure changed. The app's
        // RENDERING auto-updates (real components/labels), but the step's driving script finds
        // targets by selector/label — that part is authored and can break. Surface it loudly.
        if (import.meta.env?.DEV)
          console.warn(
            `[walkthrough] step ${idx + 1} drive threw — the app's structure likely changed:`,
            err,
          )
      }
      if (cancelled) return
      targetsRef.current = { spot: res.spot ?? null, observe: res.observe ?? null }
      // A real Dialog is scrim'd in the app; Radix drops its Overlay in non-modal mode, so
      // re-add the veil ourselves (a dropdown/menu has none — this is dialog-only).
      setDialogOpen(!!win.querySelector('[data-slot="dialog-content"]'))
      // Drift self-check (dev only): after a couple frames, if the step drove but nothing is
      // measurable, its target selector/label no longer matches — flag which step.
      await nextFrame()
      if (cancelled) return
      if (import.meta.env?.DEV && steps[idx]?.drive && !boxOf(res.spot) && !boxOf(res.observe)) {
        console.warn(
          `[walkthrough] step ${idx + 1} "${steps[idx]?.caption?.[lang] ?? ""}" highlighted nothing — target missing? (drift)`,
        )
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [idx, boxOf, steps, lang])

  // biome-ignore lint/correctness/useExhaustiveDependencies: `idx` is intentional — restarting the auto-advance timer whenever the step changes (incl. manual Prev/Next) is the desired behavior.
  useEffect(() => {
    if (!playing) return
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % steps.length), DUR)
    return () => window.clearTimeout(t)
  }, [playing, idx, steps.length])

  const go = (n: number) => setIdx((n + steps.length) % steps.length)

  return (
    <div
      className="lwp"
      ref={rootRef}
      style={{ ["--lwp-h" as string]: `${height}px` } as CSSProperties}
    >
      {/* the app is mounted ONCE; the director drives/navigates/evolves it in place per step.
          non-interactive (a replay) — pointer-events:none + the blocker overlay below. */}
      <div
        ref={winRef}
        className="wt-scope lwp-window"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div className="lwp-app" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <OverlayProvider value={{ container, modal: false, dismissable: false }}>
            <Mount />
          </OverlayProvider>
        </div>
        {dialogOpen && <span className="lwp-dialog-scrim" aria-hidden />}
        {observe && <span className="lwp-observe" style={boxStyle(observe)} aria-hidden />}
        {spot && <span className="lwp-spot" style={boxStyle(spot)} aria-hidden />}
        {/* passive-replay blocker: swallows all real pointer input (see effect above) */}
        <div ref={blockRef} className="lwp-block" aria-hidden />
      </div>

      <div className="lwp-controls">
        <button className="lwp-btn" type="button" onClick={() => go(idx - 1)}>
          ‹ {labels.prev}
        </button>
        <button
          className="lwp-ctrl"
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label="Play / pause"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <span className="lwp-cap">
          <span className="lwp-st">
            {labels.step} {idx + 1} / {steps.length}
          </span>
          <span className="lwp-tx">{steps[idx]?.caption[lang]}</span>
        </span>
        <button
          className="lwp-ctrl"
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFs ? labels.exitFull : labels.full}
          title={isFs ? labels.exitFull : labels.full}
        >
          {isFs ? "🡼" : "⛶"}
        </button>
        <button className="lwp-btn lwp-primary" type="button" onClick={() => go(idx + 1)}>
          {labels.next} ›
        </button>
      </div>
      <div className="lwp-progress">
        <i key={`${idx}-${playing}`} className={playing ? "run" : ""} />
      </div>

      <style>{`
        .lwp { --lwp-accent: oklch(74.137% 0.13055 37.323); --lwp-ring: color-mix(in oklab, var(--lwp-accent) 65%, transparent); margin: 1.5rem 0; font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif); }
        /* transform: translateZ(0) makes this window the containing block for the app's
           position:fixed overlays (Dialog/Sheet/…) — without it they escape to the viewport (the
           whole site) instead of staying inside the animation. overflow:hidden then clips them in. */
        .lwp-window { position: relative; height: var(--lwp-h); transform: translateZ(0); border: 1px solid oklch(0.922 0 0); border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.08); user-select: none; }
        /* Fullscreen: the widget fills the screen; the window grows to take all the space above the
           controls, so a wide desktop view (web sources) gets the room it needs — no clipping. */
        .lwp:fullscreen, .lwp:-webkit-full-screen { margin: 0; padding: 1rem; box-sizing: border-box; background: oklch(0.97 0 0); display: flex; flex-direction: column; }
        .lwp:fullscreen .lwp-window, .lwp:-webkit-full-screen .lwp-window { flex: 1 1 auto; height: auto; min-height: 0; }
        .lwp-block { position: absolute; inset: 0; z-index: 100; background: transparent; }
        .lwp-spot { position: absolute; z-index: 60; border-radius: 8px; pointer-events: none; animation: lwp-blink 2.6s ease-in-out infinite; }
        @keyframes lwp-blink {
          0%, 100% { box-shadow: 0 0 0 4px var(--lwp-ring), 0 0 14px 3px color-mix(in oklab, var(--lwp-accent) 55%, transparent); }
          50%       { box-shadow: 0 0 0 4px var(--lwp-ring), 0 0 30px 12px color-mix(in oklab, var(--lwp-accent) 80%, transparent); }
        }
        .lwp-dialog-scrim { position: absolute; inset: 0; z-index: 45; background: rgba(0,0,0,.5); pointer-events: none; animation: lwp-fade 180ms ease both; }
        @keyframes lwp-fade { from { opacity: 0; } to { opacity: 1; } }
        .lwp-observe { position: absolute; z-index: 59; border: 3px dashed var(--lwp-ring); border-radius: 10px; pointer-events: none; animation: lwp-blink-soft 2.6s ease-in-out infinite; }
        @keyframes lwp-blink-soft { 0%, 100% { opacity: 1; } 50% { opacity: .78; } }
        .lwp-controls { display: flex; align-items: center; gap: .7rem; margin-top: .75rem; padding: .7rem .9rem; border: 1px solid oklch(0.922 0 0); border-radius: 12px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
        .lwp-btn { display: inline-flex; align-items: center; gap: .35rem; border: 1px solid oklch(0.922 0 0); background: #fff; color: #111; border-radius: 8px; padding: .45rem .7rem; font-size: .83rem; font-weight: 500; cursor: pointer; }
        .lwp-primary { background: var(--lwp-accent); color: #fff; border-color: transparent; }
        .lwp-ctrl { border: 1px solid oklch(0.922 0 0); background: #fff; border-radius: 8px; width: 2.1rem; height: 2.1rem; cursor: pointer; display: grid; place-items: center; }
        .lwp-cap { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .lwp-st { font-size: .7rem; color: oklch(0.556 0 0); text-transform: uppercase; letter-spacing: .04em; }
        .lwp-tx { font-size: .88rem; font-weight: 500; }
        .lwp-progress { height: 3px; background: oklch(0.922 0 0); border-radius: 999px; overflow: hidden; margin-top: .55rem; }
        .lwp-progress i { display: block; height: 100%; width: 0; background: var(--lwp-accent); }
        .lwp-progress i.run { animation: lwp-fill ${DUR}ms linear forwards; }
        @keyframes lwp-fill { to { width: 100%; } }
        @media (prefers-reduced-motion: reduce) { .lwp-spot, .lwp-observe { animation: none; } }
      `}</style>
    </div>
  )
}
