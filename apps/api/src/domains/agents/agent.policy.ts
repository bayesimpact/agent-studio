import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { Agent } from "./agent.entity"

export class AgentPolicy extends ProjectScopedPolicy<Agent> {
  // TODO: check agentMembership to know if user can list, create, ...
}
