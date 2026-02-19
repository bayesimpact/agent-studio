import type { Organization } from "@/domains/organizations/organization.entity"
import type { Project } from "@/domains/projects/project.entity"

export type RequiredConnectScope = {
  organizationId: string
  projectId: string
  userId?: string | undefined
}

export type RequiredScopeTransientParams = {
  organization: Organization
  project: Project
}
