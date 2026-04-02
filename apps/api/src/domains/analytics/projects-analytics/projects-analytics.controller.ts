import { AnalyticsRoutes as Routes } from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequestWithProject } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { ProjectsAnalyticsGuard } from "./projects-analytics.guard"
import { toAnalyticsDailyPointDto } from "./projects-analytics.helpers"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsAnalyticsService } from "./projects-analytics.service"
import type { AnalyticsDailyPoint } from "./projects-analytics.types"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, ProjectsAnalyticsGuard)
@RequireContext("organization", "project")
@Controller()
export class ProjectsAnalyticsController {
  constructor(private readonly projectsAnalyticsService: ProjectsAnalyticsService) {}

  @Get(Routes.getConversationsPerDay.path)
  @CheckPolicy((policy) => policy.canList())
  async getConversationsPerDay(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof Routes.getConversationsPerDay.request,
  ): Promise<typeof Routes.getConversationsPerDay.response> {
    const conversationsPerDay: AnalyticsDailyPoint[] =
      await this.projectsAnalyticsService.getConversationsPerDay({
        connectScope: getRequiredConnectScope(request),
        startAt: payload.startAt,
        endAt: payload.endAt,
      })

    return { data: toAnalyticsDailyPointDto(conversationsPerDay) }
  }

  @Get(Routes.getAvgUserQuestionsPerSessionPerDay.path)
  @CheckPolicy((policy) => policy.canList())
  async getAvgUserQuestionsPerSessionPerDay(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof Routes.getAvgUserQuestionsPerSessionPerDay.request,
  ): Promise<typeof Routes.getAvgUserQuestionsPerSessionPerDay.response> {
    const avgUserQuestionsPerSessionPerDay: AnalyticsDailyPoint[] =
      await this.projectsAnalyticsService.getAvgUserQuestionsPerSessionPerDay({
        connectScope: getRequiredConnectScope(request),
        startAt: payload.startAt,
        endAt: payload.endAt,
      })

    return { data: toAnalyticsDailyPointDto(avgUserQuestionsPerSessionPerDay) }
  }
}
