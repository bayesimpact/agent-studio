import { useEffect, useMemo, useRef } from "react"
import { useLocation } from "react-router-dom"
import { authActions } from "@/features/auth/auth.slice"
import { useAppDispatch } from "@/store/hooks"

// FIXME: This is a temporary hook until we implement a full ability system
// TODO: should be replaced with a proper ability system like CASL
export function useInitAbility() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const pathname = useMemo(() => location.pathname, [location.pathname])
  const admin = useMemo(() => pathname.startsWith("/admin"), [pathname])
  const prevAdminRef = useRef<boolean | null>(null)

  useEffect(() => {
    // Only dispatch if admin value actually changed
    if (prevAdminRef.current !== admin) {
      prevAdminRef.current = admin
      dispatch(authActions.setIsAdmin(admin))
    }
  }, [admin, dispatch])

  return { admin }
}
