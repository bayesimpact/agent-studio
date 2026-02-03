export type CreateOrganizationRequestDto = {
  name: string
}

export type CreateOrganizationResponseDto = {
  id: string
  name: string
  role: MembershipRoleDto
}
export type MembershipRoleDto = "owner" | "admin" | "member"
