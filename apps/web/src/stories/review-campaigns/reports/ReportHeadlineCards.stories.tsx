import type { Meta, StoryObj } from "@storybook/react-vite"
import { ReportHeadlineCards } from "@/studio/features/review-campaigns/reports/components/ReportHeadlineCards"
import { mockEmptyCampaignReport, mockHeadline } from "./fixtures"

const meta = {
  title: "review-campaigns/reports/ReportHeadlineCards",
  component: ReportHeadlineCards,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ReportHeadlineCards>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  args: { headline: mockHeadline },
}

export const Empty: Story = {
  args: { headline: mockEmptyCampaignReport.headline },
}
