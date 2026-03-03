import { Global, Module } from "@nestjs/common"
import { ExceptionTrackerFilter } from "./exception-tracker.filter"
import { PosthogService } from "./posthog.service"
import { EXCEPTION_TRACKER_SERVICE } from "./types"

@Global()
@Module({
  providers: [
    PosthogService,
    {
      provide: EXCEPTION_TRACKER_SERVICE,
      useExisting: PosthogService,
    },
    ExceptionTrackerFilter,
  ],
  exports: [EXCEPTION_TRACKER_SERVICE, PosthogService, ExceptionTrackerFilter],
})
export class ExceptionTrackerModule {}
