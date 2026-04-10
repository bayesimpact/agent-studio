import { AgentPolicy } from "@/domains/agents/agent.policy"

export class AgentsAnalyticsPolicy extends AgentPolicy {
  /**
   * Agent-level analytics: only **agent** owners may access (project role is not sufficient).
   */
  canList(): boolean {
    return this.canAccessAgent() && this.isAgentAdminOrOwner()
  }
}
