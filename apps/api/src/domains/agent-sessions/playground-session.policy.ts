import { BasePolicy } from "@/common/policies/base-policy"
import type { AgentSession } from "./agent-session.entity"

export class PlaygroundSessionPolicy extends BasePolicy<AgentSession> {
  canList(): boolean {
    return this.isAdminOrOwner()
  }

  canCreate(): boolean {
    return this.isAdminOrOwner()
  }
}
