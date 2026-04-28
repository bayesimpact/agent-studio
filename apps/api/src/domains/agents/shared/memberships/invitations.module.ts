import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
import { AgentMembershipsService } from "@/domains/agents/memberships/agent-memberships.service"
import { AuthModule } from "@/domains/auth/auth.module"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { ProjectMembershipsService } from "@/domains/projects/memberships/project-memberships.service"
import { ReviewCampaignMembership } from "@/domains/review-campaigns/memberships/review-campaign-membership.entity"
import { ReviewCampaignMembershipsService } from "@/domains/review-campaigns/memberships/review-campaign-memberships.service"
import { ReviewCampaign } from "@/domains/review-campaigns/review-campaign.entity"
import { UsersModule } from "@/domains/users/users.module"
import { LlmModule } from "@/external/llm/llm.module"
import { InvitationsController } from "./invitations.controller"
import { InvitationsService } from "./invitations.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentMembership,
      OrganizationMembership,
      ProjectMembership,
      ReviewCampaign,
      ReviewCampaignMembership,
    ]),
    LlmModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    AgentMembershipsService,
    ProjectMembershipsService,
    ReviewCampaignMembershipsService,
    InvitationsService,
  ],
  controllers: [InvitationsController],
  exports: [],
})
export class InvitationsModule {}
