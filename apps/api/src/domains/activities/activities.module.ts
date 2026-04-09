import { Module } from "@nestjs/common"
import { APP_INTERCEPTOR } from "@nestjs/core"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ActivitiesInterceptor } from "./activities.interceptor"
import { ActivitiesService } from "./activities.service"
import { Activity } from "./activity.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  providers: [
    ActivitiesService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivitiesInterceptor,
    },
  ],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
