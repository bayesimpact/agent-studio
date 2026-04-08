import { useCallback } from "react"

export const useScrollToEnd = <T extends HTMLElement | null>(
  containerRef: React.RefObject<T>,
  behavior: ScrollBehavior = "instant",
) => {
  const scrollToEnd = useCallback(() => {
    if (!containerRef.current) return
    containerRef.current.scrollIntoView({
      behavior,
      block: "end",
    })
  }, [containerRef, behavior])
  return scrollToEnd
}
