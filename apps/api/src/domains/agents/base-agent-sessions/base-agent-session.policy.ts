import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import type { ExtractionAgentSession } from "../extraction-agent-sessions/extraction-agent-session.entity"
import type { FormAgentSession } from "../form-agent-sessions/form-agent-session.entity"

type AgentSession = ConversationAgentSession | ExtractionAgentSession | FormAgentSession
export class BaseAgentSessionPolicy extends ProjectScopedPolicy<AgentSession> {
  constructor(
    context: ConstructorParameters<typeof ProjectScopedPolicy>[0],
    entity?: AgentSession,
    private readonly type?: BaseAgentSessionTypeDto,
  ) {
    super(context, entity)
  }

  canCreate(): boolean {
    if (this.isLive()) {
      return this.canAccess()
    }
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canList(): boolean {
    if (this.isLive()) {
      return this.canAccess()
    }
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  protected isLive(): boolean {
    return this.type === "live"
  }
}
