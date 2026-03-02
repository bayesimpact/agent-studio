import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { ConversationAgentSession } from "../conversation-agent-session.entity"

export class AppPrivateSessionPolicy extends ProjectScopedPolicy<ConversationAgentSession> {
  canCreate(): boolean {
    return this.canAccessProject()
  }
}
