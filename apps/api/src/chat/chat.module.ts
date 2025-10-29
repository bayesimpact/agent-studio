import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AIModule } from '../ai/ai.module';
import { ChatRepository } from './chat.repository';
import { NotionModule } from '../notion/notion.module';
import { CarePlanBuilderModule } from '../care-plan-builder/care-plan-builder.module';

@Module({
  imports: [
    AIModule,
    NotionModule,
    CarePlanBuilderModule,
    // TEMPORARILY DISABLED - Using simplified care plan builder instead
    // ResourcesModule,
    // GeolocModule,
    // FranceTravailModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}