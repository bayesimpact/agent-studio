import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ReviewCampaignContextResolver } from "@/common/context/resolvers/review-campaign-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { Agent } from "@/domains/agents/agent.entity"
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      Organization,
      OrganizationMembership,
      Project,
      ProjectMembership,
      ReviewCampaign,
      ReviewCampaignMembership,
      User,
    ]),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    OrganizationContextResolver,
    ProjectContextResolver,
    ResourceContextGuard,
    ReviewCampaignContextResolver,
    ReviewCampaignsGuard,
    ReviewCampaignsService,
  ],
  controllers: [ReviewCampaignsController],
  exports: [ReviewCampaignsService],
})
export class ReviewCampaignsModule {}
