import { BasePolicy } from "@/common/policies/base-policy"
import type { UserMembership } from "@/domains/organizations/user-membership.entity"
import type { Project } from "@/domains/projects/project.entity"
import type { Document } from "./document.entity"

export class DocumentPolicy extends BasePolicy<Document> {
  constructor(
    userMembership: UserMembership,
    resource?: Document,
    private readonly project?: Project,
  ) {
    super(userMembership, resource)
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
    if (!this.resource) return false

    // Ensure resource is an object (not a primitive) before using 'in' operator
    if (typeof this.resource !== "object") {
      return false
    }

    // Check if resource has projectId property using 'in' operator
    if (!("projectId" in this.resource)) {
      return false
    }

    return this.resource.projectId === this.project?.id
  }
}
