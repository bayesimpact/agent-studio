import { BasePolicy } from "@/common/policies/base-policy"
import type { Project } from "./project.entity"

export class ProjectPolicy extends BasePolicy<Project> {
  canList(): boolean {
    return true
  }

  canCreate(): boolean {
    return this.isAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.doesResourceBelongToOrganization() && this.isAdminOrOwner()
  }

  canDelete(): boolean {
    return this.doesResourceBelongToOrganization() && this.isAdminOrOwner()
  }
}
