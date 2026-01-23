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
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { Organization } from "@/organizations/organization.entity"

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar" })
  name!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @ManyToOne(
    () => Organization,
    (organization) => organization.projects,
  )
  @JoinColumn({ name: "organization_id" })
  organization!: Organization

  @OneToMany(
    () => ChatBot,
    (chatBot) => chatBot.project,
  )
  chatBots!: ChatBot[]
}
