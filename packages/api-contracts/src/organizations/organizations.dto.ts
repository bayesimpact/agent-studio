import type { FeatureFlagsDto } from "@caseai-connect/api-contracts"

export type OrganizationDto = {
  id: string
  name: string
  role: OrganizationMembershipRoleDto
  featureFlags: FeatureFlagsDto
}

export type OrganizationMembershipRoleDto = "owner" | "admin" | "member"
