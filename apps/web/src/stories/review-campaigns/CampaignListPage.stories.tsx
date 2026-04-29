import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import type { Agent } from "@/common/features/agents/agents.models"
import type { Project } from "@/common/features/projects/projects.models"
import { CampaignListPage } from "@/studio/features/review-campaigns/components/CampaignListPage"
import { withRedux } from "../decorators/with-redux"
import { mockActiveCampaign, mockAgents, mockClosedCampaign, mockDraftCampaign } from "./fixtures"
import { buildMockReviewCampaignsService } from "./mock-service"

const mockProject: Project = {
  id: "proj-1",
  name: "Demo project",
  organizationId: "org-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  featureFlags: [],
  agentCategories: [],
}

const meta = {
  title: "review-campaigns/CampaignListPage",
  component: CampaignListPage,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter],
} satisfies Meta<typeof CampaignListPage>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      agents: [],
      reviewCampaigns: [],
      servicesMock: {
        reviewCampaigns: buildMockReviewCampaignsService({ campaigns: [] }),
      },
    }),
  ],
}

export const WithCampaigns: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      agents: mockAgents as Agent[],
      reviewCampaigns: [mockDraftCampaign, mockActiveCampaign, mockClosedCampaign],
      servicesMock: {
        reviewCampaigns: buildMockReviewCampaignsService({
          campaigns: [mockDraftCampaign, mockActiveCampaign, mockClosedCampaign],
        }),
      },
    }),
  ],
}
