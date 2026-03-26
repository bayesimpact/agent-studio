import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { ProjectMembership } from "./project-membership.entity"

export class ProjectMembershipPolicy extends ProjectScopedPolicy<ProjectMembership> {
  canList(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canCreate(): boolean {
    return this.canList()
  }

  canUpdate(): boolean {
    return this.canList()
  }

  canDelete(): boolean {
    return this.canList()
  }
}
