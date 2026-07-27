import { BasePolicy } from "@/common/policies/base-policy"
import type { OrganizationMembershipContextModel } from "@/domains/organizations/memberships/organization-membership.model"
import type { ProjectMembershipFixture } from "@/domains/projects/memberships/project-membership.types"
import type { Project } from "@/domains/projects/project.entity"

export class ProjectsAnalyticsPolicy extends BasePolicy<Project> {
  private readonly projectMembership?: ProjectMembershipFixture

  constructor(
    context: {
      organizationMembership: OrganizationMembershipContextModel
      projectMembership?: ProjectMembershipFixture
    },
    entity?: Project,
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
