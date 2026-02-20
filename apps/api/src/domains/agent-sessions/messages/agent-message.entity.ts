import { Column, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { AgentMessageFeedback } from "@/domains/agent-sessions/messages/feedback/agent-message-feedback.entity"
import { Document } from "@/domains/documents/document.entity"
import { AgentSession } from "../agent-session.entity"

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

  @Column({ type: "uuid", name: "document_id", nullable: true })
  documentId!: string | null

  @OneToOne(() => Document, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "document_id" })
  document!: Document | null

  @OneToMany(
    () => AgentMessageFeedback,
    (agentMessageFeedback) => agentMessageFeedback.agentMessage,
  )
  agentMessageFeedbacks!: AgentMessageFeedback[]
}
