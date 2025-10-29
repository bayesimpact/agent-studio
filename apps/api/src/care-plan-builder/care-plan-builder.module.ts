import { Module } from '@nestjs/common';
import { StaticCarePlanBuilderService } from './care-plan-builder-static.service';
import { AICarePlanBuilderService } from './care-plan-builder-ai.service';
import { NotionModule } from '../notion/notion.module';

// Choose which implementation to use
// Use 'StaticCarePlanBuilderService' for static mock data
// Use 'AICarePlanBuilderService' for AI-powered generation (when implemented)
const CarePlanBuilderService = AICarePlanBuilderService;

@Module({
  imports: [NotionModule],
  providers: [
    StaticCarePlanBuilderService,
    AICarePlanBuilderService,
    {
      provide: 'CarePlanBuilderService',
      useClass: CarePlanBuilderService,
    },
  ],
  exports: ['CarePlanBuilderService'],
})
export class CarePlanBuilderModule {}