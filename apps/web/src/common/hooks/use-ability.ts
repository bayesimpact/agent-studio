import { useCallback, useMemo } from "react"
import {
  ownerOrAdminRoles,
  selectIsPremiumMember,
  selectOrganizationMemberships,
  selectProjectMemberships,
} from "@/common/features/me/me.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { selectCurrentProjectId } from "../features/projects/projects.selectors"

export function useAbility() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const organizationMemberships = useAppSelector(selectOrganizationMemberships)
  const projectMemberships = useAppSelector(selectProjectMemberships)

  const canAccessStudio = useCallback(
    (organizationId: string | null) => {
      if (!organizationId) return false
      const isOrganizationOwnerOrAdmin = [...(organizationMemberships ?? [])].some(
        (membership) =>
          membership.organizationId === organizationId &&
          ownerOrAdminRoles.includes(membership.role),
      )
      const isProjectOwnerOrAdmin = [...(projectMemberships ?? [])].some(
        (membership) =>
          membership.projectId === projectId && ownerOrAdminRoles.includes(membership.role),
      )
      return isOrganizationOwnerOrAdmin || isProjectOwnerOrAdmin
    },
    [organizationMemberships, projectMemberships, projectId],
  )

  const isPremiumMember = useAppSelector(selectIsPremiumMember)
  return useMemo(
    () => ({
      abilities: { canAccessStudio },
      isPremiumMember,
    }),
    [canAccessStudio, isPremiumMember],
  )
}
