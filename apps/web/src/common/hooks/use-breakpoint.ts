import { throttle } from "lodash"
import { useCallback, useEffect, useRef, useState } from "react"

type BreakpointName = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
const breakpointsMap = new Map<BreakpointName, number>([
  ["xs", 0],
  ["sm", 640],
  ["md", 768],
  ["lg", 1024],
  ["xl", 1280],
  ["2xl", 1536],
])

const getActiveBreakpoints = (width: number): BreakpointName[] => {
  const active: BreakpointName[] = []
  for (const [name, minWidth] of breakpointsMap) {
    if (width >= minWidth) {
      active.push(name)
    }
  }
  return active
}

export function useBreakpoint(): {
  activeBreakpoints: BreakpointName[]
  /**
   * True if the viewport is xs, sm, or md (<768px)
   * but not lg, xl, or 2xl.
   */
  isShortViewport: boolean
} {
  const getWindowWidth = useCallback((): number => window.innerWidth, [])
  const [activeBreakpoints, setActiveBreakpoints] = useState<BreakpointName[]>(() =>
    getActiveBreakpoints(getWindowWidth()),
  )
  const throttledHandleResize = useRef(
    throttle(() => {
      setActiveBreakpoints(getActiveBreakpoints(getWindowWidth()))
    }, 100),
  ).current
  useEffect(() => {
    throttledHandleResize()
    window.addEventListener("resize", throttledHandleResize)
    return () => {
      throttledHandleResize.cancel?.()
      window.removeEventListener("resize", throttledHandleResize)
    }
  }, [throttledHandleResize])
  const isShortViewport = activeBreakpoints.some(
    (bp) =>
      (bp === "xs" || bp === "sm" || bp === "md") &&
      !activeBreakpoints.includes("lg") &&
      !activeBreakpoints.includes("xl") &&
      !activeBreakpoints.includes("2xl"),
  )
  return {
    activeBreakpoints,
    isShortViewport,
  }
}
