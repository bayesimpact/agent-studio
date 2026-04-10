import { createAsyncThunk } from "@reduxjs/toolkit"
import { getCurrentIds } from "@/common/features/helpers"
import { hasFeatureOrThrow } from "@/common/hooks/use-feature-flags"
import type { RootState, ThunkExtraArg } from "@/common/store"
import type { AnalyticsDailyPoint } from "./analytics.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const loadProjectAnalytics = createAsyncThunk<
  {
    conversationsPerDay: AnalyticsDailyPoint[]
    avgUserQuestionsPerSessionPerDay: AnalyticsDailyPoint[]
  },
  { startAt: number; endAt: number },
  ThunkConfig
>("projectAnalytics/loadProject", async ({ startAt, endAt }, { extra: { services }, getState }) => {
  const state = getState()
  hasFeatureOrThrow({ state, feature: "project-analytics" })
  const { organizationId, projectId } = getCurrentIds({
    state,
    wantedIds: ["organizationId", "projectId"],
  })
  const [conversationsPerDay, avgUserQuestionsPerSessionPerDay] = await Promise.all([
    services.projectAnalytics.getConversationsPerDay({ organizationId, projectId, startAt, endAt }),
    services.projectAnalytics.getAvgUserQuestionsPerSessionPerDay({
      organizationId,
      projectId,
      startAt,
      endAt,
    }),
  ])
  return { conversationsPerDay, avgUserQuestionsPerSessionPerDay }
})
