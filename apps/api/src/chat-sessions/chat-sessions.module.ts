import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { ChatSession } from "./chat-session.entity"
import { ChatSessionsController } from "./chat-sessions.controller"
import { ChatSessionsService } from "./chat-sessions.service"
import { ChatStreamingService } from "./chat-streaming.service"
import { AISDKLLMProvider } from "./providers/ai-sdk-llm.provider"

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatBot, UserMembership])],
  providers: [
    ChatSessionsService,
    ChatStreamingService,
    {
      provide: "LLMProvider",
      useClass: AISDKLLMProvider,
    },
  ],
  controllers: [ChatSessionsController],
  exports: [ChatSessionsService, ChatStreamingService],
})
export class ChatSessionsModule {}
