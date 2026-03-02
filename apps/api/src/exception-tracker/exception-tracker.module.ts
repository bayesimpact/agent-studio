import { Global, Module } from "@nestjs/common"
import { APP_FILTER } from "@nestjs/core"
import { ExceptionTrackerFilter } from "./exception-tracker.filter"
import { PosthogService } from "./posthog.service"
import { EXCEPTION_TRACKER_SERVICE } from "./types"

@Global()
@Module({
  providers: [
    {
      provide: EXCEPTION_TRACKER_SERVICE,
      useClass: PosthogService,
    },
    PosthogService,
    {
      provide: APP_FILTER,
      useClass: ExceptionTrackerFilter,
    },
  ],
  exports: [EXCEPTION_TRACKER_SERVICE, PosthogService],
})
export class ExceptionTrackerModule {}
