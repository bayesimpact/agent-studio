import type { MembershipRoleDto } from "../organizations/organizations.dto"

export type MeResponseDto = {
  user: {
    id: string
    email: string
    name: string | null
  }
  organizations: Array<{
    id: string
    name: string
    role: MembershipRoleDto
  }>
}
