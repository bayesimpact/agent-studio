import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { ReviewerCampaignLanding } from "@/reviewer/features/review-campaigns/components/ReviewerCampaignLanding"
import { mockCampaignContext, mockReviewerSessions } from "./fixtures"

const meta = {
  title: "review-campaigns/reviewer/ReviewerCampaignLanding",
  component: ReviewerCampaignLanding,
  parameters: { layout: "fullscreen" },
  args: {
    context: mockCampaignContext,
    onOpenSession: fn(),
  },
} satisfies Meta<typeof ReviewerCampaignLanding>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { sessions: [] },
}

export const WithMixedSessions: Story = {
  args: { sessions: mockReviewerSessions },
}

export const SingleSession: Story = {
  args: { sessions: [mockReviewerSessions[0]!] },
}
