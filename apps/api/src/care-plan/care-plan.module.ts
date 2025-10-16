import { Module } from '@nestjs/common';
import { CarePlanProvider } from './care-plan.provider';

@Module({
  providers: [CarePlanProvider],
  exports: [CarePlanProvider],
})
export class CarePlanModule {}