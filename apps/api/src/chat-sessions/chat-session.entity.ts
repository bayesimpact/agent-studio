import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { Organization } from "@/organizations/organization.entity"
import { User } from "@/users/user.entity"

export type ChatSessionType = "playground" | "production" | "end-user-private" | "end-user-public"

@Entity("chat_session")
@Index(["chatbotId", "type"])
@Index(["organizationId", "type"])
@Index(["expiresAt"])
export class ChatSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "uuid", name: "chatbot_id" })
  chatbotId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @Column({ type: "varchar" })
  type!: ChatSessionType

  @Column({ type: "jsonb" })
  messages!: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    status?: "streaming" | "completed" | "aborted" | "error"
    createdAt?: string
    startedAt?: string
    completedAt?: string
    toolCalls?: Array<{
      id: string
      name: string
      arguments: Record<string, unknown>
    }>
  }>

  @Column({ type: "timestamp", nullable: true, name: "expires_at" })
  expiresAt!: Date | null

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @ManyToOne(
    () => ChatBot,
    (chatBot) => chatBot.chatSessions,
  )
  @JoinColumn({ name: "chatbot_id" })
  chatbot!: ChatBot

  @ManyToOne(
    () => User,
    (user) => user.chatSessions,
  )
  @JoinColumn({ name: "user_id" })
  user!: User

  @ManyToOne(
    () => Organization,
    (organization) => organization.chatSessions,
  )
  @JoinColumn({ name: "organization_id" })
  organization!: Organization
}
