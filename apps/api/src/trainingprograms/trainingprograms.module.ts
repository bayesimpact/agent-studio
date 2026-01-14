import { Module } from '@nestjs/common';
import { TrainingProgramsService } from './trainingprograms.service';

@Module({
  providers: [TrainingProgramsService],
  exports: [TrainingProgramsService],
})
export class TrainingProgramsModule {}