import type { FeatureFlagsDto } from "@caseai-connect/api-contracts"

export type OrganizationMembershipRoleDto = "owner" | "admin" | "member"

export type OrganizationMembershipDto = {
  id: string
  organizationId: string
  userId: string
  role: OrganizationMembershipRoleDto
}

export type OrganizationDto = {
  id: string
  name: string
  featureFlags: FeatureFlagsDto
}
