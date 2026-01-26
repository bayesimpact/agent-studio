import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ChatSession } from "./chat-session.entity"
import { ChatSessionsService } from "./chat-sessions.service"
import { ChatStreamingService } from "./chat-streaming.service"
import { AISDKLLMProvider } from "./providers/ai-sdk-llm.provider"

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession])],
  providers: [
    ChatSessionsService,
    ChatStreamingService,
    {
      provide: "LLMProvider",
      useClass: AISDKLLMProvider,
    },
  ],
  exports: [ChatSessionsService, ChatStreamingService],
})
export class ChatSessionsModule {}
