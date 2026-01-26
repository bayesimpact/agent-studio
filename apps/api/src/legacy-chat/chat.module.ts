import { Module } from "@nestjs/common"
import { AIModule } from "../ai/ai.module"
import { ChatController } from "./chat.controller"
import { ChatRepository } from "./chat.repository"
import { ChatService } from "./chat.service"

@Module({
  imports: [AIModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
