import type { InviteProjectMembersPayload, ProjectMembership } from "./project-memberships.models"

export interface IProjectMembershipsSpi {
  getAll: (organizationId: string, projectId: string) => Promise<ProjectMembership[]>
  invite: (
    organizationId: string,
    projectId: string,
    payload: InviteProjectMembersPayload,
  ) => Promise<ProjectMembership[]>
  remove: (organizationId: string, projectId: string, membershipId: string) => Promise<void>
}
