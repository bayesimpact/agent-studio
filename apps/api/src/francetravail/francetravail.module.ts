import { Module } from '@nestjs/common';
import { FranceTravailService } from './francetravail.service';

@Module({
  providers: [FranceTravailService],
  exports: [FranceTravailService],
})
export class FranceTravailModule {}