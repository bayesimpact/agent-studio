import type { Meta, StoryObj } from "@storybook/react-vite"
import { CampaignSummaryPanel } from "@/studio/features/review-campaigns/components/CampaignSummaryPanel"

const meta = {
  title: "review-campaigns/CampaignSummaryPanel",
  component: CampaignSummaryPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CampaignSummaryPanel>

export default meta
type Story = StoryObj<typeof meta>

export const WithActivity: Story = {
  args: {
    aggregates: { meanTesterRating: 4.36, surveyCount: 7, sessionCount: 18 },
  },
}

export const NoActivity: Story = {
  args: {
    aggregates: { meanTesterRating: null, surveyCount: 0, sessionCount: 0 },
  },
}

export const NotClosedYet: Story = {
  args: {
    aggregates: null,
  },
}
