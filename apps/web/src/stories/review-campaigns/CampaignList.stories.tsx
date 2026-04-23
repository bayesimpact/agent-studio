import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { CampaignListTable } from "@/studio/features/review-campaigns/components/CampaignListTable"
import { mockActiveCampaign, mockClosedCampaign, mockDraftCampaign } from "./fixtures"

const meta = {
  title: "review-campaigns/CampaignList",
  component: CampaignListTable,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    onEdit: fn(),
    onDelete: fn(),
    onCreate: fn(),
  },
} satisfies Meta<typeof CampaignListTable>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    campaigns: [],
  },
}

export const WithMix: Story = {
  args: {
    campaigns: [mockDraftCampaign, mockActiveCampaign, mockClosedCampaign],
    membershipCountByCampaign: {
      [mockDraftCampaign.id]: 0,
      [mockActiveCampaign.id]: 7,
      [mockClosedCampaign.id]: 12,
    },
  },
}
