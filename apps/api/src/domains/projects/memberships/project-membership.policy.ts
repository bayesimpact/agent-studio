import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { ProjectMembership } from "./project-membership.entity"

export class ProjectMembershipPolicy extends ProjectScopedPolicy<ProjectMembership> {
  canList(): boolean {
    return this.isAdminOrOwner()
  }

  canCreate(): boolean {
    return this.isAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.isAdminOrOwner()
  }

  canDelete(): boolean {
    return this.isAdminOrOwner()
  }
}
