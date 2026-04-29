import type { Meta, StoryObj } from "@storybook/react-vite"
import { ReviewerCampaignsList } from "@/reviewer/features/review-campaigns/components/ReviewerCampaignsList"
import { withRouter } from "@/stories/decorators/with-redux"
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
