import { Module } from '@nestjs/common';
import { PrendresoinController } from './prendresoin.controller';
import { PrendresoinService } from './prendresoin.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [PrendresoinController],
  providers: [PrendresoinService],
})
export class PrendresoinModule {}