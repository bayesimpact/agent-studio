import { Module } from '@nestjs/common';
import { CommunityProgramsService } from './communityprograms.service';

@Module({
  providers: [CommunityProgramsService],
  exports: [CommunityProgramsService],
})
export class CommunityProgramsModule {}