import { Column, Entity, OneToMany } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { ReviewCampaignMembership } from "@/domains/review-campaigns/memberships/review-campaign-membership.entity"
import { ReviewerSessionReview } from "@/domains/review-campaigns/reviewer-session-reviews/reviewer-session-review.entity"
import { TesterCampaignSurvey } from "@/domains/review-campaigns/tester-campaign-surveys/tester-campaign-survey.entity"
import { AgentMessageFeedback } from "../agents/shared/agent-session-messages/feedback/agent-message-feedback.entity"

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
    () => OrganizationMembership,
    (membership) => membership.user,
  )
  memberships!: OrganizationMembership[]

  @OneToMany(
    () => ConversationAgentSession,
    (conversationAgentSession) => conversationAgentSession.user,
  )
  conversationAgentSessions!: ConversationAgentSession[]

  @OneToMany(
    () => AgentMessageFeedback,
    (agentMessageFeedback) => agentMessageFeedback.user,
  )
  agentMessageFeedbacks!: AgentMessageFeedback[]

  @OneToMany(
    () => ProjectMembership,
    (projectMembership) => projectMembership.user,
  )
  projectMemberships!: ProjectMembership[]

  @OneToMany(
    () => AgentMembership,
    (agentMembership) => agentMembership.user,
  )
  agentMemberships!: AgentMembership[]

  @OneToMany(
    () => ReviewCampaignMembership,
    (reviewCampaignMembership) => reviewCampaignMembership.user,
  )
  reviewCampaignMemberships!: ReviewCampaignMembership[]

  @OneToMany(
    () => TesterCampaignSurvey,
    (testerCampaignSurvey) => testerCampaignSurvey.user,
  )
  testerCampaignSurveys!: TesterCampaignSurvey[]

  @OneToMany(
    () => ReviewerSessionReview,
    (reviewerSessionReview) => reviewerSessionReview.reviewerUser,
  )
  reviewerSessionReviews!: ReviewerSessionReview[]
}
