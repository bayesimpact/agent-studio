import { Module } from '@nestjs/common';
import { NotionWorkshopService } from './notion-workshop.service';
import { NotionBeneficiaryService } from './notion-beneficiary.service';
import { NotionMethodologyService } from './notion-methodology.service';

@Module({
  providers: [NotionWorkshopService, NotionBeneficiaryService, NotionMethodologyService],
  exports: [NotionWorkshopService, NotionBeneficiaryService, NotionMethodologyService],
})
export class NotionModule {}