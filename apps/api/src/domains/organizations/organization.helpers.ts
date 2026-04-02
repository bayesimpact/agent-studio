import type { OrganizationDto } from "@caseai-connect/api-contracts"
import type { Organization } from "./organization.entity"

export function toDto(organization: Organization): OrganizationDto {
  return {
    id: organization.id,
    name: organization.name,
  }
}
