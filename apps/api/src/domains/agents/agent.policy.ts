import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { OrganizationMembership } from "../organizations/memberships/organization-membership.entity"
import type { ProjectMembership } from "../projects/memberships/project-membership.entity"
import type { Agent } from "./agent.entity"
import type { AgentMembership } from "./memberships/agent-membership.entity"

export class AgentPolicy extends ProjectScopedPolicy<Agent> {
  protected readonly agentMembership?: AgentMembership

  constructor(
    protected readonly context: {
      organizationMembership: OrganizationMembership
      projectMembership?: ProjectMembership
      agentMembership?: AgentMembership
    },
    protected readonly entity?: Agent,
  ) {
    super(context, entity)
    this.agentMembership = context.agentMembership
  }

  canList(): boolean {
    return this.canAccess()
  }

  canCreate(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.doesResourceBelongToScope() && this.isAgentAdminOrOwner() && this.canAccessAgent()
  }

  canDelete(): boolean {
    return this.canUpdate()
  }

  protected canAccessAgent(): boolean {
    return this.agentMembership?.agentId === this.entity?.id
  }

  protected isAgentOwner(): boolean {
    return this.agentMembership?.role === "owner"
  }

  protected isAgentAdmin(): boolean {
    return this.agentMembership?.role === "admin"
  }

  protected isAgentAdminOrOwner(): boolean {
    return this.isAgentAdmin() || this.isAgentOwner()
  }
}
