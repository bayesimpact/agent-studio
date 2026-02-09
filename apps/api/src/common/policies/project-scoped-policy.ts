import { BasePolicy } from "@/common/policies/base-policy"
import type { UserMembership } from "@/domains/organizations/user-membership.entity"
import type { Project } from "@/domains/projects/project.entity"

export class ProjectScopedPolicy<T> extends BasePolicy<T> {
  constructor(
    userMembership: UserMembership,
    protected readonly project?: Project,
    protected readonly entity?: T,
  ) {
    super(userMembership, entity)
    this.project = project
  }

  canList(): boolean {
    return this.isAdminOrOwner()
  }

  canCreate(): boolean {
    return this.isAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.doesResourceBelongToProject() && this.isAdminOrOwner()
  }

  canDelete(): boolean {
    return this.doesResourceBelongToProject() && this.isAdminOrOwner()
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
