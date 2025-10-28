import { Module } from '@nestjs/common';
import { NotionWorkshopService } from './notion-workshop.service';
import { NotionBeneficiaryService } from './notion-beneficiary.service';

@Module({
  providers: [NotionWorkshopService, NotionBeneficiaryService],
  exports: [NotionWorkshopService, NotionBeneficiaryService],
})
export class NotionModule {}