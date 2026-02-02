import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { Organization } from "@/organizations/organization.entity"
import { User } from "@/users/user.entity"
import { ChatMessage } from "./chat-message.entity"

export type ChatSessionType = "playground" | "production" | "app-private"

@Entity("chat_session")
@Index(["chatBotId", "type"])
@Index(["organizationId", "type"])
@Index(["expiresAt"])
export class ChatSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "uuid", name: "chat_bot_id" })
  chatBotId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @Column({ type: "varchar" })
  type!: ChatSessionType

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
  @JoinColumn({ name: "chat_bot_id" })
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

  @OneToMany(
    () => ChatMessage,
    (message) => message.session,
  )
  messages!: ChatMessage[]
}
