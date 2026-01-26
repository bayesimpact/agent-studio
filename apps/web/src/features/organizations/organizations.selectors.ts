import type { RootState } from "@/store"

export const selectOrganizations = (state: RootState) => state.organizations.organizations
export const selectCurrentOrganization = (organizationId: string) => (state: RootState) =>
  state.organizations.organizations.find((org) => org.id === organizationId) || null
export const selectCreatedOrganization = (state: RootState) =>
  state.organizations.createdOrganization
export const selectOrganizationsStatus = (state: RootState) => state.organizations.status
export const selectOrganizationsError = (state: RootState) => state.organizations.error
