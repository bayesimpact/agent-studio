import { Module } from '@nestjs/common';
import { JobListProvider } from './joblist.provider';

@Module({
  providers: [JobListProvider],
  exports: [JobListProvider],
})
export class JobListModule {}