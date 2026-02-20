import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { AgentSession } from "../agent-session.entity"

export class AppPrivateSessionPolicy extends ProjectScopedPolicy<AgentSession> {
  canCreate(): boolean {
    return this.canAccessProject()
  }
}
