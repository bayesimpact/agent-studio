import { Module } from '@nestjs/common';
import { FranceTravailJobsService } from './francetravail-jobs.service';
import { FranceTravailEventsService } from './francetravail-events.service';

@Module({
  providers: [
    FranceTravailJobsService,
    FranceTravailEventsService,
  ],
  exports: [
    FranceTravailJobsService,
    FranceTravailEventsService,
  ],
})
export class FranceTravailModule {}