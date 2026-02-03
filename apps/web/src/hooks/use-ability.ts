import { selectIsAdmin, selectIsAdminInterface } from "@/features/auth/auth.selectors"
import { useAppSelector } from "@/store/hooks"

// FIXME: This is a temporary hook until we implement a full ability system
// TODO: should be replaced with a proper ability system like CASL
export function useAbility() {
  const isAdmin = useAppSelector(selectIsAdmin)
  const isAdminInterface = useAppSelector(selectIsAdminInterface)
  return { isAdmin, isAdminInterface: isAdminInterface }
}
