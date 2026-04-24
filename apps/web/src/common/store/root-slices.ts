import { combineSlices } from "@reduxjs/toolkit"
import { backofficeSlice } from "@/backoffice/features/backoffice/backoffice.slice"
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
import { reviewCampaignsReviewerSlice } from "@/studio/features/review-campaigns/reviewer/reviewer.slice"
import { reviewCampaignsTesterSlice } from "@/studio/features/review-campaigns/tester/tester.slice"

// Shared slices: always available in both Studio and Desk interfaces.
// Studio-only slices are declared as lazy and injected via injectStudioSlices().

export const rootSliceList = [
  agentSessionMessagesSlice,
  agentsSlice,
  authSlice,
  backofficeSlice,
  conversationAgentSessionsSlice,
  currentAgentSessionIdSlice,
  extractionAgentSessionsSlice,
  formAgentSessionsSlice,
  meSlice,
  notificationsSlice,
  organizationsSlice,
  projectsSlice,
  reviewCampaignsReviewerSlice,
  reviewCampaignsTesterSlice,
]

export const rootSlices = combineSlices(
  ...rootSliceList.map((slice) => ({ [slice.name]: slice.reducer })),
)
