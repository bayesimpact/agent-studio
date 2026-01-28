import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { ChatSession } from "@/chat-sessions/chat-session.entity"
import { Project } from "@/projects/project.entity"
import { UserMembership } from "./user-membership.entity"

@Entity("organization")
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar" })
  name!: string

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @OneToMany(
    () => UserMembership,
    (membership) => membership.organization,
  )
  memberships!: UserMembership[]

  @OneToMany(
    () => Project,
    (project) => project.organization,
  )
  projects!: Project[]

  @OneToMany(
    () => ChatSession,
    (chatSession) => chatSession.organization,
  )
  chatSessions!: ChatSession[]
}
