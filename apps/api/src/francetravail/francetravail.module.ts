import { Module } from '@nestjs/common';
import { FranceTravailJobsService } from './francetravail-jobs.service';
import { FranceTravailEventsService } from './francetravail-events.service';
import { FranceTravailLaBonneBoiteService } from './francetravail-labonneboite.service';

@Module({
  providers: [
    FranceTravailJobsService,
    FranceTravailEventsService,
    FranceTravailLaBonneBoiteService,
  ],
  exports: [
    FranceTravailJobsService,
    FranceTravailEventsService,
    FranceTravailLaBonneBoiteService,
  ],
})
export class FranceTravailModule {}