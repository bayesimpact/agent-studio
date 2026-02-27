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
import { AgentMessage } from "../agent-sessions/messages/agent-message.entity"
import { AgentMessagesController } from "../agent-sessions/messages/agent-messages.controller"
import { AgentsModule } from "../agents/agents.module"
import { Document } from "../documents/document.entity"
import { DocumentsModule } from "../documents/documents.module"
import { StorageModule } from "../documents/storage/storage.module"
import { Organization } from "../organizations/organization.entity"
import { OrganizationsModule } from "../organizations/organizations.module"
import { Project } from "../projects/project.entity"
import { ProjectsModule } from "../projects/projects.module"
import { AgentSession } from "./agent-session.entity"
import { AgentSessionStreamingController } from "./agent-session-streaming.controller"
import { AgentSessionsService } from "./agent-sessions.service"
import { AgentStreamingService } from "./agent-streaming.service"
import { AppPrivateSessionGuard } from "./app-private/app-private-session.guard"
import { AppPrivateSessionsController } from "./app-private/app-private-sessions.controller"
import { PlaygroundSessionGuard } from "./playground/playground-session.guard"
import { PlaygroundSessionsController } from "./playground/playground-sessions.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentMessage,
      AgentSession,
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
    AgentSessionsService,
    AgentStreamingService,
    AppPrivateSessionGuard,
    OrganizationContextResolver,
    PlaygroundSessionGuard,
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
    AgentSessionStreamingController,
    AppPrivateSessionsController,
    PlaygroundSessionsController,
  ],
  exports: [AgentSessionsService, AgentStreamingService],
})
export class AgentSessionsModule {}
