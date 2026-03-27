import type { UserMembershipsDto } from "../../../../../packages/api-contracts/src/me/me.dto"
import type { Organization } from "../organizations/organizations.models"

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
