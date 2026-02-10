import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { Agent } from "./agent.entity"

export class AgentPolicy extends ProjectScopedPolicy<Agent> {
  // we don't need any additional logic here, the default project-scoped policy is enough
}
