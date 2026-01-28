import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/auth/auth.module"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { UsersModule } from "@/users/users.module"
import { ChatSession } from "./chat-session.entity"
import { ChatSessionMessagesController } from "./chat-session-messages.controller"
import { ChatSessionStreamingController } from "./chat-session-streaming.controller"
import { ChatSessionsController } from "./chat-sessions.controller"
import { ChatSessionsService } from "./chat-sessions.service"
import { ChatStreamingService } from "./chat-streaming.service"
import { AISDKLLMProvider } from "./providers/ai-sdk-llm.provider"

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatBot, UserMembership]),
    UsersModule,
    AuthModule,
  ],
  providers: [
    ChatSessionsService,
    ChatStreamingService,
    {
      provide: "LLMProvider",
      useClass: AISDKLLMProvider,
    },
  ],
  controllers: [
    ChatSessionsController,
    ChatSessionMessagesController,
    ChatSessionStreamingController,
  ],
  exports: [ChatSessionsService, ChatStreamingService],
})
export class ChatSessionsModule {}
