import type { Organization } from "@/domains/organizations/organization.entity"
import type { Project } from "@/domains/projects/project.entity"

export type ConnectRequiredFields = {
  organizationId: string
  projectId: string
}

export type ConnectRequiredTransientParams = {
  organization: Organization
  project: Project
}
