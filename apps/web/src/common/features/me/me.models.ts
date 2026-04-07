import type { UserMembershipsDto } from "@caseai-connect/api-contracts"
import type { Organization } from "@/features/organizations/organizations.models"

export type User = {
  id: string
  email: string
  name: string
  memberships: UserMembershipsDto
}

export type Me = {
  user: User
  organizations: Organization[]
}
