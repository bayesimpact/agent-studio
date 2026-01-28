import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { ChatSession } from "@/chat-sessions/chat-session.entity"
import { UserMembership } from "@/organizations/user-membership.entity"

@Entity("user")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar", unique: true, name: "auth0_id" })
  auth0Id!: string

  @Column({ type: "varchar" })
  email!: string

  @Column({ type: "varchar", nullable: true })
  name!: string | null

  @Column({ type: "varchar", nullable: true, name: "picture_url" })
  pictureUrl!: string | null

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @OneToMany(
    () => UserMembership,
    (membership) => membership.user,
  )
  memberships!: UserMembership[]

  @OneToMany(
    () => ChatSession,
    (chatSession) => chatSession.user,
  )
  chatSessions!: ChatSession[]
}
