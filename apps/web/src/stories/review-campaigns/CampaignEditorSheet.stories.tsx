import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import type { Project } from "@/common/features/projects/projects.models"
import { CampaignEditorSheet } from "@/studio/features/review-campaigns/components/CampaignEditorSheet"
import { withRedux } from "../decorators/with-redux"
import { mockActiveCampaign, mockAgents, mockDraftCampaign, mockMemberships } from "./fixtures"
import { buildMockReviewCampaignsService } from "./mock-service"

const mockProject: Project = {
  id: "proj-1",
  name: "Demo project",
  organizationId: "org-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  featureFlags: [],
}

const meta = {
  title: "review-campaigns/CampaignEditorSheet",
  component: CampaignEditorSheet,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    agents: mockAgents,
    onClose: fn(),
  },
} satisfies Meta<typeof CampaignEditorSheet>

export default meta
type Story = StoryObj<typeof meta>

export const CreateOpen: Story = {
  args: {
    mode: "create",
  },
  decorators: [
    withRedux({
      currentProject: mockProject,
      servicesMock: { reviewCampaigns: buildMockReviewCampaignsService() },
    }),
  ],
}

export const EditDraft: Story = {
  args: {
    mode: "edit",
    reviewCampaignId: mockDraftCampaign.id,
  },
  decorators: [
    withRedux({
      currentProject: mockProject,
      selectedReviewCampaignDetail: { ...mockDraftCampaign, memberships: [] },
      servicesMock: { reviewCampaigns: buildMockReviewCampaignsService() },
    }),
  ],
}

export const EditActive: Story = {
  args: {
    mode: "edit",
    reviewCampaignId: mockActiveCampaign.id,
  },
  decorators: [
    withRedux({
      currentProject: mockProject,
      selectedReviewCampaignDetail: {
        ...mockActiveCampaign,
        memberships: mockMemberships,
      },
      servicesMock: { reviewCampaigns: buildMockReviewCampaignsService() },
    }),
  ],
}
