import { combineSlices } from "@reduxjs/toolkit"
import { conversationAgentSessionsSlice } from "@/common/features/agents/agent-sessions/conversation/conversation-agent-sessions.slice"
import { currentAgentSessionIdSlice } from "@/common/features/agents/agent-sessions/current-agent-session-id/current-agent-session-id.slice"
import { extractionAgentSessionsSlice } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.slice"
import { formAgentSessionsSlice } from "@/common/features/agents/agent-sessions/form/form-agent-sessions.slice"
import { agentSessionMessagesSlice } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.slice"
import { agentsSlice } from "@/common/features/agents/agents.slice"
import { authSlice } from "@/common/features/auth/auth.slice"
import { meSlice } from "@/common/features/me/me.slice"
import { notificationsSlice } from "@/common/features/notifications/notifications.slice"
import { organizationsSlice } from "@/common/features/organizations/organizations.slice"
import { projectsSlice } from "@/common/features/projects/projects.slice"
import { currentReviewCampaignIdSlice } from "@/common/features/review-campaigns/current-review-campaign-id/current-review-campaign-id.slice"
import { currentReviewerSessionIdSlice } from "@/common/features/review-campaigns/current-reviewer-session-id/current-reviewer-session-id.slice"
import { reviewCampaignsReportsSlice } from "@/studio/features/review-campaigns/reports/reports.slice"

// Shared slices: always available in both Studio and Desk interfaces.
// Tester / reviewer slices are scoped to their respective interfaces and
// injected lazily via injectTesterSlices / injectReviewerSlices.

export const rootSliceList = [
  agentSessionMessagesSlice,
  agentsSlice,
  authSlice,
  conversationAgentSessionsSlice,
  currentAgentSessionIdSlice,
  currentReviewCampaignIdSlice,
  currentReviewerSessionIdSlice,
  extractionAgentSessionsSlice,
  formAgentSessionsSlice,
  meSlice,
  notificationsSlice,
  organizationsSlice,
  projectsSlice,
  reviewCampaignsReportsSlice,
]

export const rootSlices = combineSlices(
  ...rootSliceList.map((slice) => ({ [slice.name]: slice.reducer })),
)
