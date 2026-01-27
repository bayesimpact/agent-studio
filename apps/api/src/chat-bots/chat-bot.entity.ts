import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { Project } from "@/projects/project.entity"

@Entity("chat_bot")
export class ChatBot {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar" })
  name!: string

  @Column({ type: "text", name: "default_prompt" })
  defaultPrompt!: string

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
}
