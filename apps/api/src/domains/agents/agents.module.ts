import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { AgentSessionsModule } from "@/domains/agent-sessions/agent-sessions.module"
import { AuthModule } from "@/domains/auth/auth.module"
import { DocumentsModule } from "@/domains/documents/documents.module"
import { StorageModule } from "@/domains/documents/storage/storage.module"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { UsersModule } from "@/domains/users/users.module"
import { AISDKVertexProvider } from "@/external/llm/providers/ai-sdk-vertex.provider"
import { ProjectsModule } from "../projects/projects.module"
import { Agent } from "./agent.entity"
import { AgentGuard } from "./agent.guard"
import { AgentExtractionRun } from "./agent-extraction-runs/agent-extraction-run.entity"
import { AgentExtractionRunsController } from "./agent-extraction-runs/agent-extraction-runs.controller"
import { AgentExtractionRunsGuard } from "./agent-extraction-runs/agent-extraction-runs.guard"
import { AgentExtractionRunsService } from "./agent-extraction-runs/agent-extraction-runs.service"
import { AgentsController } from "./agents.controller"
import { AgentsService } from "./agents.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentExtractionRun,
      Project,
      UserMembership,
      ProjectMembership,
    ]),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
    DocumentsModule,
    StorageModule,
    forwardRef(() => AgentSessionsModule),
  ],
  providers: [
    AgentsService,
    AgentExtractionRunsService,
    AgentExtractionRunsGuard,
    AgentGuard,
    ResourceContextGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    AgentContextResolver,
    {
      provide: "LLMProvider",
      useClass: AISDKVertexProvider,
    },
  ],
  controllers: [AgentsController, AgentExtractionRunsController],
  exports: [AgentsService, AgentExtractionRunsService],
})
export class AgentsModule {}
