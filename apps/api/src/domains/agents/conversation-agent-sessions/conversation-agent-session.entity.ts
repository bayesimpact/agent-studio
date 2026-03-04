import { Column, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { Agent } from "@/domains/agents/agent.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { User } from "@/domains/users/user.entity"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { AgentMessage } from "../shared/agent-session-messages/agent-message.entity"

@ConnectEntity("conversation_agent_session", "agentId", "type")
export class ConversationAgentSession extends ConnectEntityBase {
  @Column({ type: "uuid", name: "agent_id" })
  agentId!: string

  @Column({ type: "uuid", name: "trace_id", nullable: true })
  traceId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "varchar" })
  type!: BaseAgentSessionType

  @Column({ type: "timestamp", nullable: true, name: "expires_at" }) // FIXME: to be removed
  expiresAt!: Date | null

  @ManyToOne(
    () => Agent,
    (agent) => agent.conversationAgentSessions,
  )
  @JoinColumn({ name: "agent_id" })
  agent!: Agent

  @ManyToOne(
    () => User,
    (user) => user.conversationAgentSessions,
  )
  @JoinColumn({ name: "user_id" })
  user!: User

  @ManyToOne(
    () => Organization,
    (organization) => organization.conversationAgentSessions,
  )
  @JoinColumn({ name: "organization_id" })
  organization!: Organization

  @OneToMany(
    () => AgentMessage,
    (message) => message.conversationAgentSession,
  )
  messages!: AgentMessage[]
}
