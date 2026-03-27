import { useMemo } from "react"
import { selectAbilities, selectIsAdminInterface } from "@/features/auth/auth.selectors"
import { selectIsPremiumMember } from "@/features/me/me.selectors"
import { useAppSelector } from "@/store/hooks"

export function useAbility() {
  const abilities = useAppSelector(selectAbilities)
  const isAdminInterface = useAppSelector(selectIsAdminInterface)
  const isPremiumMember = useAppSelector(selectIsPremiumMember)
  return useMemo(
    () => ({ abilities, isAdminInterface: isAdminInterface, isPremiumMember }),
    [abilities, isAdminInterface, isPremiumMember],
  )
}
