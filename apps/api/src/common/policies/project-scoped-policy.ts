import { BasePolicy } from "@/common/policies/base-policy"
import type { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import type { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import type { Project } from "@/domains/projects/project.entity"

export class ProjectScopedPolicy<T> extends BasePolicy<T> {
  protected readonly project?: Project
  protected readonly projectMembership?: ProjectMembership

  constructor(
    protected readonly context: {
      organizationMembership: OrganizationMembership
      projectMembership?: ProjectMembership
      project?: Project
    },
    protected readonly entity?: T,
  ) {
    super(context.organizationMembership, entity)
    this.project = context.project
    this.projectMembership = context.projectMembership
  }

  canList(): boolean {
    return this.canAccess()
  }

  canCreate(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.canAccess() && this.doesResourceBelongToScope() && this.isProjectAdminOrOwner()
  }

  canDelete(): boolean {
    return this.canUpdate()
  }

  protected canAccess(): boolean {
    const organizationId = this.project?.organizationId
    if (!organizationId) return false // should not happen
    return (
      this.canAccessOrganization() && this.canAccessProject() && this.hasValidScope(organizationId)
    )
  }

  protected doesResourceBelongToScope(): boolean {
    return this.doesResourceBelongToOrganization() && this.doesResourceBelongToProject()
  }

  protected isProjectAdminOrOwner(): boolean {
    return this.isProjectAdmin() || this.isProjectOwner()
  }

  private canAccessProject(): boolean {
    return this.isMemberOfProject()
  }

  private isMemberOfProject(): boolean {
    return this.projectMembership?.projectId === this.project?.id
  }

  private isProjectOwner(): boolean {
    return this.projectMembership?.role === "owner"
  }

  private isProjectAdmin(): boolean {
    return this.projectMembership?.role === "admin"
  }

  private doesResourceBelongToProject(): boolean {
    if (!this.entity) return false

    // Ensure resource is an object (not a primitive) before using 'in' operator
    if (typeof this.entity !== "object") {
      return false
    }

    // Check if resource has projectId property using 'in' operator
    if (!("projectId" in this.entity)) {
      return false
    }

    return this.entity.projectId === this.project?.id
  }
}
