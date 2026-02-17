import type { Organization } from "@/domains/organizations/organization.entity"
import type { Project } from "@/domains/projects/project.entity"

export type ConnectRequiredFields = {
  organizationId: string
  projectId: string
  userId?: string | undefined
}

export type ConnectRequiredTransientParams = {
  organization: Organization
  project: Project
}
