import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { Agent } from "@/domains/agents/agent.entity"
import { AuthModule } from "@/domains/auth/auth.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { UsersModule } from "@/domains/users/users.module"
import { AgentMessage } from "./agent-message.entity"
import { AgentMessagesController } from "./agent-messages.controller"
import { AgentSession } from "./agent-session.entity"
import { AgentSessionStreamingController } from "./agent-session-streaming.controller"
import { AgentSessionsService } from "./agent-sessions.service"
import { AgentStreamingService } from "./agent-streaming.service"
import { AppPrivateSessionGuard } from "./app-private-session.guard"
import { AppPrivateSessionsController } from "./app-private-sessions.controller"
import { PlaygroundSessionGuard } from "./playground-session.guard"
import { PlaygroundSessionsController } from "./playground-sessions.controller"
import { AISDKLLMProvider } from "./providers/ai-sdk-llm.provider"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentSession,
      AgentMessage,
      Agent,
      UserMembership,
      Project,
      ProjectMembership,
    ]),
    UsersModule,
    AuthModule,
  ],
  providers: [
    AgentSessionsService,
    AppPrivateSessionGuard,
    PlaygroundSessionGuard,
    ResourceContextGuard,
    OrganizationContextResolver,
    AgentContextResolver,
    ProjectContextResolver,
    AgentStreamingService,
    {
      provide: "LLMProvider",
      useClass: AISDKLLMProvider,
    },
  ],
  controllers: [
    PlaygroundSessionsController,
    AppPrivateSessionsController,
    AgentMessagesController,
    AgentSessionStreamingController,
  ],
  exports: [AgentSessionsService, AgentStreamingService],
})
export class AgentSessionsModule {}
