import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import { agentFactory } from "@/common/features/agents/agent.factory"
import { agentSettingsFactory } from "@/common/features/agents/agent-settings/agent-settings.factory"
import type { Agent } from "@/common/features/agents/agents.models"
import { CampaignsRoute } from "@/studio/routes/CampaignsRoute"
import { withRedux } from "../decorators"
import { mergeSeeds, seed } from "../seed"
import { mockActiveCampaign, mockClosedCampaign, mockDraftCampaign, mockProject } from "./fixtures"
import { buildMockReviewCampaignsService } from "./mock-service"

// Distinct from the `mockAgents` fixture (a CampaignFormAgentOption[] used to
// seed the form's agent options directly) — this seeds the `agents` slice,
// which needs full Agent objects.
const mockListAgents = [
  agentFactory
    .transient({ project: mockProject })
    .build({ id: "agent-1", name: "Helpful Assistant", type: "conversation" }),
  agentFactory
    .transient({ project: mockProject })
    .build({ id: "agent-2", name: "Scheduling Bot", type: "conversation" }),
  agentFactory
    .transient({ project: mockProject })
    .build({ id: "agent-3", name: "Intake Form Agent", type: "conversation" }),
]

// The campaign form's "Agent version" select reads the published settings history of the
// selected agent, so without these seeds the create sheet shows it empty and disabled.
function buildAgentHistorySeeds(agents: Agent[]) {
  return agents.map((agent) =>
    seed.studio.agentHistory({
      agentId: agent.id,
      versions: [
        agentSettingsFactory.transient({ agent }).build({ revision: 2, name: "Clearer greeting" }),
        agentSettingsFactory.transient({ agent }).build({ revision: 1, name: "Initial version" }),
      ],
    }),
  )
}

const meta = {
  title: "review-campaigns/CampaignsRoute",
  component: CampaignsRoute,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter],
} satisfies Meta<typeof CampaignsRoute>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  decorators: [
    withRedux({
      state: mergeSeeds(
        seed.currentProject(mockProject),
        seed.agents([]),
        seed.studio.reviewCampaigns([]),
      ),
      services: {
        reviewCampaigns: buildMockReviewCampaignsService({ campaigns: [] }),
      },
    }),
  ],
}

export const WithCampaigns: Story = {
  decorators: [
    withRedux({
      state: mergeSeeds(
        seed.currentProject(mockProject),
        seed.agents(mockListAgents),
        ...buildAgentHistorySeeds(mockListAgents),
        seed.studio.reviewCampaigns([mockDraftCampaign, mockActiveCampaign, mockClosedCampaign]),
      ),
      services: {
        reviewCampaigns: buildMockReviewCampaignsService({
          campaigns: [mockDraftCampaign, mockActiveCampaign, mockClosedCampaign],
        }),
      },
    }),
  ],
}
