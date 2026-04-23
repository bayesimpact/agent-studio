import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentSessionInCampaignContextResolver } from "@/common/context/resolvers/agent-session-in-campaign-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ReviewCampaignContextResolver } from "@/common/context/resolvers/review-campaign-context.resolver"
import { ReviewCampaignMembershipContextResolver } from "@/common/context/resolvers/review-campaign-membership-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { Agent } from "@/domains/agents/agent.entity"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { ConversationAgentSessionsModule } from "@/domains/agents/conversation-agent-sessions/conversation-agent-sessions.module"
import { ExtractionAgentSession } from "@/domains/agents/extraction-agent-sessions/extraction-agent-session.entity"
import { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
import { FormAgentSessionsModule } from "@/domains/agents/form-agent-sessions/form-agent-sessions.module"
import { AuthModule } from "@/domains/auth/auth.module"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { ProjectsModule } from "@/domains/projects/projects.module"
import { User } from "@/domains/users/user.entity"
import { UsersModule } from "@/domains/users/users.module"
import { ReviewCampaignMembership } from "./memberships/review-campaign-membership.entity"
import { ReviewCampaign } from "./review-campaign.entity"
import { ReviewCampaignsController } from "./review-campaigns.controller"
import { ReviewCampaignsGuard } from "./review-campaigns.guard"
import { ReviewCampaignsService } from "./review-campaigns.service"
import {
  TesterController,
  TesterMeController,
  TesterSessionFeedbackController,
} from "./tester/tester.controller"
import { TesterGuard } from "./tester/tester.guard"
import { TesterService } from "./tester/tester.service"
import { TesterCampaignSurvey } from "./tester-campaign-surveys/tester-campaign-survey.entity"
import { TesterSessionFeedback } from "./tester-session-feedbacks/tester-session-feedback.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      ConversationAgentSession,
      ExtractionAgentSession,
      FormAgentSession,
      Organization,
      OrganizationMembership,
      Project,
      ProjectMembership,
      ReviewCampaign,
      ReviewCampaignMembership,
      TesterCampaignSurvey,
      TesterSessionFeedback,
      User,
    ]),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
    forwardRef(() => ConversationAgentSessionsModule),
    forwardRef(() => FormAgentSessionsModule),
  ],
  providers: [
    AgentSessionInCampaignContextResolver,
    OrganizationContextResolver,
    ProjectContextResolver,
    ResourceContextGuard,
    ReviewCampaignContextResolver,
    ReviewCampaignMembershipContextResolver,
    ReviewCampaignsGuard,
    ReviewCampaignsService,
    TesterGuard,
    TesterService,
  ],
  controllers: [
    ReviewCampaignsController,
    TesterController,
    TesterMeController,
    TesterSessionFeedbackController,
  ],
  exports: [ReviewCampaignsService, TesterService],
})
export class ReviewCampaignsModule {}
