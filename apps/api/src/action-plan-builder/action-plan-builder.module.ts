import { Module } from '@nestjs/common';
import { StaticActionPlanBuilderService } from './action-plan-builder-static.service';
import { AIActionPlanBuilderService } from './action-plan-builder-ai.service';
import { ActionPlanBuilderController } from './action-plan-builder.controller';
import { NotionModule } from '../notion/notion.module';
import { FranceTravailModule } from '../francetravail/francetravail.module';
import { DataInclusionModule } from '../datainclusion/datainclusion.module';
import { GeolocModule } from '../geoloc/geoloc.module';

// Choose which implementation to use
// Use 'StaticActionPlanBuilderService' for static mock data
// Use 'AIActionPlanBuilderService' for AI-powered generation (when implemented)
const ActionPlanBuilderService = AIActionPlanBuilderService;

@Module({
  imports: [NotionModule, FranceTravailModule, DataInclusionModule, GeolocModule],
  controllers: [ActionPlanBuilderController],
  providers: [
    StaticActionPlanBuilderService,
    AIActionPlanBuilderService,
    {
      provide: 'ActionPlanBuilderService',
      useClass: ActionPlanBuilderService,
    },
  ],
  exports: ['ActionPlanBuilderService'],
})
export class ActionPlanBuilderModule {}