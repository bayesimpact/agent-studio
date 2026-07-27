import { BasePolicy } from "@/common/policies/base-policy"
import type { OrganizationMembershipContextModel } from "@/domains/organizations/memberships/organization-membership.model"
import type { ProjectMembershipRole } from "@/domains/projects/memberships/project-membership.types"

/** Structural shapes: only what the policy reads (avoids cross-domain entity imports). */
type ProjectLike = { id: string }
type ProjectMembershipLike = { projectId: string; role: ProjectMembershipRole }

export class ProjectsAnalyticsPolicy extends BasePolicy<ProjectLike> {
  private readonly projectMembership?: ProjectMembershipLike

  constructor(
    context: {
      organizationMembership: OrganizationMembershipContextModel
      projectMembership?: ProjectMembershipLike
    },
    entity?: ProjectLike,
  ) {
    super(context.organizationMembership, entity)
    this.projectMembership = context.projectMembership
  }

  /**
   * Analytics are sensitive: only project `admin` and `owner` roles can access.
   */
  canList(): boolean {
    return this.isMemberOfProject() && this.isProjectAdminOrOwner()
  }

  private isMemberOfProject(): boolean {
    return this.projectMembership?.projectId === this.entity?.id
  }

  private isProjectAdminOrOwner(): boolean {
    return this.projectMembership?.role === "admin" || this.projectMembership?.role === "owner"
  }
}
