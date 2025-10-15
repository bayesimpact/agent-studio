import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AIModule } from '../ai/ai.module';
import { ChatRepository } from './chat.repository';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { DataInclusionModule } from '../datainclusion/datainclusion.module';
import { GeolocModule } from '../geoloc/geoloc.module';
import { JobListModule } from '../joblist/joblist.module';

@Module({
  imports: [AIModule, FranceTravailModule, DataInclusionModule, GeolocModule, JobListModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}