import type { RootState } from "@/common/store"
import type { Me } from "./me.models"

export const selectMe = (state: RootState) => state.me.data
export const selectMeStatus = (state: RootState) => state.me.data.status
export const selectMeError = (state: RootState) => state.me.data.error

export const selectIsPremiumMember = (state: RootState): boolean => {
  const emailDomain = import.meta.env.VITE_PREMIUM_EMAIL_DOMAIN as string | undefined
  if (!emailDomain) return false
  return !!state.me.data?.value?.email.endsWith(emailDomain)
}

export const selectIsBackofficeAuthorized = (state: RootState): boolean =>
  state.me.data.value?.isBackofficeAuthorized ?? false

export const ownerOrAdminRoles = ["owner", "admin"] as Partial<
  Me["user"]["memberships"]["organizationMemberships"][number]["role"]
>[]

export const selectOrganizationMemberships = (state: RootState) =>
  state.me.data.value?.memberships.organizationMemberships

export const selectProjectMemberships = (state: RootState) =>
  state.me.data.value?.memberships.projectMemberships

export const selectAgentMemberships = (state: RootState) =>
  state.me.data.value?.memberships.agentMemberships

export const selectCanAccessStudioForOrganizationId =
  (organizationId: string) =>
  (state: RootState): boolean => {
    const memberships = state.me.data.value?.memberships
    if (!memberships) return false
    return memberships.organizationMemberships.some(
      (membership) =>
        membership.organizationId === organizationId && ownerOrAdminRoles.includes(membership.role),
    )
  }
