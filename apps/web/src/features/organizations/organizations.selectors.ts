import type { RootState } from "@/store"

export const selectOrganizations = (state: RootState) => state.organizations.data.value

export const selectOrganizationsStatus = (state: RootState) => state.organizations.data.status

export const selectOrganizationsError = (state: RootState) => state.organizations.data.error

export const selectCurrentOrganizationId = (state: RootState) =>
  state.organizations.currentOrganizationId

export const selectCurrentOrganization = (state: RootState) =>
  state.organizations.data.value?.find((org) => org.id === selectCurrentOrganizationId(state))
