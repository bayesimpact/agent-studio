import { agentMembershipsMiddleware } from "@/features/agent-memberships/agent-memberships.middleware"
import { agentMembershipsSliceReducer } from "@/features/agent-memberships/agent-memberships.slice"
import { agentMessageFeedbackMiddleware } from "@/features/agent-message-feedback/agent-message-feedback.middleware"
import { agentMessageFeedbackSliceReducer } from "@/features/agent-message-feedback/agent-message-feedback.slice"
import { analyticsMiddleware } from "@/features/analytics/analytics.middleware"
import { analyticsSliceReducer } from "@/features/analytics/analytics.slice"
import { documentTagsMiddleware } from "@/features/document-tags/document-tags.middleware"
import { documentTagsSliceReducer } from "@/features/document-tags/document-tags.slice"
import { evaluationReportsMiddleware } from "@/features/evaluation-reports/evaluation-reports.middleware"
import { evaluationReportsSliceReducer } from "@/features/evaluation-reports/evaluation-reports.slice"
import { evaluationsMiddleware } from "@/features/evaluations/evaluations.middleware"
import { evaluationsSliceReducer } from "@/features/evaluations/evaluations.slice"
import { projectMembershipsMiddleware } from "@/features/project-memberships/project-memberships.middleware"
import { projectMembershipsSliceReducer } from "@/features/project-memberships/project-memberships.slice"
import { dynamicMiddleware } from "../../store/dynamic-middleware"
import { rootReducer } from "../../store/root-reducer"
import { documentsMiddleware } from "../features/documents/documents.middleware"
import { documentsSliceReducer } from "../features/documents/documents.slice"

let injected = false

export function injectStudioSlices() {
  if (injected) return
  injected = true

  // Inject reducers
  rootReducer.inject({ reducerPath: "analytics", reducer: analyticsSliceReducer })
  rootReducer.inject({ reducerPath: "agentMemberships", reducer: agentMembershipsSliceReducer })
  rootReducer.inject({
    reducerPath: "agentMessageFeedback",
    reducer: agentMessageFeedbackSliceReducer,
  })
  rootReducer.inject({ reducerPath: "documents", reducer: documentsSliceReducer })
  rootReducer.inject({ reducerPath: "documentTags", reducer: documentTagsSliceReducer })
  rootReducer.inject({ reducerPath: "evaluationReports", reducer: evaluationReportsSliceReducer })
  rootReducer.inject({ reducerPath: "evaluations", reducer: evaluationsSliceReducer })
  rootReducer.inject({
    reducerPath: "projectMemberships",
    reducer: projectMembershipsSliceReducer,
  })

  // Inject middleware
  dynamicMiddleware.addMiddleware(
    analyticsMiddleware.middleware,
    agentMembershipsMiddleware.middleware,
    agentMessageFeedbackMiddleware.middleware,
    documentsMiddleware.middleware,
    documentTagsMiddleware.middleware,
    evaluationReportsMiddleware.middleware,
    evaluationsMiddleware.middleware,
    projectMembershipsMiddleware.middleware,
  )
}
