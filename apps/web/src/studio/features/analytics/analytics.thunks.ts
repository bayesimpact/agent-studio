import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/common/store"
import { getCurrentIds } from "@/features/helpers"
import { hasFeatureOrThrow } from "@/hooks/use-feature-flags"
import type { AnalyticsDailyPoint } from "./analytics.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const loadProjectAnalytics = createAsyncThunk<
  {
    conversationsPerDay: AnalyticsDailyPoint[]
    avgUserQuestionsPerSessionPerDay: AnalyticsDailyPoint[]
  },
  { startAt: number; endAt: number },
  ThunkConfig
>("analytics/loadProject", async ({ startAt, endAt }, { extra: { services }, getState }) => {
  const state = getState()
  hasFeatureOrThrow({ state, feature: "project-analytics" })
  const { organizationId, projectId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  const [conversationsPerDay, avgUserQuestionsPerSessionPerDay] = await Promise.all([
    services.analytics.getConversationsPerDay({ organizationId, projectId, startAt, endAt }),
    services.analytics.getAvgUserQuestionsPerSessionPerDay({
      organizationId,
      projectId,
      startAt,
      endAt,
    }),
  ])
  return { conversationsPerDay, avgUserQuestionsPerSessionPerDay }
})
