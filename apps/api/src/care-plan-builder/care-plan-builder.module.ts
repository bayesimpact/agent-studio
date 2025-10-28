import { Module } from '@nestjs/common';
import { StaticCarePlanBuilderService } from './care-plan-builder-static.service';
import { AICarePlanBuilderService } from './care-plan-builder-ai.service';

// Choose which implementation to use
// Use 'StaticCarePlanBuilderService' for static mock data
// Use 'AICarePlanBuilderService' for AI-powered generation (when implemented)
const CarePlanBuilderService = StaticCarePlanBuilderService;

@Module({
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