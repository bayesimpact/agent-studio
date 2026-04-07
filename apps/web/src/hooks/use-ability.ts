import { useMemo } from "react"
import { selectAbilities } from "@/common/features/auth/auth.selectors"
import { selectIsPremiumMember } from "@/common/features/me/me.selectors"
import { useAppSelector } from "@/common/store/hooks"

export function useAbility() {
  const abilities = useAppSelector(selectAbilities)
  const isPremiumMember = useAppSelector(selectIsPremiumMember)
  return useMemo(() => ({ abilities, isPremiumMember }), [abilities, isPremiumMember])
}
