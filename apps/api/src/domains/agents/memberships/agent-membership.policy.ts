import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { AgentMembership } from "./agent-membership.entity"

export class AgentMembershipPolicy extends ProjectScopedPolicy<AgentMembership> {
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
