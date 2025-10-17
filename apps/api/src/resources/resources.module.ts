import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { DataInclusionModule } from '../datainclusion/datainclusion.module';

@Module({
  imports: [FranceTravailModule, DataInclusionModule],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}