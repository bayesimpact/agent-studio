import { useMemo } from "react"
import { selectIsAdmin, selectIsAdminInterface } from "@/features/auth/auth.selectors"
import { selectIsBayesMember } from "@/features/me/me.selectors"
import { useAppSelector } from "@/store/hooks"

export function useAbility() {
  const isAdmin = useAppSelector(selectIsAdmin)
  const isAdminInterface = useAppSelector(selectIsAdminInterface)
  const isBayesMember = useAppSelector(selectIsBayesMember)
  return useMemo(
    () => ({ isAdmin, isAdminInterface: isAdminInterface, isBayesMember }),
    [isAdmin, isAdminInterface, isBayesMember],
  )
}
