import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import { ReviewerCampaignsList } from "@/reviewer/features/review-campaigns/components/ReviewerCampaignsList"
import { mockMyReviewerCampaigns } from "./fixtures"

const meta = {
  title: "review-campaigns/reviewer/ReviewerCampaignsList",
  component: ReviewerCampaignsList,
  parameters: { layout: "padded" },
  args: {},
  decorators: [withRouter],
} satisfies Meta<typeof ReviewerCampaignsList>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { campaigns: [] },
}

export const WithCampaigns: Story = {
  args: { campaigns: mockMyReviewerCampaigns },
}
