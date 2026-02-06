import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Agent } from "@/agents/agent.entity"
import { AuthModule } from "@/auth/auth.module"
import { UserMembership } from "@/organizations/user-membership.entity"
import { UsersModule } from "@/users/users.module"
import { AgentSession } from "./agent-session.entity"
import { AgentSessionStreamingController } from "./agent-session-streaming.controller"
import { AgentSessionsController } from "./agent-sessions.controller"
import { AgentSessionsService } from "./agent-sessions.service"
import { ChatMessage } from "./chat-message.entity"
import { ChatMessagesController } from "./chat-messages.controller"
import { ChatStreamingService } from "./chat-streaming.service"
import { AISDKLLMProvider } from "./providers/ai-sdk-llm.provider"

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentSession, ChatMessage, Agent, UserMembership]),
    UsersModule,
    AuthModule,
  ],
  providers: [
    AgentSessionsService,
    ChatStreamingService,
    {
      provide: "LLMProvider",
      useClass: AISDKLLMProvider,
    },
  ],
  controllers: [AgentSessionsController, ChatMessagesController, AgentSessionStreamingController],
  exports: [AgentSessionsService, ChatStreamingService],
})
export class AgentSessionsModule {}
