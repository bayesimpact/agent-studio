import type { OrganizationDto } from "../organizations/organizations.dto"

export type MeResponseDto = {
  user: {
    id: string
    email: string
    name: string | null
  }
  organizations: Array<OrganizationDto>
}
