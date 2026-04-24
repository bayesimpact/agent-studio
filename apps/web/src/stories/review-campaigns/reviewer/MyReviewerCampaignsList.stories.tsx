import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { MyReviewerCampaignsList } from "@/studio/features/review-campaigns/reviewer/components/MyReviewerCampaignsList"
import { mockMyReviewerCampaigns } from "./fixtures"

const meta = {
  title: "review-campaigns/reviewer/MyReviewerCampaignsList",
  component: MyReviewerCampaignsList,
  parameters: { layout: "padded" },
  args: {
    onOpen: fn(),
  },
} satisfies Meta<typeof MyReviewerCampaignsList>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { campaigns: [] },
}

export const WithCampaigns: Story = {
  args: { campaigns: mockMyReviewerCampaigns },
}
