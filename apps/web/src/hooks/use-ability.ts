import { useMemo } from "react"
import { selectAbilities } from "@/features/auth/auth.selectors"
import { selectIsPremiumMember } from "@/features/me/me.selectors"
import { useAppSelector } from "@/store/hooks"

export function useAbility() {
  const abilities = useAppSelector(selectAbilities)
  const isPremiumMember = useAppSelector(selectIsPremiumMember)
  return useMemo(() => ({ abilities, isPremiumMember }), [abilities, isPremiumMember])
}
