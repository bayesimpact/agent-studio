import { Injectable } from "@nestjs/common"
import type { EntityManager, EntityTarget } from "typeorm"
import type { Agent } from "../agent.entity"
import { ConversationAgentSession } from "../conversation-agent-sessions/conversation-agent-session.entity"
import { ExtractionAgentSession } from "../extraction-agent-sessions/extraction-agent-session.entity"
import { FormAgentSession } from "../form-agent-sessions/form-agent-session.entity"
import { AgentMessage } from "../shared/agent-session-messages/agent-message.entity"
import { AgentMessageFeedback } from "../shared/agent-session-messages/feedback/agent-message-feedback.entity"

type AgentSession = ConversationAgentSession | FormAgentSession | ExtractionAgentSession

const sessionEntityByType: Record<Agent["type"], EntityTarget<AgentSession>> = {
  conversation: ConversationAgentSession,
  form: FormAgentSession,
  extraction: ExtractionAgentSession,
} as const

@Injectable()
export class BaseAgentSessionsService {
  async deleteAgentSessions(
    entityManager: EntityManager,
    agentId: string,
    agentType: Agent["type"],
  ): Promise<void> {
    const sessions = await this.getAllSessions(entityManager, agentId, agentType)

    for (const session of sessions) {
      await this.deleteSessionMessages(entityManager, session.id)
    }

    await entityManager.delete(sessionEntityByType[agentType] as EntityTarget<AgentSession>, {
      agentId,
    })
  }

  private async getAllSessions(
    entityManager: EntityManager,
    agentId: string,
    agentType: Agent["type"],
  ): Promise<{ id: string }[]> {
    return entityManager.find(sessionEntityByType[agentType] as EntityTarget<AgentSession>, {
      where: { agentId },
      select: { id: true },
    })
  }

  private async deleteSessionMessages(
    entityManager: EntityManager,
    sessionId: string,
  ): Promise<void> {
    const agentMessages = await entityManager.find(AgentMessage, {
      where: { sessionId },
      select: { id: true },
    })
    for (const agentMessage of agentMessages) {
      await entityManager.delete(AgentMessageFeedback, { agentMessageId: agentMessage.id })
    }
    await entityManager.delete(AgentMessage, { sessionId })
  }
}
