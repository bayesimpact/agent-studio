import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Agent } from "@/agents/agent.entity"
import { AuthModule } from "@/auth/auth.module"
import { UserMembership } from "@/organizations/user-membership.entity"
import { UsersModule } from "@/users/users.module"
import { AgentMessage } from "./agent-message.entity"
import { AgentMessagesController } from "./agent-messages.controller"
import { AgentSession } from "./agent-session.entity"
import { AgentSessionStreamingController } from "./agent-session-streaming.controller"
import { AgentSessionsController } from "./agent-sessions.controller"
import { AgentSessionsService } from "./agent-sessions.service"
import { AgentStreamingService } from "./agent-streaming.service"
import { AISDKLLMProvider } from "./providers/ai-sdk-llm.provider"

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentSession, AgentMessage, Agent, UserMembership]),
    UsersModule,
    AuthModule,
  ],
  providers: [
    AgentSessionsService,
    AgentStreamingService,
    {
      provide: "LLMProvider",
      useClass: AISDKLLMProvider,
    },
  ],
  controllers: [AgentSessionsController, AgentMessagesController, AgentSessionStreamingController],
  exports: [AgentSessionsService, AgentStreamingService],
})
export class AgentSessionsModule {}
