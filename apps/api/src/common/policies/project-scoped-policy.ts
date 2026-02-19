import { BasePolicy } from "@/common/policies/base-policy"
import type { UserMembership } from "@/domains/organizations/user-membership.entity"
import type { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import type { Project } from "@/domains/projects/project.entity"

export class ProjectScopedPolicy<T> extends BasePolicy<T> {
  protected readonly project: Project
  protected readonly projectMembership?: ProjectMembership

  constructor(
    protected readonly context: {
      userMembership: UserMembership
      projectMembership?: ProjectMembership
      project: Project
    },
    protected readonly entity?: T,
  ) {
    super(context.userMembership, entity)
    this.project = context.project
    this.projectMembership = context.projectMembership
  }

  canList(): boolean {
    return this.canAccessProject()
  }

  canCreate(): boolean {
    return this.isAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.doesResourceBelongToProject() && this.canAccessProject()
  }

  canDelete(): boolean {
    return this.doesResourceBelongToProject() && this.canAccessProject()
  }

  protected canAccessProject(): boolean {
    return this.isAdminOrOwner() || this.isMemberOfProject()
  }

  protected isMemberOfProject(): boolean {
    return this.projectMembership?.projectId === this.project.id
  }

  protected doesResourceBelongToProject(): boolean {
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
