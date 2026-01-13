import { Module } from "@nestjs/common"
import { NotionBeneficiaryService } from "./notion-beneficiary.service"
import { NotionWorkshopService } from "./notion-workshop.service"

@Module({
  providers: [NotionWorkshopService, NotionBeneficiaryService],
  exports: [NotionWorkshopService, NotionBeneficiaryService],
})
export class NotionModule {}
