import { useMemo } from "react"
import { selectIsAdmin, selectIsAdminInterface } from "@/features/auth/auth.selectors"
import { selectIsPremiumMember } from "@/features/me/me.selectors"
import { useAppSelector } from "@/store/hooks"

export function useAbility() {
  const isAdmin = useAppSelector(selectIsAdmin)
  const isAdminInterface = useAppSelector(selectIsAdminInterface)
  const isPremiumMember = useAppSelector(selectIsPremiumMember)
  return useMemo(
    () => ({ isAdmin, isAdminInterface: isAdminInterface, isPremiumMember }),
    [isAdmin, isAdminInterface, isPremiumMember],
  )
}
