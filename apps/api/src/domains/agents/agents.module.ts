import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { ConversationAgentSessionsModule } from "@/domains/agents/conversation-agent-sessions/conversation-agent-sessions.module"
import { AuthModule } from "@/domains/auth/auth.module"
import { DocumentsModule } from "@/domains/documents/documents.module"
import { StorageModule } from "@/domains/documents/storage/storage.module"
import { DocumentTagsModule } from "@/domains/documents/tags/document-tags.module"
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
import { ExtractionAgentSessionsService } from "./extraction-agent-sessions/extraction-agent-sessions.service"
import { FormAgentSession } from "./form-agent-sessions/form-agent-session.entity"
import { FormAgentSessionsController } from "./form-agent-sessions/form-agent-sessions.controller"
import { FormAgentSessionsService } from "./form-agent-sessions/form-agent-sessions.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      ExtractionAgentSession,
      FormAgentSession,
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
    DocumentTagsModule,
    StorageModule,
    forwardRef(() => ConversationAgentSessionsModule),
  ],
  providers: [
    AgentsService,
    ExtractionAgentSessionsService,
    FormAgentSessionsService,
    AgentGuard,
    ResourceContextGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    AgentContextResolver,
  ],
  controllers: [AgentsController, ExtractionAgentSessionsController, FormAgentSessionsController],
  exports: [AgentsService, ExtractionAgentSessionsService, FormAgentSessionsService],
})
export class AgentsModule {}
