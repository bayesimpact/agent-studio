import { useMemo } from "react"
import { useLocation } from "react-router-dom"

// FIXME: This is a temporary hook until we implement a full ability system
// TODO: should be replaced with a proper ability system like CASL
export function useAbility() {
  const location = useLocation()
  const pathname = useMemo(() => location.pathname, [location.pathname])
  const admin = useMemo(() => pathname.startsWith("/admin"), [pathname])

  return { admin }
}
