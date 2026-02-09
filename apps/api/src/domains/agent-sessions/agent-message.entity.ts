import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm"
import { AgentMessageFeedback } from "@/domains/agent-message-feedback/agent-message-feedback.entity"
import { AgentSession } from "./agent-session.entity"

export type MessageStatus = "streaming" | "completed" | "aborted" | "error"

@Entity("agent_message")
@Index(["sessionId", "createdAt"])
export class AgentMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string

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

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

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
