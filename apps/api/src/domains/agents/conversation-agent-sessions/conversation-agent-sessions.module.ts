import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { AgentSessionContextResolver } from "@/common/context/resolvers/agent-session-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { Agent } from "@/domains/agents/agent.entity"
import { AgentsModule } from "@/domains/agents/agents.module"
import { BaseAgentSessionGuard } from "@/domains/agents/base-agent-sessions/base-agent-session.guard"
import { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
import { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"
import { StreamingController } from "@/domains/agents/shared/agent-session-messages/streaming/streaming.controller"
import { StreamingService } from "@/domains/agents/shared/agent-session-messages/streaming/streaming.service"
import { AuthModule } from "@/domains/auth/auth.module"
import { Document } from "@/domains/documents/document.entity"
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
import { AgentMessagesController } from "../shared/agent-session-messages/agent-messages.controller"
import { ConversationAgentSessionsController } from "./conversation-agent-controller"
import { ConversationAgentSession } from "./conversation-agent-session.entity"
import { ConversationAgentSessionsService } from "./conversation-agent-sessions.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentMessage,
      ConversationAgentSession,
      FormAgentSession,
      Document,
      Organization,
      Project,
      ProjectMembership,
      OrganizationMembership,
    ]),
    LlmModule,
    AuthModule,
    DocumentsModule,
    forwardRef(() => AgentsModule),
    OrganizationsModule,
    ProjectsModule,
    StorageModule,
    UsersModule,
  ],
  providers: [
    AgentContextResolver,
    AgentSessionContextResolver,
    ConversationAgentSessionsService,
    StreamingService,
    BaseAgentSessionGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    ResourceContextGuard,
  ],
  controllers: [AgentMessagesController, StreamingController, ConversationAgentSessionsController],
  exports: [ConversationAgentSessionsService, StreamingService],
})
export class ConversationAgentSessionsModule {}
