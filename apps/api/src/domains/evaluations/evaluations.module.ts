import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { EvaluationContextResolver } from "@/common/context/resolvers/evaluation-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { AuthModule } from "@/domains/auth/auth.module"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { ProjectsModule } from "@/domains/projects/projects.module"
import { UsersModule } from "@/domains/users/users.module"
import { Evaluation } from "./evaluation.entity"
import { EvaluationGuard } from "./evaluation.guard"
import { EvaluationsController } from "./evaluations.controller"
import { EvaluationsService } from "./evaluations.service"
import { EvaluationReport } from "./reports/evaluation-report.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluation,
      Project,
      Organization,
      UserMembership,
      ProjectMembership,
      EvaluationReport,
    ]),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    EvaluationsService,
    EvaluationGuard,
    ResourceContextGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    EvaluationContextResolver,
  ],
  controllers: [EvaluationsController],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
