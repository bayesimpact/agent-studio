import { Column, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { AgentMessageFeedback } from "@/domains/agent-message-feedback/agent-message-feedback.entity"
import { AgentSession } from "./agent-session.entity"

export type MessageStatus = "streaming" | "completed" | "aborted" | "error"

@ConnectEntity("agent_message", "sessionId", "createdAt")
export class AgentMessage extends ConnectEntityBase {
  @Column({ type: "uuid", name: "session_id" })
  sessionId!: string

  @Column({ type: "varchar" })
  role!: "user" | "assistant"

  @Column({ type: "text" })
  content!: string

  @Column({ type: "varchar", nullable: true })
  status!: MessageStatus | null

  @Column({ type: "timestamp", nullable: true, name: "started_at" })
  startedAt!: Date | null

  @Column({ type: "timestamp", nullable: true, name: "completed_at" })
  completedAt!: Date | null

  @Column({ type: "jsonb", nullable: true, name: "tool_calls" })
  toolCalls!: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
  }> | null

  @ManyToOne(
    () => AgentSession,
    (agentSession) => agentSession.messages,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "session_id" })
  session!: AgentSession

  @OneToMany(
    () => AgentMessageFeedback,
    (agentMessageFeedback) => agentMessageFeedback.agentMessage,
  )
  agentMessageFeedbacks!: AgentMessageFeedback[]
}
