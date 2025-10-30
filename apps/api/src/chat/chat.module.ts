import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AIModule } from '../ai/ai.module';
import { ChatRepository } from './chat.repository';
import { NotionModule } from '../notion/notion.module';
import { ActionPlanBuilderModule } from '../action-plan-builder/action-plan-builder.module';

@Module({
  imports: [
    AIModule,
    NotionModule,
    ActionPlanBuilderModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}