import { combineSlices } from "@reduxjs/toolkit"
import type { agentMembershipsSliceReducer } from "@/features/agent-memberships/agent-memberships.slice"
import type { agentMessageFeedbackSliceReducer } from "@/features/agent-message-feedback/agent-message-feedback.slice"
import { agentsSliceReducer } from "@/features/agents/agents.slice"
import { conversationAgentSessionsSliceReducer } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.slice"
import { currentAgentSessionIdSliceReducer } from "@/features/agents/current-agent-session-id/current-agent-session-id.slice"
import { extractionAgentSessionsSliceReducer } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.slice"
import { formAgentSessionsSliceReducer } from "@/features/agents/form-agent-sessions/form-agent-sessions.slice"
import { agentSessionMessagesSliceReducer } from "@/features/agents/shared/agent-session-messages/agent-session-messages.slice"
import type { analyticsSliceReducer } from "@/features/analytics/analytics.slice"
import { authSliceReducer } from "@/features/auth/auth.slice"
import type { documentTagsSliceReducer } from "@/features/document-tags/document-tags.slice"
import type { evaluationReportsSliceReducer } from "@/features/evaluation-reports/evaluation-reports.slice"
import type { evaluationsSliceReducer } from "@/features/evaluations/evaluations.slice"
import { meSliceReducer } from "@/features/me/me.slice"
import { notificationsSliceReducer } from "@/features/notifications/notifications.slice"
import { organizationsSliceReducer } from "@/features/organizations/organizations.slice"
import type { projectMembershipsSliceReducer } from "@/features/project-memberships/project-memberships.slice"
import { projectsSliceReducer } from "@/features/projects/projects.slice"
import type { documentsSliceReducer } from "@/studio/features/documents/documents.slice"

export type StudioLazySlices = {
  analytics: ReturnType<typeof analyticsSliceReducer>
  agentMemberships: ReturnType<typeof agentMembershipsSliceReducer>
  agentMessageFeedback: ReturnType<typeof agentMessageFeedbackSliceReducer>
  documents: ReturnType<typeof documentsSliceReducer>
  documentTags: ReturnType<typeof documentTagsSliceReducer>
  evaluationReports: ReturnType<typeof evaluationReportsSliceReducer>
  evaluations: ReturnType<typeof evaluationsSliceReducer>
  projectMemberships: ReturnType<typeof projectMembershipsSliceReducer>
}

// Shared slices: always available in both Studio and Desk interfaces.
// Studio-only slices are declared as lazy and injected via injectStudioSlices().
const rootReducer = combineSlices({
  auth: authSliceReducer,
  me: meSliceReducer,
  notifications: notificationsSliceReducer,
  organizations: organizationsSliceReducer,
  projects: projectsSliceReducer,
  agents: agentsSliceReducer,
  agentSessionMessages: agentSessionMessagesSliceReducer,
  conversationAgentSessions: conversationAgentSessionsSliceReducer,
  currentAgentSessionId: currentAgentSessionIdSliceReducer,
  extractionAgentSessions: extractionAgentSessionsSliceReducer,
  formAgentSessions: formAgentSessionsSliceReducer,
}).withLazyLoadedSlices<StudioLazySlices>()

export { rootReducer }
