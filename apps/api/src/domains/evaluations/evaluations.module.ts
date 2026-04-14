import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { DocumentContextResolver } from "@/common/context/resolvers/document-context.resolver"
import { EvaluationContextResolver } from "@/common/context/resolvers/evaluation-context.resolver"
import { EvaluationDatasetContextResolver } from "@/common/context/resolvers/evaluation-dataset-context.resolver"
import { EvaluationReportContextResolver } from "@/common/context/resolvers/evaluation-report-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { AuthModule } from "@/domains/auth/auth.module"
import { DocumentsModule } from "@/domains/documents/documents.module"
import { StorageModule } from "@/domains/documents/storage/storage.module"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { ProjectsModule } from "@/domains/projects/projects.module"
import { UsersModule } from "@/domains/users/users.module"
import { LlmModule } from "@/external/llm/llm.module"
import { Agent } from "../agents/agent.entity"
import { AgentMembership } from "../agents/memberships/agent-membership.entity"
import { EvaluationDataset } from "./datasets/evaluation-dataset.entity"
import { EvaluationDatasetGuard } from "./datasets/evaluation-dataset.guard"
import { EvaluationDatasetDocument } from "./datasets/evaluation-dataset-document.entity"
import { EvaluationDatasetsController } from "./datasets/evaluation-datasets.controller"
import { EvaluationDatasetsService } from "./datasets/evaluation-datasets.service"
import { EvaluationDatasetRecord } from "./datasets/records/evaluation-dataset-record.entity"
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
      Agent,
      AgentMembership,
      Evaluation,
      EvaluationDataset,
      EvaluationDatasetDocument,
      EvaluationDatasetRecord,
      EvaluationReport,
      Organization,
      OrganizationMembership,
      Project,
      ProjectMembership,
    ]),
    DocumentsModule,
    StorageModule,
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    AgentContextResolver,
    EvaluationContextResolver,
    DocumentContextResolver,
    EvaluationDatasetContextResolver,
    EvaluationDatasetGuard,
    EvaluationDatasetsService,
    EvaluationGuard,
    EvaluationReportContextResolver,
    EvaluationReportGuard,
    EvaluationReportsService,
    EvaluationsService,
    OrganizationContextResolver,
    ProjectContextResolver,
    ResourceContextGuard,
  ],
  controllers: [EvaluationsController, EvaluationDatasetsController, EvaluationReportsController],
  exports: [EvaluationsService, EvaluationDatasetsService, EvaluationReportsService],
})
export class EvaluationsModule {}
