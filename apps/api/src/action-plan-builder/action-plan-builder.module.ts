import { Module } from "@nestjs/common"
import { DataInclusionModule } from "../datainclusion/datainclusion.module"
import { FranceTravailModule } from "../francetravail/francetravail.module"
import { GeolocModule } from "../geoloc/geoloc.module"
import { NotionModule } from "../notion/notion.module"
import { ActionPlanBuilderController } from "./action-plan-builder.controller"
import { AIActionPlanBuilderService } from "./action-plan-builder-ai.service"
import { StaticActionPlanBuilderService } from "./action-plan-builder-static.service"

// Choose which implementation to use
// Use 'StaticActionPlanBuilderService' for static mock data
// Use 'AIActionPlanBuilderService' for AI-powered generation (when implemented)
const ActionPlanBuilderService = AIActionPlanBuilderService

@Module({
  imports: [NotionModule, FranceTravailModule, DataInclusionModule, GeolocModule],
  controllers: [ActionPlanBuilderController],
  providers: [
    StaticActionPlanBuilderService,
    AIActionPlanBuilderService,
    {
      provide: "ActionPlanBuilderService",
      useClass: ActionPlanBuilderService,
    },
  ],
  exports: ["ActionPlanBuilderService"],
})
export class ActionPlanBuilderModule {}
