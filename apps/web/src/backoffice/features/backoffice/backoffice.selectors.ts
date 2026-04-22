import type { RootState } from "@/common/store"

export const selectBackofficeOrganizations = (state: RootState) => state.backoffice.organizations
export const selectBackofficeUsers = (state: RootState) => state.backoffice.users
