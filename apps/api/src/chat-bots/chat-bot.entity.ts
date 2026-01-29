import type { ChatBotLocale, ChatBotModel, ChatBotTemperature } from "@caseai-connect/api-contracts"
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { ChatSession } from "@/chat-sessions/chat-session.entity"
import { Project } from "@/projects/project.entity"

@Entity("chat_bot")
export class ChatBot {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar" })
  name!: string

  @Column({ type: "text", name: "default_prompt" })
  defaultPrompt!: string

  @Column({ type: "varchar" })
  model!: ChatBotModel

  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  temperature!: ChatBotTemperature

  @Column({ type: "varchar" })
  locale!: ChatBotLocale

  @Column({ type: "uuid", name: "project_id" })
  projectId!: string

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @ManyToOne(
    () => Project,
    (project) => project.chatBots,
  )
  @JoinColumn({ name: "project_id" })
  project!: Project

  @OneToMany(
    () => ChatSession,
    (chatSession) => chatSession.chatbot,
  )
  chatSessions!: ChatSession[]
}
