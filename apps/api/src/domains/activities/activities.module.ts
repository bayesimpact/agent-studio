import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ActivitiesService } from "./activities.service"
import { Activity } from "./activity.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
