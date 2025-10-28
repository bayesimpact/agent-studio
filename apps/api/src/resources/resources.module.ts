import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { DataInclusionModule } from '../datainclusion/datainclusion.module';
import { NotionModule } from '../notion/notion.module';

@Module({
  imports: [FranceTravailModule, DataInclusionModule, NotionModule],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}