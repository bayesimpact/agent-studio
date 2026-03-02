import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { AgentSessionContextResolver } from "@/common/context/resolvers/agent-session-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { Agent } from "@/domains/agents/agent.entity"
import { AuthModule } from "@/domains/auth/auth.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { UsersModule } from "@/domains/users/users.module"
import { LlmModule } from "@/external/llm/llm.module"
import { AISDKMockProvider } from "@/external/llm/providers/ai-sdk-mock.provider"
import { AISDKVertexProvider } from "@/external/llm/providers/ai-sdk-vertex.provider"
import { Document } from "../../documents/document.entity"
import { DocumentsModule } from "../../documents/documents.module"
import { StorageModule } from "../../documents/storage/storage.module"
import { Organization } from "../../organizations/organization.entity"
import { OrganizationsModule } from "../../organizations/organizations.module"
import { Project } from "../../projects/project.entity"
import { ProjectsModule } from "../../projects/projects.module"
import { AgentsModule } from "../agents.module"
import { BaseAgentSessionGuard } from "../base-agent-sessions/base-agent-session.guard"
import { ConversationAgentSessionsController } from "./conversation-agent-controller"
import { ConversationAgentSession } from "./conversation-agent-session.entity"
import { ConversationAgentSessionStreamingController } from "./conversation-agent-session-streaming.controller"
import { ConversationAgentSessionsService } from "./conversation-agent-sessions.service"
import { AgentStreamingService } from "./conversation-agent-streaming.service"
import { AgentMessage } from "./messages/agent-message.entity"
import { AgentMessagesController } from "./messages/agent-messages.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentMessage,
      ConversationAgentSession,
      Document,
      Organization,
      Project,
      ProjectMembership,
      UserMembership,
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
    AgentStreamingService,
    BaseAgentSessionGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    ResourceContextGuard,
    {
      provide: "VertexLLMProvider",
      useClass: AISDKVertexProvider,
    },
    {
      provide: "_MockLLMProvider",
      useClass: AISDKMockProvider,
    },
  ],
  controllers: [
    AgentMessagesController,
    ConversationAgentSessionStreamingController,
    ConversationAgentSessionsController,
  ],
  exports: [ConversationAgentSessionsService, AgentStreamingService],
})
export class ConversationAgentSessionsModule {}
