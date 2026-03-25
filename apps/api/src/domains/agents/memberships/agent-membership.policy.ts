import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { AgentMembership } from "./agent-membership.entity"

export class AgentMembershipPolicy extends ProjectScopedPolicy<AgentMembership> {
  canList(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canCreate(): boolean {
    return this.canList()
  }

  canUpdate(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner() && this.doesResourceBelongToScope()
  }

  canDelete(): boolean {
    return this.canUpdate()
  }
}
