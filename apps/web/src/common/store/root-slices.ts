import { combineSlices } from "@reduxjs/toolkit"
import { agentsSlice } from "@/common/features/agents/agents.slice"
import { authSlice } from "@/common/features/auth/auth.slice"
import { meSlice } from "@/common/features/me/me.slice"
import { notificationsSlice } from "@/common/features/notifications/notifications.slice"
import { organizationsSlice } from "@/common/features/organizations/organizations.slice"
import { projectsSlice } from "@/common/features/projects/projects.slice"
import { conversationAgentSessionsSlice } from "@/features/agents/agent-sessions/conversation/conversation-agent-sessions.slice"
import { currentAgentSessionIdSlice } from "@/features/agents/agent-sessions/current-agent-session-id/current-agent-session-id.slice"
import { extractionAgentSessionsSlice } from "@/features/agents/agent-sessions/extraction/extraction-agent-sessions.slice"
import { formAgentSessionsSlice } from "@/features/agents/agent-sessions/form/form-agent-sessions.slice"
import { agentSessionMessagesSlice } from "@/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.slice"

// Shared slices: always available in both Studio and Desk interfaces.
// Studio-only slices are declared as lazy and injected via injectStudioSlices().

export const rootSliceList = [
  agentSessionMessagesSlice,
  agentsSlice,
  authSlice,
  conversationAgentSessionsSlice,
  currentAgentSessionIdSlice,
  extractionAgentSessionsSlice,
  formAgentSessionsSlice,
  meSlice,
  notificationsSlice,
  organizationsSlice,
  projectsSlice,
]

export const rootSlices = combineSlices(
  ...rootSliceList.map((slice) => ({ [slice.name]: slice.reducer })),
)
