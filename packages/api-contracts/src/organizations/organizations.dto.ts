import type { FeatureFlagsDto } from "@caseai-connect/api-contracts"

export type OrganizationDto = {
  id: string
  name: string
  role: MembershipRoleDto
  featureFlags: FeatureFlagsDto
}

export type MembershipRoleDto = "owner" | "admin" | "member"
