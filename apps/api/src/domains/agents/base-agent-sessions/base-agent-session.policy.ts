import type { ConversationAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"

export class BaseAgentSessionPolicy extends ProjectScopedPolicy<ConversationAgentSession> {
  private readonly type: ConversationAgentSessionTypeDto
  constructor(
    context: ConstructorParameters<typeof ProjectScopedPolicy>[0],
    type: ConversationAgentSessionTypeDto,
  ) {
    super(context)
    this.type = type
  }

  canCreate(): boolean {
    if (this.isPlayground()) {
      return this.canAccessProject() && this.isAdminOrOwner()
    }
    return this.canAccessProject()
  }

  canList(): boolean {
    if (this.isPlayground()) {
      return this.canAccessProject() && this.isAdminOrOwner()
    }
    return this.canAccessProject()
  }

  protected isPlayground(): boolean {
    return this.type === "playground"
  }
}
