import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import type { Project } from "@/common/features/projects/projects.models"
import { TesterMyCampaignsPage } from "@/tester/features/review-campaigns/components/TesterMyCampaignsPage"
import { withRedux } from "../../decorators/with-redux"
import { mockMyCampaigns } from "./fixtures"
import { buildMockTesterService } from "./mock-service"

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
  title: "review-campaigns/tester/pages/TesterMyCampaignsPage",
  component: TesterMyCampaignsPage,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter],
} satisfies Meta<typeof TesterMyCampaignsPage>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      myReviewCampaigns: [],
      servicesMock: {
        reviewCampaignsTester: buildMockTesterService({ myCampaigns: [] }),
      },
    }),
  ],
}

export const WithCampaigns: Story = {
  decorators: [
    withRedux({
      currentProject: mockProject,
      myReviewCampaigns: mockMyCampaigns,
      servicesMock: {
        reviewCampaignsTester: buildMockTesterService({ myCampaigns: mockMyCampaigns }),
      },
    }),
  ],
}
