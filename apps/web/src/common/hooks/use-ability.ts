import { useCallback, useMemo } from "react"
import {
  ownerOrAdminRoles,
  selectIsPremiumMember,
  selectOrganizationMemberships,
  selectProjectMemberships,
} from "@/common/features/me/me.selectors"
import { useAppSelector } from "@/common/store/hooks"

export function useAbility() {
  const organizationMemberships = useAppSelector(selectOrganizationMemberships)
  const projectMemberships = useAppSelector(selectProjectMemberships)

  const canCreateProject = useCallback(
    ({ organizationId }: { organizationId: string | null }) => {
      if (!organizationId) return false
      const isOrganizationOwnerOrAdmin = [...(organizationMemberships ?? [])].some(
        (membership) =>
          membership.organizationId === organizationId &&
          ownerOrAdminRoles.includes(membership.role),
      )

      return isOrganizationOwnerOrAdmin
    },
    [organizationMemberships],
  )

  const canAccessStudio = useCallback(
    ({ projectId }: { projectId: string | null }) => {
      const isProjectOwnerOrAdmin = [...(projectMemberships ?? [])].some(
        (membership) =>
          membership.projectId === projectId && ownerOrAdminRoles.includes(membership.role),
      )
      return isProjectOwnerOrAdmin
    },
    [projectMemberships],
  )

  const isPremiumMember = useAppSelector(selectIsPremiumMember)
  return useMemo(
    () => ({
      abilities: { canAccessStudio, canCreateProject },
      isPremiumMember,
    }),
    [canAccessStudio, canCreateProject, isPremiumMember],
  )
}
