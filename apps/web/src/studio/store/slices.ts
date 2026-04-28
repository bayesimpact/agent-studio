import { combineReducers } from "@reduxjs/toolkit"
import type { AppDispatch } from "@/common/store"
import { rootSlices } from "@/common/store/root-slices"
import { agentMembershipsMiddleware } from "@/studio/features/agent-memberships/agent-memberships.middleware"
import { agentMembershipsSlice } from "@/studio/features/agent-memberships/agent-memberships.slice"
import { agentMessageFeedbackMiddleware } from "@/studio/features/agent-message-feedback/agent-message-feedback.middleware"
import { agentMessageFeedbackSlice } from "@/studio/features/agent-message-feedback/agent-message-feedback.slice"
import { agentAnalyticsMiddleware } from "@/studio/features/analytics/agent/agent-analytics.middleware"
import { agentAnalyticsSlice } from "@/studio/features/analytics/agent/agent-analytics.slice"
import { projectAnalyticsMiddleware } from "@/studio/features/analytics/project/analytics.middleware"
import { projectAnalyticsSlice } from "@/studio/features/analytics/project/analytics.slice"
import { documentTagsMiddleware } from "@/studio/features/document-tags/document-tags.middleware"
import { documentTagsSlice } from "@/studio/features/document-tags/document-tags.slice"
import { evaluationReportsMiddleware } from "@/studio/features/evaluation-reports/evaluation-reports.middleware"
import { evaluationReportsSlice } from "@/studio/features/evaluation-reports/evaluation-reports.slice"
import { evaluationsMiddleware } from "@/studio/features/evaluations/evaluations.middleware"
import { evaluationsSlice } from "@/studio/features/evaluations/evaluations.slice"
import { projectMembershipsMiddleware } from "@/studio/features/project-memberships/project-memberships.middleware"
import { projectMembershipsSlice } from "@/studio/features/project-memberships/project-memberships.slice"
import { reviewCampaignsMiddleware } from "@/studio/features/review-campaigns/review-campaigns.middleware"
import { reviewCampaignsSlice } from "@/studio/features/review-campaigns/review-campaigns.slice"
import { dynamicMiddleware } from "../../common/store/dynamic-middleware"
import { studioAgentsMiddleware } from "../features/agents/agents.middleware"
import { documentsMiddleware } from "../features/documents/documents.middleware"
import { documentsSlice } from "../features/documents/documents.slice"
import { studioProjectsMiddleware } from "../features/projects/projects.middleware"
import type { StudioState } from "./types"

let middlewareInjected = false

const studioMiddlewareList = [
  projectAnalyticsMiddleware,
  agentAnalyticsMiddleware,
  agentMembershipsMiddleware,
  agentMessageFeedbackMiddleware,
  documentsMiddleware,
  documentTagsMiddleware,
  evaluationReportsMiddleware,
  evaluationsMiddleware,
  projectMembershipsMiddleware,
  reviewCampaignsMiddleware,
  studioProjectsMiddleware,
  studioAgentsMiddleware,
]

export const studioSliceList = [
  projectAnalyticsSlice,
  agentAnalyticsSlice,
  agentMembershipsSlice,
  agentMessageFeedbackSlice,
  documentsSlice,
  documentTagsSlice,
  evaluationReportsSlice,
  evaluationsSlice,
  projectMembershipsSlice,
  reviewCampaignsSlice,
]

const studioReducers = combineReducers(
  Object.assign({}, ...studioSliceList.map((slice) => ({ [slice.name]: slice.reducer }))),
)

export function injectStudioSlices() {
  const rr = rootSlices.withLazyLoadedSlices<StudioState>()
  // Reducers: inject() is idempotent — safe to call on every mount
  rr.inject({
    reducerPath: "studio",
    // @ts-expect-error - TypeScript cannot infer the type of the combined reducers, but it is correct
    reducer: studioReducers,
  })

  // Middleware: addMiddleware is NOT idempotent — guard against duplicate registration
  if (!middlewareInjected) {
    middlewareInjected = true
    studioMiddlewareList.forEach((m) => {
      dynamicMiddleware.addMiddleware(m.listenerMiddleware.middleware)
      m.registerListeners()
    })
  }
}

export function resetStudioSlices(dispatch: AppDispatch) {
  middlewareInjected = false // reset the guard so middleware can be re-added
  studioSliceList.forEach((slice) => {
    dispatch(slice.actions.reset())
  })
  studioMiddlewareList.forEach((m) => {
    m.listenerMiddleware.clearListeners()
  })
}
