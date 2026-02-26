import type { ProjectMembership } from "./project-memberships.models"

export interface IProjectMembershipsSpi {
  getAll: (params: { organizationId: string; projectId: string }) => Promise<ProjectMembership[]>
  invite: (params: {
    organizationId: string
    projectId: string
    emails: string[]
  }) => Promise<ProjectMembership[]>
  remove: (params: {
    organizationId: string
    projectId: string
    membershipId: string
  }) => Promise<void>
}
