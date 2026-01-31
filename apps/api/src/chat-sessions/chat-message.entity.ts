import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm"
import { ChatSession } from "./chat-session.entity"

export type MessageStatus = "streaming" | "completed" | "aborted" | "error"

@Entity("chat_message")
@Index(["sessionId", "createdAt"])
export class ChatMessage {
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
    () => ChatSession,
    (chatSession) => chatSession.messages,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "session_id" })
  session!: ChatSession
}
