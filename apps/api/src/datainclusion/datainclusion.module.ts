import { Module } from '@nestjs/common';
import { DataInclusionService } from './datainclusion.service';

@Module({
  providers: [DataInclusionService],
  exports: [DataInclusionService],
})
export class DataInclusionModule {}