import { Module } from '@nestjs/common';
import { NotionWorkshopService } from './notion-workshop.service';

@Module({
  providers: [NotionWorkshopService],
  exports: [NotionWorkshopService],
})
export class NotionModule {}