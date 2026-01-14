import { Module } from '@nestjs/common';
import { IndeedJobsService } from './indeed-jobs.service';

@Module({
  providers: [IndeedJobsService],
  exports: [IndeedJobsService],
})
export class IndeedModule {}