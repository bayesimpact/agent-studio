import type { MembershipRoleDto } from "@caseai-connect/api-contracts"

export type Organization = {
  id: string
  name: string
  role: MembershipRoleDto
}
