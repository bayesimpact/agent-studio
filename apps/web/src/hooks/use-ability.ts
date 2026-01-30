import { useLocation } from "react-router-dom"

// FIXME: This is a temporary hook until we implement a full ability system
// TODO: should be replaced with a proper ability system like CASL
export function useAbility() {
  const location = useLocation()
  const admin = location.pathname.startsWith("/admin")
  return { admin }
}
