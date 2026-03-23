import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { EvaluationContextResolver } from "@/common/context/resolvers/evaluation-context.resolver"
import { EvaluationReportContextResolver } from "@/common/context/resolvers/evaluation-report-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { AuthModule } from "@/domains/auth/auth.module"
import { UserMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { ProjectsModule } from "@/domains/projects/projects.module"
import { UsersModule } from "@/domains/users/users.module"
import { LlmModule } from "@/external/llm/llm.module"
import { Agent } from "../agents/agent.entity"
import { Evaluation } from "./evaluation.entity"
import { EvaluationGuard } from "./evaluation.guard"
import { EvaluationsController } from "./evaluations.controller"
import { EvaluationsService } from "./evaluations.service"
import { EvaluationReport } from "./reports/evaluation-report.entity"
import { EvaluationReportGuard } from "./reports/evaluation-report.guard"
import { EvaluationReportsController } from "./reports/evaluation-reports.controller"
import { EvaluationReportsService } from "./reports/evaluation-reports.service"

@Module({
  imports: [
    LlmModule,
    TypeOrmModule.forFeature([
      Evaluation,
      Project,
      Organization,
      UserMembership,
      ProjectMembership,
      EvaluationReport,
      Agent,
    ]),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    AgentContextResolver,
    EvaluationContextResolver,
    EvaluationGuard,
    EvaluationReportContextResolver,
    EvaluationReportGuard,
    EvaluationReportsService,
    EvaluationsService,
    OrganizationContextResolver,
    ProjectContextResolver,
    ResourceContextGuard,
  ],
  controllers: [EvaluationsController, EvaluationReportsController],
  exports: [EvaluationsService, EvaluationReportsService],
})
export class EvaluationsModule {}
