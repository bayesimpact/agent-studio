import type { RootState } from "@/store"

export const selectOrganizations = (state: RootState) => state.organizations.organizations

export const selectOrganizationsStatus = (state: RootState) => state.organizations.status

export const selectOrganizationsError = (state: RootState) => state.organizations.error

export const selectCurrentOrganizationId = (state: RootState) =>
  state.organizations.currentOrganizationId

export const selectCurrentOrganization = (state: RootState) =>
  state.organizations.organizations.find((org) => org.id === selectCurrentOrganizationId(state))
