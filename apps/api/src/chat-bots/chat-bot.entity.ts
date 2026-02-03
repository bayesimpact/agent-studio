import type { ChatBotLocale, ChatBotModel, ChatBotTemperature } from "@caseai-connect/api-contracts"
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { ChatSession } from "@/chat-sessions/chat-session.entity"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { Project } from "@/projects/project.entity"

@Entity("chat_bot")
export class ChatBot extends Base4AllEntity {
  @Column({ type: "uuid", name: "project_id" })
  projectId!: string

  @ManyToOne(
    () => Project,
    (project) => project.chatBots,
  )
  @JoinColumn({ name: "project_id" })
  project!: Project

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

  @OneToMany(
    () => ChatSession,
    (chatSession) => chatSession.chatbot,
  )
  chatSessions!: ChatSession[]
}
