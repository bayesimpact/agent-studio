import type { Meta, StoryObj } from "@storybook/react-vite"
import { CampaignReport } from "@/studio/features/review-campaigns/reports/components/CampaignReport"
import { mockCampaignReport, mockEmptyCampaignReport } from "./fixtures"

const meta = {
  title: "review-campaigns/reports/CampaignReport",
  component: CampaignReport,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CampaignReport>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  args: { report: mockCampaignReport },
}

export const Empty: Story = {
  args: { report: mockEmptyCampaignReport },
}
