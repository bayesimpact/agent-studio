import { AgentMessageFeedback } from "@/domains/agent-message-feedback/agent-message-feedback.entity"
import { Column, Entity, OneToMany } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import { UserMembership } from "@/domains/organizations/user-membership.entity"

@Entity("user")
export class User extends Base4AllEntity {
  @Column({ type: "varchar", unique: true, name: "auth0_id" })
  auth0Id!: string

  @Column({ type: "varchar" })
  email!: string

  @Column({ type: "varchar", nullable: true })
  name!: string | null

  @Column({ type: "varchar", nullable: true, name: "picture_url" })
  pictureUrl!: string | null

  @OneToMany(
    () => UserMembership,
    (membership) => membership.user,
  )
  memberships!: UserMembership[]

  @OneToMany(
    () => AgentSession,
    (agentSession) => agentSession.user,
  )
  agentSessions!: AgentSession[]

  @OneToMany(
    () => AgentMessageFeedback,
    (agentMessageFeedback) => agentMessageFeedback.user,
  )
  agentMessageFeedbacks!: AgentMessageFeedback[]
}
