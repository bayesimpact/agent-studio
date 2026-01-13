import { Module } from "@nestjs/common"
import { ActionPlanBuilderModule } from "../action-plan-builder/action-plan-builder.module"
import { AIModule } from "../ai/ai.module"
import { NotionModule } from "../notion/notion.module"
import { ChatController } from "./chat.controller"
import { ChatRepository } from "./chat.repository"
import { ChatService } from "./chat.service"

@Module({
  imports: [AIModule, NotionModule, ActionPlanBuilderModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
