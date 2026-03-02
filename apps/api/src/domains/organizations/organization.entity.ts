import { Column, Entity, OneToMany } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { ConversationAgentSession } from "@/domains/conversation-agent-sessions/conversation-agent-session.entity"
import { AgentMessageFeedback } from "@/domains/conversation-agent-sessions/messages/feedback/agent-message-feedback.entity"
import { Project } from "@/domains/projects/project.entity"
import { FeatureFlag } from "../feature-flags/feature-flag.entity"
import { UserMembership } from "./user-membership.entity"

@Entity("organization")
export class Organization extends Base4AllEntity {
  @Column({ type: "varchar" })
  name!: string

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
    () => ConversationAgentSession,
    (conversationAgentSession) => conversationAgentSession.organization,
  )
  conversationAgentSessions!: ConversationAgentSession[]

  @OneToMany(
    () => AgentMessageFeedback,
    (agentMessageFeedback) => agentMessageFeedback.organization,
  )
  agentMessageFeedbacks!: AgentMessageFeedback[]

  @OneToMany(
    () => FeatureFlag,
    (featureFlag) => featureFlag.organization,
  )
  featureFlags!: FeatureFlag[]
}
