import { useMemo } from "react"
import { selectIsAdmin, selectIsAdminInterface } from "@/features/auth/auth.selectors"
import { useAppSelector } from "@/store/hooks"

export function useAbility() {
  const isAdmin = useAppSelector(selectIsAdmin)
  const isAdminInterface = useAppSelector(selectIsAdminInterface)
  return useMemo(
    () => ({ isAdmin, isAdminInterface: isAdminInterface }),
    [isAdmin, isAdminInterface],
  )
}
