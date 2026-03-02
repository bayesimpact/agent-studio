import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { AuthModule } from "@/domains/auth/auth.module"
import { ConversationAgentSessionsModule } from "@/domains/conversation-agent-sessions/conversation-agent-sessions.module"
import { DocumentsModule } from "@/domains/documents/documents.module"
import { StorageModule } from "@/domains/documents/storage/storage.module"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { UsersModule } from "@/domains/users/users.module"
import { LlmModule } from "@/external/llm/llm.module"
import { ProjectsModule } from "../projects/projects.module"
import { Agent } from "./agent.entity"
import { AgentGuard } from "./agent.guard"
import { AgentsController } from "./agents.controller"
import { AgentsService } from "./agents.service"
import { ExtractionAgentSession } from "./extraction-agent-sessions/extraction-agent-session.entity"
import { ExtractionAgentSessionsController } from "./extraction-agent-sessions/extraction-agent-sessions.controller"
import { ExtractionAgentSessionsGuard } from "./extraction-agent-sessions/extraction-agent-sessions.guard"
import { ExtractionAgentSessionsService } from "./extraction-agent-sessions/extraction-agent-sessions.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      ExtractionAgentSession,
      Project,
      UserMembership,
      ProjectMembership,
    ]),
    LlmModule,
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
    DocumentsModule,
    StorageModule,
    forwardRef(() => ConversationAgentSessionsModule),
  ],
  providers: [
    AgentsService,
    ExtractionAgentSessionsService,
    ExtractionAgentSessionsGuard,
    AgentGuard,
    ResourceContextGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    AgentContextResolver,
  ],
  controllers: [AgentsController, ExtractionAgentSessionsController],
  exports: [AgentsService, ExtractionAgentSessionsService],
})
export class AgentsModule {}
