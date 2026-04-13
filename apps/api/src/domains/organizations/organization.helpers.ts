import type { OrganizationDto } from "@caseai-connect/api-contracts"
import { toProjectDto } from "../projects/helpers"
import type { Project } from "../projects/project.entity"
import type { Organization } from "./organization.entity"

export function toDto(
  organization: Organization & {
    projects: Project[]
  },
): OrganizationDto {
  return {
    id: organization.id,
    name: organization.name,
    projects: organization.projects.map(toProjectDto),
    createdAt: organization.createdAt.getTime(),
  }
}
