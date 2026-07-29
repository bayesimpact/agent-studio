// POC (issue #568) — v2 generic walkthrough player. Renders a feature Scene for the
// current step, cross-fades, and anchors the coral spot/observe highlights on the
// `data-anchor` wrappers. Shared by every feature walkthrough.
import { type ComponentType, useCallback, useEffect, useRef, useState } from "react"

type Lang = "en" | "fr"
type Box = { x: number; y: number; w: number; h: number }
export type Step = { spot: string | null; observe: string[] }
const DUR = 7000
// The frame GROWS with the column (more room) while its CONTENTS stay at their real,
// natural size — a wider guide column simply shows more of the app, without zooming the
// content or introducing scrollbars. Height tracks the frame width by a fixed app-window
// ratio, floored so the (tall) sidebar always fits and capped so it never gets absurd on
// ultrawide screens.
const H_RATIO = 1.7
const MIN_H = 720
const MAX_H = 960
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const LABELS = {
  en: { prev: "Prev", next: "Next", step: "Step" },
  fr: { prev: "Précédent", next: "Suivant", step: "Étape" },
} as const

export function WalkthroughPlayer({
  Scene,
  steps,
  captions,
  lang = "en",
}: {
  Scene: ComponentType<{ step: number; lang: Lang }>
  steps: Step[]
  captions: { en: readonly string[]; fr: readonly string[] }
  lang?: Lang
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [spot, setSpot] = useState<Box | null>(null)
  const [observes, setObserves] = useState<Box[]>([])
  const [stageH, setStageH] = useState(MIN_H)
  const labels = LABELS[lang]

  const boxOf = useCallback((name: string): Box | null => {
    const stage = stageRef.current
    if (!stage) return null
    const anchor = stage.querySelector(`[data-anchor="${name}"]`)
    const target = (anchor?.firstElementChild ?? anchor) as HTMLElement | null
    if (!target) return null
    const sr = stage.getBoundingClientRect()
    const tr = target.getBoundingClientRect()
    if (tr.width === 0 && tr.height === 0) return null
    return {
      x: tr.left - sr.left - stage.clientLeft,
      y: tr.top - sr.top - stage.clientTop,
      w: tr.width,
      h: tr.height,
    }
  }, [])

  const measure = useCallback(() => {
    const plan = steps[idx]
    setSpot(plan.spot ? boxOf(plan.spot) : null)
    setObserves(plan.observe.map(boxOf).filter((b): b is Box => b !== null))
  }, [idx, boxOf, steps])

  // Frame height = column width / ratio (clamped), recomputed on mount + resize. Wider
  // column → taller frame → more room for the content at its natural size.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const sync = () => setStageH(clamp(stage.clientWidth / H_RATIO, MIN_H, MAX_H))
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(stage)
    window.addEventListener("resize", sync)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", sync)
    }
  }, [])

  // Re-measure highlight boxes after each step change AND after a frame-size change (the
  // targets move as the frame grows).
  // biome-ignore lint/correctness/useExhaustiveDependencies: stageH is an intentional trigger — re-measure once the frame has resized
  useEffect(() => {
    setSpot(null)
    setObserves([])
    const t = window.setTimeout(measure, 280)
    const raf = requestAnimationFrame(measure)
    if (document.fonts?.ready) void document.fonts.ready.then(measure)
    const stage = stageRef.current
    const ro = new ResizeObserver(measure)
    if (stage) ro.observe(stage)
    window.addEventListener("resize", measure)
    return () => {
      window.clearTimeout(t)
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure, stageH])

  // biome-ignore lint/correctness/useExhaustiveDependencies: idx is intentional — restart the per-step timer on each step
  useEffect(() => {
    if (!playing) return
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % steps.length), DUR)
    return () => window.clearTimeout(t)
  }, [playing, idx, steps.length])

  const go = (n: number) => setIdx((n + steps.length) % steps.length)

  return (
    <div className="dwr">
      <div ref={stageRef} className="dwr-stage" style={{ height: stageH }}>
        <div key={idx} className="dwr-scene">
          <Scene step={idx} lang={lang} />
        </div>
        {spot && (
          <span
            className="dwr-spot"
            style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
            aria-hidden
          />
        )}
        {observes.map((b) => (
          <span
            key={`obs-${b.x}-${b.y}-${b.w}-${b.h}`}
            className="dwr-observe"
            style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
            aria-hidden
          />
        ))}
      </div>

      <div className="dwr-controls">
        <button className="dwr-btn" type="button" onClick={() => go(idx - 1)}>
          ‹ {labels.prev}
        </button>
        <button
          className="dwr-ctrl"
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label="Play / pause"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <span className="dwr-cap">
          <span className="dwr-st">
            {labels.step} {idx + 1} / {steps.length}
          </span>
          <span className="dwr-tx">{captions[lang][idx]}</span>
        </span>
        <button className="dwr-btn dwr-primary" type="button" onClick={() => go(idx + 1)}>
          {labels.next} ›
        </button>
      </div>
      <div className="dwr-progress">
        <i key={`${idx}-${playing}`} className={playing ? "run" : ""} />
      </div>

      <style>{`
        /* Use the SAME font as the guide and the real Studio (Inter via --font-sans),
           not the OS system font — otherwise text renders heavier/wider (e.g. Segoe UI on
           Windows) and looks "bold" vs the platform. */
        .dwr { --accent: oklch(74.137% 0.13055 37.323); --spot: color-mix(in oklab, var(--accent) 60%, transparent); margin: 1.5rem 0; font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif); }
        /* The animation is a non-interactive replay: no scrolling, clicking or selecting
           inside the stage. The Prev/Next/pause controls live OUTSIDE .dwr-stage, so they
           stay clickable. */
        .dwr-stage { position: relative; width: 100%; border: 1px solid oklch(0.922 0 0); border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.08); pointer-events: none; user-select: none; }
        /* The scene fills the frame at NATURAL size (no scaling) — the frame's own size is
           what grows to give the content more room. */
        .dwr-scene { position: absolute; inset: 0; animation: dwr-fade .4s ease; }
        @keyframes dwr-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dsn-spin { to { transform: rotate(360deg); } }
        .dwr-spot, .dwr-observe { transition: left .1s cubic-bezier(.4,0,.2,1), top .1s, width .1s, height .1s; }
        .dwr-spot { position: absolute; z-index: 10; border-radius: 8px; pointer-events: none; animation: dwr-pulse 1.4s ease-in-out infinite; }
        @keyframes dwr-pulse { 0%,100% { box-shadow: 0 0 0 2px var(--spot), 0 0 0 0 color-mix(in oklab, var(--accent) 25%, transparent); } 50% { box-shadow: 0 0 0 2px var(--spot), 0 0 0 8px color-mix(in oklab, var(--accent) 8%, transparent); } }
        .dwr-observe { position: absolute; z-index: 9; outline: 2px dashed var(--spot); outline-offset: 3px; border-radius: 10px; pointer-events: none; }
        .dwr-controls { display: flex; align-items: center; gap: .7rem; margin-top: .75rem; padding: .7rem .9rem; border: 1px solid oklch(0.922 0 0); border-radius: 12px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
        .dwr-btn { display: inline-flex; align-items: center; gap: .35rem; border: 1px solid oklch(0.922 0 0); background: #fff; color: #111; border-radius: 8px; padding: .45rem .7rem; font-size: .83rem; font-weight: 500; cursor: pointer; }
        .dwr-primary { background: var(--accent); color: #fff; border-color: transparent; }
        .dwr-ctrl { border: 1px solid oklch(0.922 0 0); background: #fff; border-radius: 8px; width: 2.1rem; height: 2.1rem; cursor: pointer; display: grid; place-items: center; }
        .dwr-cap { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .dwr-st { font-size: .7rem; color: oklch(0.556 0 0); text-transform: uppercase; letter-spacing: .04em; }
        .dwr-tx { font-size: .88rem; font-weight: 500; }
        .dwr-progress { height: 3px; background: oklch(0.922 0 0); border-radius: 999px; overflow: hidden; margin-top: .55rem; }
        .dwr-progress i { display: block; height: 100%; width: 0; background: var(--accent); }
        .dwr-progress i.run { animation: dwr-fill ${DUR}ms linear forwards; }
        @keyframes dwr-fill { to { width: 100%; } }
      `}</style>
    </div>
  )
}
