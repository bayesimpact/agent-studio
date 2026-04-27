import { useEffect } from "react"

// NOTE: Catches tab close/refresh,
// shows a generic browser message.
export function usePreventLeave(condition: boolean): void {
  useEffect(() => {
    if (!condition) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      if ("returnValue" in e) e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [condition])
}
