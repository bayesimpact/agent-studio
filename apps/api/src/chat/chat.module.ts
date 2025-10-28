import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AIModule } from '../ai/ai.module';
import { ChatRepository } from './chat.repository';
import { ResourcesModule } from '../resources/resources.module';
import { GeolocModule } from '../geoloc/geoloc.module';
import { CarePlanModule } from '../care-plan/care-plan.module';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { ProfileModule } from '../profile/profile.module';
import { NotionModule } from '../notion/notion.module';

@Module({
  imports: [AIModule, ResourcesModule, GeolocModule, CarePlanModule, FranceTravailModule, ProfileModule, NotionModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}