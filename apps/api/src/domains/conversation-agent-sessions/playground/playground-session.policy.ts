import { BasePolicy } from "@/common/policies/base-policy"
import type { ConversationAgentSession } from "../conversation-agent-session.entity"

export class PlaygroundSessionPolicy extends BasePolicy<ConversationAgentSession> {
  canList(): boolean {
    return this.isAdminOrOwner()
  }

  canCreate(): boolean {
    return this.isAdminOrOwner()
  }
}
